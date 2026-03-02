import {
  BadRequestException,
  Injectable,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserImageTarget } from './schemas/user.schema';
import { UserCreateI, UserUpdateI } from './user.types';
import {
  PaginatedResponseType,
  ResponseType,
} from 'src/common/interfaces/response.types';
import { RoleService } from '../role/role.service';
import { FarmerService } from '../farmer/farmer.service';
import { InvestorService } from '../investor/investor.service';
import { LandOwnerService } from '../land-owner/land-owner.service';
import { AzureBlobStorageService } from '../../config/azure/services/azure-blob-storage.service';
import { File } from '../../common/schemas/file.schema';

const T = {
  duplicateUserFoundByEmail: 'User with this email already exists',
  userNotFoundById: (id: string) => `User with ID ${id} not found`,
  roleAlreadyAssigned: 'Role already assigned to user',
  roleNotAssigned: 'Role not assigned to user',
  roleNotFound: (role: string) => `Role ${role} not found`,
  userDoesNotHaveRole:
    'User does not have the required role for this operation',
  invalidTarget: 'Invalid target field specified',
  noFileProvided: 'No file provided',
};

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly roleService: RoleService,
    @Inject(forwardRef(() => FarmerService))
    private readonly farmerService: FarmerService,
    @Inject(forwardRef(() => InvestorService))
    private readonly investorService: InvestorService,
    @Inject(forwardRef(() => LandOwnerService))
    private readonly landOwnerService: LandOwnerService,
    private readonly azureBlobStorageService: AzureBlobStorageService,
  ) {}

  async findAll(
    page: number,
    limit: number,
    search: string,
    sort: string,
  ): Promise<PaginatedResponseType<User[]>> {
    const sortOptions: Record<string, 'asc' | 'desc'> = {};
    if (sort)
      sort.split(',').forEach((field) => {
        const isDesc = field.startsWith('-');
        const cleanField = field.replace(/^[+-]/, '').trim();
        sortOptions[cleanField] = isDesc ? 'desc' : 'asc';
      });

    const filter: FilterQuery<User> = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, totalDocs] = await Promise.all([
      this.userModel
        .find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    // // Enrich all users with file URLs
    // const enrichedData = await Promise.all(
    //   data.map((user) => this.enrichUserWithFileUrls(user)),
    // );

    const totalPages = Math.ceil(totalDocs / limit);

    return {
      data,
      pagination: {
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
        nextPage: page + 1,
        page,
        prevPage: page - 1,
        totalDocs,
        totalPages,
      },
    };
  }

  async findById(target: string): Promise<User> {
    const selectedUser = await this.userModel
      .findById(target)
      .populate('role')
      .exec();

    if (!selectedUser)
      throw new BadRequestException(T.userNotFoundById(target));

    return await this.enrichUserWithFileUrls(selectedUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(user: UserCreateI): Promise<User> {
    const existingUser = await this.userModel.findOne({
      email: user.email,
    });
    if (existingUser)
      throw new BadRequestException(T.duplicateUserFoundByEmail);

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const role = await this.roleService.findByName(user.role);
    if (!role) throw new BadRequestException(T.roleNotFound(user.role));

    const createdUser = await this.userModel.create({
      ...user,
      password: hashedPassword,
      personalInfo: {
        ...user.personalInfo,
        birthday: user.personalInfo.birthday
          ? new Date(user.personalInfo.birthday)
          : null,
      },
      role: new Types.ObjectId(role._id),
    });

    switch (role.name.toLowerCase()) {
      case 'farmer':
        if (user.farmerDetails)
          await this.farmerService.create({
            user: createdUser._id.toString(),
            ...user.farmerDetails,
          });
        break;
      case 'investor':
        if (user.investorDetails)
          await this.investorService.create({
            user: createdUser._id.toString(),
            ...user.investorDetails,
          });
        break;
      case 'landowner':
        if (user.landOwnerDetails)
          await this.landOwnerService.create({
            user: createdUser._id.toString(),
            ...user.landOwnerDetails,
          });
        break;
      default:
        throw new BadRequestException(T.roleNotFound(user.role));
    }

    return createdUser;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userModel
      .findOne({ email })
      .select('+password')
      .populate('role')
      .exec();
  }

  async assignRole(target: string, role: string): Promise<User | null> {
    const user = await this.findById(target);
    if (user.role) throw new BadRequestException(T.roleAlreadyAssigned);

    await this.roleService.findById(role);

    return this.userModel
      .findByIdAndUpdate(
        target,
        { role: new Types.ObjectId(role) },
        { new: true },
      )
      .exec();
  }

  async unassignRole(userId: string, role: string): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user.role || user.role._id.toString() !== role)
      throw new BadRequestException(T.roleNotAssigned);

    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $unset: { role: new Types.ObjectId(role) } },
        { new: true },
      )
      .exec();
  }

  async updateById(target: string, user: UserUpdateI): Promise<User | null> {
    await this.findById(target);

    return await this.userModel
      .findByIdAndUpdate(target, user, {
        new: true,
      })
      .exec();
  }

  async deleteById(target: string): Promise<ResponseType> {
    await this.findById(target);

    await this.userModel.deleteOne({ _id: target }).exec();

    return {
      message: 'User deleted successfully',
      statusCode: 200,
    };
  }

  async uploadMultipleFilesByFieldName(userId: string, files: any[]) {
    const user = await this.findById(userId);

    if (!files || files.length === 0)
      throw new BadRequestException(T.noFileProvided);

    const filesByTarget = new Map<string, any[]>();
    for (const file of files) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const targetFieldname: string = file.fieldname as string;
      if (!filesByTarget.has(targetFieldname))
        filesByTarget.set(targetFieldname, []);

      filesByTarget.get(targetFieldname)!.push(file);
    }

    for (const [targetName, targetFiles] of filesByTarget) {
      if (
        !Object.values(UserImageTarget).includes(targetName as UserImageTarget)
      )
        throw new BadRequestException(
          `Invalid target field name: ${targetName}. Must be one of: ${Object.values(UserImageTarget).join(', ')}`,
        );

      const target = targetName as UserImageTarget;

      const isFarmerTarget =
        target === UserImageTarget.GOVIJANA_SEVA_PASSBOOK ||
        target === UserImageTarget.GN_CERTIFICATE;

      const isLandOwnerTarget =
        target === UserImageTarget.BIMSAVIYA_CERTIFICATE ||
        target === UserImageTarget.LAND_IMAGES;

      if (isFarmerTarget) {
        for (const file of targetFiles) {
          await this.uploadFarmerFile(userId, file, target);
        }
      } else if (isLandOwnerTarget) {
        for (const file of targetFiles) {
          await this.uploadLandOwnerFile(userId, file, target);
        }
      } else {
        if (targetFiles.length > 1)
          console.warn(
            `Target ${target} does not support multiple files. Only the first file will be uploaded.`,
          );

        await this.deleteExistingFile(user, target);

        const userFolderPath = `${user.role.name.toLocaleLowerCase()}s/${userId}/${target}`;

        const uploadResult = await this.azureBlobStorageService.uploadFile(
          targetFiles[0],
          userFolderPath,
        );

        const fileData: Partial<File> = {
          filename: uploadResult.fileName,
          fileSize: uploadResult.size.toString(),
          mimeType: uploadResult.contentType,
        };

        const updateData = this.buildUpdateData(target, fileData);

        await this.userModel
          .findByIdAndUpdate(userId, updateData, { new: true })
          .exec();
      }
    }

    return await this.findById(userId);
  }

  private async enrichUserWithFileUrls(user: User): Promise<User> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userObj: Record<string, any> = user.toObject ? user.toObject() : user;

    // Add URLs for personal info files
    if (userObj.personalInfo) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (userObj.personalInfo.profilePicture?.filename) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        userObj.personalInfo.profilePicture.url =
          await this.azureBlobStorageService.getFileUrl(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            userObj.personalInfo.profilePicture.filename as string,
          );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (userObj.personalInfo.nicFrontImage?.filename) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        userObj.personalInfo.nicFrontImage.url =
          await this.azureBlobStorageService.getFileUrl(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            userObj.personalInfo.nicFrontImage.filename as string,
          );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (userObj.personalInfo.nicBackImage?.filename) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        userObj.personalInfo.nicBackImage.url =
          await this.azureBlobStorageService.getFileUrl(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            userObj.personalInfo.nicBackImage.filename as string,
          );
      }
    }

    // Add URLs for farmer files
    if (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      userObj.role?.name?.toLowerCase() === 'farmer'
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const farmer = await this.farmerService.findByUserId(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          userObj._id as string,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (farmer?.GovijanaSevaPassbookImage?.filename) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          farmer.GovijanaSevaPassbookImage.url =
            await this.azureBlobStorageService.getFileUrl(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              farmer.GovijanaSevaPassbookImage.filename as string,
            );
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (farmer?.gnCertificateImage?.filename) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          farmer.gnCertificateImage.url =
            await this.azureBlobStorageService.getFileUrl(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              farmer.gnCertificateImage.filename as string,
            );
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        userObj.farmer = farmer;
      } catch {
        // Farmer record not found, continue
      }
    }

    // Add URLs for landowner files
    if (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      userObj.role?.name?.toLowerCase() === 'landowner'
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const landOwner = await this.landOwnerService.findByUserId(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          userObj._id as string,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (landOwner?.landAddress?.bimsaviyaCertificate?.filename) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          landOwner.landAddress.bimsaviyaCertificate.url =
            await this.azureBlobStorageService.getFileUrl(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              landOwner.landAddress.bimsaviyaCertificate.filename as string,
            );
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (landOwner?.landAddress?.landImages?.length) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          for (const image of landOwner.landAddress.landImages) {
            if (image?.filename) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              image.url = await this.azureBlobStorageService.getFileUrl(
                image.filename as string,
              );
            }
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        userObj.landOwner = landOwner;
      } catch {
        // LandOwner record not found, continue
      }
    }

    return userObj as User;
  }

  private async deleteExistingFile(
    user: User,
    imageTarget: UserImageTarget,
  ): Promise<void> {
    let existingFile: File | undefined;

    switch (imageTarget) {
      case UserImageTarget.PROFILE_PICTURE:
        existingFile = user.personalInfo?.profilePicture;
        break;
      case UserImageTarget.NIC_FRONT:
        existingFile = user.personalInfo?.nicFrontImage;
        break;
      case UserImageTarget.NIC_BACK:
        existingFile = user.personalInfo?.nicBackImage;
        break;
    }

    if (existingFile && existingFile.filename) {
      try {
        await this.azureBlobStorageService.deleteFile(existingFile.filename);
      } catch {
        console.warn(
          `Failed to delete existing file: ${existingFile.filename}. Continuing with upload.`,
        );
      }
    }
  }

  private async uploadFarmerFile(
    target: string,
    file: any,
    imageTarget: UserImageTarget,
  ) {
    const farmer = await this.farmerService.findByUserId(target);

    await this.deleteFarmerExistingFile(farmer, imageTarget);

    const farmerFolderPath = `farmers/${farmer._id.toString()}/${imageTarget}`;

    const uploadResult = await this.azureBlobStorageService.uploadFile(
      file,
      farmerFolderPath,
    );

    const fileData: Partial<File> = {
      filename: uploadResult.fileName,
      fileSize: uploadResult.size.toString(),
      mimeType: uploadResult.contentType,
    };

    const updateField = this.buildFarmerUpdateField(imageTarget);

    const updateData = {
      [updateField]: fileData,
    };

    return await this.farmerService.updateById(
      farmer._id.toString(),
      updateData as any,
    );
  }

  private async uploadLandOwnerFile(
    userId: string,
    file: any,
    imageTarget: UserImageTarget,
  ) {
    const landOwner = await this.landOwnerService.findByUserId(userId);

    await this.deleteLandOwnerExistingFile(landOwner, imageTarget);

    const landOwnerFolderPath = `landowners/${landOwner._id.toString()}/${imageTarget}`;

    const uploadResult = await this.azureBlobStorageService.uploadFile(
      file,
      landOwnerFolderPath,
    );

    const fileData: Partial<File> = {
      filename: uploadResult.fileName,
      fileSize: uploadResult.size.toString(),
      mimeType: uploadResult.contentType,
    };

    const updateField = this.buildLandOwnerUpdateField(imageTarget);

    const updateData = {
      [updateField]: fileData,
    };

    return await this.landOwnerService.updateById(
      landOwner._id.toString(),
      updateData as any,
    );
  }

  private async deleteFarmerExistingFile(
    farmer: {
      GovijanaSevaPassbookImage?: File;
      gnCertificateImage?: File;
    },
    imageTarget: UserImageTarget,
  ): Promise<void> {
    let existingFile: File | undefined;

    switch (imageTarget) {
      case UserImageTarget.GOVIJANA_SEVA_PASSBOOK:
        existingFile = farmer.GovijanaSevaPassbookImage;
        break;
      case UserImageTarget.GN_CERTIFICATE:
        existingFile = farmer.gnCertificateImage;
        break;
    }

    if (existingFile && existingFile.filename) {
      try {
        await this.azureBlobStorageService.deleteFile(existingFile.filename);
      } catch {
        console.warn(
          `Failed to delete existing farmer file: ${existingFile.filename}. Continuing with upload.`,
        );
      }
    }
  }

  private buildUpdateData(
    target: UserImageTarget,
    fileData: Partial<File>,
  ): Record<string, any> {
    const updateMap: Partial<Record<UserImageTarget, string>> = {
      [UserImageTarget.PROFILE_PICTURE]: 'personalInfo.profilePicture',
      [UserImageTarget.NIC_FRONT]: 'personalInfo.nicFrontImage',
      [UserImageTarget.NIC_BACK]: 'personalInfo.nicBackImage',
    };

    const fieldPath = updateMap[target];
    if (!fieldPath) throw new BadRequestException(T.invalidTarget);

    return {
      [fieldPath]: fileData,
    };
  }

  private buildFarmerUpdateField(target: UserImageTarget): string {
    const updateMap: Partial<Record<UserImageTarget, string>> = {
      [UserImageTarget.GOVIJANA_SEVA_PASSBOOK]: 'GovijanaSevaPassbookImage',
      [UserImageTarget.GN_CERTIFICATE]: 'gnCertificateImage',
    };

    const fieldPath = updateMap[target];
    if (!fieldPath) throw new BadRequestException(T.invalidTarget);

    return fieldPath;
  }

  private async deleteLandOwnerExistingFile(
    landOwner: {
      landAddress?: {
        bimsaviyaCertificate?: File;
        landImages?: File[];
      };
    },
    imageTarget: UserImageTarget,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const landAddress = (landOwner as any)?.landAddress;

    if (!landAddress) return;

    switch (imageTarget) {
      case UserImageTarget.BIMSAVIYA_CERTIFICATE: {
        const existingFile = landAddress.bimsaviyaCertificate;
        if (existingFile && existingFile.filename) {
          try {
            await this.azureBlobStorageService.deleteFile(
              existingFile.filename,
            );
          } catch {
            console.warn(
              `Failed to delete existing bimsaviya certificate: ${existingFile.filename}. Continuing with upload.`,
            );
          }
        }
        break;
      }
      case UserImageTarget.LAND_IMAGES: {
        const existingFiles = landAddress.landImages;
        if (existingFiles && Array.isArray(existingFiles)) {
          for (const file of existingFiles) {
            if (file && file.filename) {
              try {
                await this.azureBlobStorageService.deleteFile(file.filename);
              } catch {
                console.warn(
                  `Failed to delete existing land image: ${file.filename}. Continuing with upload.`,
                );
              }
            }
          }
        }
        break;
      }
    }
  }

  private buildLandOwnerUpdateField(target: UserImageTarget): string {
    const updateMap: Partial<Record<UserImageTarget, string>> = {
      [UserImageTarget.BIMSAVIYA_CERTIFICATE]:
        'landAddress.bimsaviyaCertificate',
      [UserImageTarget.LAND_IMAGES]: 'landAddress.landImages',
    };

    const fieldPath = updateMap[target];
    if (!fieldPath) throw new BadRequestException(T.invalidTarget);

    return fieldPath;
  }
}
