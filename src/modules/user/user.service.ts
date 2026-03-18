import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  PaginatedResponseType,
  ResponseType,
} from 'src/common/interfaces/response.types';
import { File } from '../../common/schemas/file.schema';
import { AzureBlobStorageService } from '../../config/azure/services/azure-blob-storage.service';
import { FarmerService } from '../farmer/farmer.service';
import { InvestorService } from '../investor/investor.service';
import { LandOwnerService } from '../land-owner/land-owner.service';
import { RoleService } from '../role/role.service';
import {
  UserUploadCompleteDto,
  UserUploadRequestDto,
} from './dtos/user.upload.dto';
import { User, UserImageTarget } from './schemas/user.schema';
import {
  UserCreateI,
  UserUpdateI,
  UserUploadRequestResponseI,
} from './user.types';

const T = {
  duplicateUserFoundByEmail: 'User with this email already exists',
  userNotFoundById: (id: string) => `User with ID ${id} not found`,
  roleAlreadyAssigned: 'Role already assigned to user',
  roleNotAssigned: 'Role not assigned to user',
  roleNotFound: (role: string) => `Role ${role} not found`,
  userDoesNotHaveRole:
    'User does not have the required role for this operation',
  invalidTarget: 'Invalid target field specified',
  invalidTargetFieldName: (targetName: string) =>
    `Invalid target field name: ${targetName}. Must be one of: ${Object.values(UserImageTarget).join(', ')}`,
  noFileProvided: 'No file provided',
  userRoleRequiredForUploads: 'User role is required before uploading files',
  uploadFileOutsideTargetPath: (target: UserImageTarget) =>
    `Uploaded file does not match the expected path for target ${target}`,
  singleFileTargetDuplicate: (target: UserImageTarget) =>
    `Target ${target} only accepts a single file`,
  missingUploadedFiles: 'No uploaded files were provided for persistence',
  missingUploadContext: (target: UserImageTarget) =>
    `Upload context not found for target ${target}`,
  targetRoleMismatch: (target: UserImageTarget, role: string) =>
    `Target ${target} can only be used by ${role} users`,
};

interface UploadedFileDescriptor {
  target: UserImageTarget;
  fileName: string;
  size: number;
  mimeType: string;
}

interface UploadTargetContext {
  readonly target: UserImageTarget;
  readonly folderPath: string;
  readonly allowMultiple: boolean;
  readonly existingFiles: File[];
  persist(files: Partial<File>[]): Promise<void>;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

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
        .select('-statues')
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
    const selectedUser = await this.getUserDocumentById(target);

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
    const user = await this.getUserDocumentById(target);
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
    const user = await this.getUserDocumentById(userId);
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
    await this.getUserDocumentById(target);

