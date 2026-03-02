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
    const selectedUser = await this.userModel.findById(target).exec();

    if (!selectedUser)
      throw new BadRequestException(T.userNotFoundById(target));

    return selectedUser;
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
      // case 'investor':
      //   if (user.investorDetails)
      //     await this.investorService.create({
      //       user: createdUser._id.toString(),
      //       ...user.investorDetails,
      //     });
      //   break;
      // case 'landowner':
      //   if (user.landOwnerDetails)
      //     await this.landOwnerService.create({
      //       user: createdUser._id.toString(),
      //       ...user.landOwnerDetails,
      //     });
      // break;
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

  async uploadFile(target: string, file: any, imageTarget: UserImageTarget) {
    const user = await this.findById(target);

    if (!file) throw new BadRequestException(T.noFileProvided);

    const isFarmerTarget =
      imageTarget === UserImageTarget.GOVIJANA_SEVA_PASSBOOK ||
      imageTarget === UserImageTarget.GN_CERTIFICATE;

    if (isFarmerTarget)
      return await this.uploadFarmerFile(target, file, imageTarget);

    await this.deleteExistingFile(user, imageTarget);

    const userFolderPath = `users/${target}/${imageTarget}`;

    const uploadResult = await this.azureBlobStorageService.uploadFile(
      file,
      userFolderPath,
    );

    const fileData: Partial<File> = {
      filename: uploadResult.fileName,
      fileSize: uploadResult.size.toString(),
      mimeType: uploadResult.contentType,
    };

    const updateData = this.buildUpdateData(imageTarget, fileData);

    return await this.userModel
      .findByIdAndUpdate(target, updateData, { new: true })
      .exec();
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
}