    return await this.userModel
      .findByIdAndUpdate(target, user, {
        new: true,
      })
      .exec();
  }

  async deleteById(target: string): Promise<ResponseType> {
    await this.getUserDocumentById(target);

    await this.userModel.deleteOne({ _id: target }).exec();

    return {
      message: 'User deleted successfully',
      statusCode: 200,
    };
  }

  async createUploadRequests(
    userId: string,
    body: UserUploadRequestDto,
  ): Promise<UserUploadRequestResponseI> {
    const user = await this.getUserDocumentById(userId);
    this.validateTargetUsage(
      body.files.map((file) => file.target),
      true,
    );

    const targetContexts = await this.buildUploadTargetContexts(
      user,
      body.files.map((file) => file.target),
    );

    const files = await Promise.all(
      body.files.map(async (file) => {
        const targetContext = targetContexts.get(file.target);
        if (!targetContext)
          throw new BadRequestException(T.missingUploadContext(file.target));

        const fileName = this.azureBlobStorageService.createBlobFileName(
          file.originalName,
          targetContext.folderPath,
        );
        const uploadUrl = await this.azureBlobStorageService.generateUploadUrl(
          fileName,
          file.contentType,
        );

        return {
          target: file.target,
          fileName,
          uploadUrl: uploadUrl.url,
          method: uploadUrl.method,
          headers: uploadUrl.headers,
        };
      }),
    );

    return { files };
  }

  async completeUpload(userId: string, body: UserUploadCompleteDto) {
    const user = await this.getUserDocumentById(userId);
    this.validateTargetUsage(
      body.files.map((file) => file.target),
      true,
    );

    const targetContexts = await this.buildUploadTargetContexts(
      user,
      body.files.map((file) => file.target),
    );

    const uploadsByTarget = new Map<
      UserImageTarget,
      UploadedFileDescriptor[]
    >();

    for (const file of body.files) {
      const targetContext = targetContexts.get(file.target);
      if (!targetContext)
        throw new BadRequestException(T.missingUploadContext(file.target));

      this.ensureFileBelongsToTarget(file.fileName, targetContext);

      const uploadedFile = await this.azureBlobStorageService.getFileDetails(
        file.fileName,
      );

      const uploads = uploadsByTarget.get(file.target) ?? [];
      uploads.push({
        target: file.target,
        fileName: uploadedFile.fileName,
        size: uploadedFile.size || file.size,
        mimeType: uploadedFile.contentType || file.mimeType,
      });
      uploadsByTarget.set(file.target, uploads);
    }

    await this.persistUploadedFiles(targetContexts, uploadsByTarget, true);

    return this.findById(userId);
  }

  async uploadMultipleFilesByFieldName(userId: string, files: any[]) {
    const user = await this.getUserDocumentById(userId);

    if (!files || files.length === 0)
      throw new BadRequestException(T.noFileProvided);

    const groupedFiles = new Map<UserImageTarget, any[]>();
    for (const file of files) {
      const target = this.parseUploadTarget(file.fieldname as string);
      const currentFiles = groupedFiles.get(target) ?? [];
      currentFiles.push(file);
      groupedFiles.set(target, currentFiles);
    }

    const targetContexts = await this.buildUploadTargetContexts(
      user,
      Array.from(groupedFiles.keys()),
    );

    const uploadsByTarget = new Map<
      UserImageTarget,
      UploadedFileDescriptor[]
    >();

    for (const [target, targetFiles] of groupedFiles) {
      const targetContext = targetContexts.get(target);
      if (!targetContext)
        throw new BadRequestException(T.missingUploadContext(target));

      const filesToUpload = targetContext.allowMultiple
        ? targetFiles
        : [targetFiles[0]];

      if (!targetContext.allowMultiple && targetFiles.length > 1) {
        this.logger.warn(
          `Target ${target} does not support multiple files. Only the first file will be uploaded.`,
        );
      }

      const uploads: UploadedFileDescriptor[] = [];
      for (const targetFile of filesToUpload) {
        const uploadResult = await this.azureBlobStorageService.uploadFile(
          targetFile,
          targetContext.folderPath,
        );

        uploads.push({
          target,
          fileName: uploadResult.fileName,
          size: uploadResult.size,
          mimeType: uploadResult.contentType,
        });
      }

      uploadsByTarget.set(target, uploads);
    }

    await this.persistUploadedFiles(targetContexts, uploadsByTarget, false);

    return this.findById(userId);
  }

  private async enrichUserWithFileUrls(user: User): Promise<User> {
    const userObj: Record<string, any> = user.toObject ? user.toObject() : user;

    if (userObj.personalInfo) {
      if (userObj.personalInfo.profilePicture?.filename) {
        userObj.personalInfo.profilePicture.url =
          await this.azureBlobStorageService.getFileUrl(
            userObj.personalInfo.profilePicture.filename as string,
          );
      }
      if (userObj.personalInfo.nicFrontImage?.filename) {
        userObj.personalInfo.nicFrontImage.url =
          await this.azureBlobStorageService.getFileUrl(
            userObj.personalInfo.nicFrontImage.filename as string,
          );
      }
      if (userObj.personalInfo.nicBackImage?.filename) {
        userObj.personalInfo.nicBackImage.url =
          await this.azureBlobStorageService.getFileUrl(
            userObj.personalInfo.nicBackImage.filename as string,
          );
      }
    }

    if (userObj.role?.name?.toLowerCase() === 'farmer') {
      try {
        const farmer = await this.farmerService.findByUserId(
          userObj._id as string,
        );
        if (farmer?.GovijanaSevaPassbookImage?.filename) {
          farmer.GovijanaSevaPassbookImage.url =
            await this.azureBlobStorageService.getFileUrl(
              farmer.GovijanaSevaPassbookImage.filename as string,
            );
        }
        if (farmer?.gnCertificateImage?.filename) {
          farmer.gnCertificateImage.url =
            await this.azureBlobStorageService.getFileUrl(
              farmer.gnCertificateImage.filename as string,
            );
        }
        userObj.farmer = farmer;
      } catch {
        // Farmer record not found, continue
      }
    }

    if (userObj.role?.name?.toLowerCase() === 'landowner') {
      try {
        const landOwner = await this.landOwnerService.findByUserId(
          userObj._id as string,
        );
        if (landOwner?.landAddress?.bimsaviyaCertificate?.filename) {
          landOwner.landAddress.bimsaviyaCertificate.url =
            await this.azureBlobStorageService.getFileUrl(
              landOwner.landAddress.bimsaviyaCertificate.filename as string,
            );
        }
        if (landOwner?.landAddress?.landImages?.length) {
          for (const image of landOwner.landAddress.landImages) {
            if (image?.filename) {
              image.url = await this.azureBlobStorageService.getFileUrl(
                image.filename as string,
              );
            }
          }
        }
        userObj.landOwner = landOwner;
      } catch {
        // LandOwner record not found, continue
      }
    }

    if (userObj.role?.name?.toLowerCase() === 'investor') {
      try {
        const investor = await this.investorService.findByUserId(
          userObj._id as string,
        );
        userObj.investor = investor;
      } catch {
        // Investor record not found, continue
      }
    }

    return userObj as User;
  }

  private async getUserDocumentById(target: string): Promise<User> {
    const selectedUser = await this.userModel
      .findById(target)
      .populate('role')
      .select('-statues')
      .exec();

    if (!selectedUser)
      throw new BadRequestException(T.userNotFoundById(target));

    return selectedUser;
  }

  private parseUploadTarget(targetName: string): UserImageTarget {
    if (!Object.values(UserImageTarget).includes(targetName as UserImageTarget))
      throw new BadRequestException(T.invalidTargetFieldName(targetName));

    return targetName as UserImageTarget;
  }

  private validateTargetUsage(
    targets: UserImageTarget[],
    strictSingleTarget: boolean,
  ) {
    const counts = new Map<UserImageTarget, number>();

    for (const target of targets) {
      counts.set(target, (counts.get(target) ?? 0) + 1);
    }

    for (const [target, count] of counts) {
      if (count <= 1 || this.isMultiFileTarget(target)) continue;

      if (strictSingleTarget)
        throw new BadRequestException(T.singleFileTargetDuplicate(target));

      this.logger.warn(
        `Target ${target} received multiple files. Only the first file will be kept.`,
      );
    }
  }

  private async buildUploadTargetContexts(
    user: User,
    targets: UserImageTarget[],
  ): Promise<Map<UserImageTarget, UploadTargetContext>> {
    const contexts = new Map<UserImageTarget, UploadTargetContext>();

    for (const target of new Set(targets)) {
      contexts.set(target, await this.resolveUploadTargetContext(user, target));
    }

    return contexts;
  }

  private async resolveUploadTargetContext(
    user: User,
    target: UserImageTarget,
  ): Promise<UploadTargetContext> {
    switch (target) {
      case UserImageTarget.PROFILE_PICTURE:
      case UserImageTarget.NIC_FRONT:
      case UserImageTarget.NIC_BACK:
        return this.buildUserUploadTargetContext(user, target);
      case UserImageTarget.GOVIJANA_SEVA_PASSBOOK:
      case UserImageTarget.GN_CERTIFICATE:
        return this.buildFarmerUploadTargetContext(user, target);
      case UserImageTarget.BIMSAVIYA_CERTIFICATE:
      case UserImageTarget.LAND_IMAGES:
        return this.buildLandOwnerUploadTargetContext(user, target);
      default:
        throw new BadRequestException(T.invalidTarget);
    }
  }

  private buildUserUploadTargetContext(
    user: User,
    target: UserImageTarget,
  ): UploadTargetContext {
    const userId = user._id.toString();
    const folderPath = `${this.getUserRoleFolder(user)}/${userId}/${target}`;
    const existingFile = this.getExistingUserFile(user, target);

    return {
      target,
      folderPath,
      allowMultiple: false,
      existingFiles: this.compactFiles([existingFile]),
      persist: async (files) => {
        const [file] = files;
        await this.userModel
          .findByIdAndUpdate(userId, this.buildUpdateData(target, file), {
            new: true,
          })
          .exec();
      },
    };
  }

  private async buildFarmerUploadTargetContext(
    user: User,
    target: UserImageTarget,
  ): Promise<UploadTargetContext> {
    this.ensureUserRole(user, 'farmer', target);

    const farmer = await this.farmerService.findByUserId(user._id.toString());
    const updateField = this.buildFarmerUpdateField(target);
    const existingFile =
      target === UserImageTarget.GOVIJANA_SEVA_PASSBOOK
        ? farmer.GovijanaSevaPassbookImage
        : farmer.gnCertificateImage;

    return {
      target,
      folderPath: `farmers/${farmer._id.toString()}/${target}`,
      allowMultiple: false,
      existingFiles: this.compactFiles([existingFile]),
      persist: async (files) => {
        const [file] = files;
        await this.farmerService.updateById(farmer._id.toString(), {
          [updateField]: file,
        } as any);
      },
    };
  }

  private async buildLandOwnerUploadTargetContext(
    user: User,
    target: UserImageTarget,
  ): Promise<UploadTargetContext> {
    this.ensureUserRole(user, 'landowner', target);

    const landOwner = await this.landOwnerService.findByUserId(
      user._id.toString(),
    );
    const updateField = this.buildLandOwnerUpdateField(target);
    const existingFiles =
      target === UserImageTarget.LAND_IMAGES
        ? (landOwner.landAddress?.landImages ?? [])
        : this.compactFiles([landOwner.landAddress?.bimsaviyaCertificate]);

    return {
      target,
      folderPath: `landowners/${landOwner._id.toString()}/${target}`,
      allowMultiple: target === UserImageTarget.LAND_IMAGES,
      existingFiles: this.compactFiles(existingFiles),
      persist: async (files) => {
        await this.landOwnerService.updateById(landOwner._id.toString(), {
          [updateField]:
            target === UserImageTarget.LAND_IMAGES ? files : files[0],
        } as any);
      },
    };
  }

  private async persistUploadedFiles(
    targetContexts: Map<UserImageTarget, UploadTargetContext>,
    uploadsByTarget: Map<UserImageTarget, UploadedFileDescriptor[]>,
    strictSingleTarget: boolean,
  ) {
    for (const [target, uploads] of uploadsByTarget) {
      const targetContext = targetContexts.get(target);
      if (!targetContext)
        throw new BadRequestException(T.missingUploadContext(target));

      if (!uploads.length)
        throw new BadRequestException(T.missingUploadedFiles);

      const selectedUploads = targetContext.allowMultiple
        ? uploads
        : [this.selectSingleTargetUpload(target, uploads, strictSingleTarget)];

      const persistedFiles = selectedUploads.map((upload) =>
        this.buildStoredFile(upload),
      );

      await targetContext.persist(persistedFiles);
      await this.deleteExistingFiles(
        targetContext.existingFiles,
        new Set(selectedUploads.map((upload) => upload.fileName)),
      );
    }
  }

  private selectSingleTargetUpload(
    target: UserImageTarget,
    uploads: UploadedFileDescriptor[],
    strictSingleTarget: boolean,
  ): UploadedFileDescriptor {
    if (uploads.length === 1) return uploads[0];

    if (strictSingleTarget)
      throw new BadRequestException(T.singleFileTargetDuplicate(target));

    this.logger.warn(
      `Target ${target} received multiple uploaded files. Persisting only the first entry.`,
    );

    return uploads[0];
  }

  private buildStoredFile(upload: UploadedFileDescriptor): Partial<File> {
    return {
      filename: upload.fileName,
      fileSize: upload.size.toString(),
      mimeType: upload.mimeType,
    };
  }

  private async deleteExistingFiles(
    existingFiles: File[],
    keepFileNames: Set<string>,
  ) {
    for (const file of existingFiles) {
      if (!file?.filename || keepFileNames.has(file.filename)) continue;

      try {
        await this.azureBlobStorageService.deleteFile(file.filename);
      } catch {
        this.logger.warn(
          `Failed to delete previous file ${file.filename}. Continuing with updated metadata.`,
        );
      }
    }
  }

  private ensureFileBelongsToTarget(
    fileName: string,
    targetContext: UploadTargetContext,
  ) {
    const expectedPrefix = `${targetContext.folderPath}/`;
    if (!fileName.startsWith(expectedPrefix))
      throw new BadRequestException(
        T.uploadFileOutsideTargetPath(targetContext.target),
      );
  }

  private getUserRoleFolder(user: User): string {
    const roleName = this.getUserRoleName(user);

    return `${roleName}s`;
  }

  private getUserRoleName(user: User): string {
    const roleName = user.role?.name?.toLowerCase();

    if (!roleName) throw new BadRequestException(T.userRoleRequiredForUploads);

    return roleName;
  }

  private ensureUserRole(
    user: User,
    requiredRole: string,
    target: UserImageTarget,
  ) {
    if (this.getUserRoleName(user) !== requiredRole)
      throw new BadRequestException(T.targetRoleMismatch(target, requiredRole));
  }

  private getExistingUserFile(
    user: User,
    target: UserImageTarget,
  ): File | undefined {
    switch (target) {
      case UserImageTarget.PROFILE_PICTURE:
        return user.personalInfo?.profilePicture;
      case UserImageTarget.NIC_FRONT:
        return user.personalInfo?.nicFrontImage;
      case UserImageTarget.NIC_BACK:
        return user.personalInfo?.nicBackImage;
      default:
        return undefined;
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

  private isMultiFileTarget(target: UserImageTarget): boolean {
    return target === UserImageTarget.LAND_IMAGES;
  }

  private compactFiles(files: Array<File | undefined>): File[] {
    return files.filter((file): file is File => !!file?.filename);
  }
}
