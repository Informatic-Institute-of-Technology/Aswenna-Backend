import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  PaginatedResponseType,
  ResponseType,
} from 'src/common/interfaces/response.types';
import { AzureBlobStorageService } from 'src/config/azure/services/azure-blob-storage.service';
import { UserReal } from 'src/core/decorators/user.decorators';
import { UserService } from 'src/modules/user/user.service';
import { CreateLandOwnerAdDto } from './dtos/land-owner-ad.create.dto';
import { LandOwnerAdQueryDto } from './dtos/land-owner-ad.query.dto';
import { UpdateLandOwnerAdDto } from './dtos/land-owner-ad.update.dto';
import {
  LandOwnerAdCreatePayload,
  LandOwnerAdSortOptions,
  LandOwnerAdUpdatePayload,
  UploadedLandImage,
} from './land-owner-ads.types';
import { LandOwnerAd, LandOwnerAdStatus } from './schemas/land-owner-ad.schema';
import { File } from 'src/common/schemas/file.schema';

const T = {
  unauthorizedUser: 'Unauthorized user',
  onlyLandOwnerAllowed: 'Only land owner users can manage land owner ads',
  adNotFound: (id: string) => `Land owner ad with ID ${id} not found`,
  adNotOwned: 'You can access only your own land ad',
  oneActiveAdOnly: 'Only one active land ad is allowed per user',
  cannotUpdateExpired: 'Expired land ad cannot be updated',
  invalidDateRange: 'availableTo must be later than availableFrom',
  availableToInPast: 'availableTo must be in the future',
  invalidLandownerPayload: 'landowner in payload must match authenticated user',
  noFileProvided: 'No image files provided',
  imageNotFound: 'Image not found in this land ad',
};

@Injectable()
export class LandOwnerAdsService {
  constructor(
    @InjectModel(LandOwnerAd.name)
    private readonly landOwnerAdModel: Model<LandOwnerAd>,
    private readonly userService: UserService,
    private readonly azureBlobStorageService: AzureBlobStorageService,
  ) {}

  @Cron('0 */15 * * * *')
  async markExpiredAds(): Promise<void> {
    await this.expireAdsByDate();
  }

  async findAllByOwner(
    user: UserReal,
    query: LandOwnerAdQueryDto,
  ): Promise<PaginatedResponseType<any[]>> {
    const requester = await this.resolveRequester(user);
    await this.expireAdsByDate();

    const sortOptions: LandOwnerAdSortOptions = {};
    if (query.sort) {
      query.sort.split(',').forEach((field) => {
        const isDesc = field.startsWith('-');
        const cleanField = field.replace(/^[+-]/, '').trim();
        sortOptions[cleanField] = isDesc ? -1 : 1;
      });
    } else {
      sortOptions.createdAt = -1;
    }

    const filter: FilterQuery<LandOwnerAd> = requester.isLandOwner
      ? { landowner: new Types.ObjectId(requester.userId) }
      : {};

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { location: { $regex: query.search, $options: 'i' } },
        { soilType: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, totalDocs] = await Promise.all([
      this.landOwnerAdModel
        .find(filter)
        .sort(sortOptions)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .populate([
          {
            path: 'landowner',
            select: 'fullName email',
          },
        ])
        .lean()
        .exec(),
      this.landOwnerAdModel.countDocuments(filter).exec(),
    ]);

    // Enrich data with full user details including profilePicture and landImages
    const enrichedData = await Promise.all(
      data.map(async (ad) => {
        const landownerIdStr =
          ad.landowner instanceof Types.ObjectId
            ? ad.landowner.toString()
            : (ad.landowner as { _id?: any })?._id?.toString() ||
              String(ad.landowner);

        const fullLandownerDetails =
          await this.userService.findById(landownerIdStr);

        const landownerPayload: Record<string, any> = {
          ...ad.landowner,
        };

        if (fullLandownerDetails.personalInfo?.profilePicture) {
          landownerPayload.personalInfo = {
            profilePicture: fullLandownerDetails.personalInfo.profilePicture,
          };
        }

        return this.enrichAdWithImageUrls({
          ...ad,
          landowner: landownerPayload,
        });
      }),
    );

    const totalPages = Math.ceil(totalDocs / query.limit);

    return {
      data: enrichedData,
      pagination: {
        hasNextPage: query.page < totalPages,
        hasPrevPage: query.page > 1,
        limit: query.limit,
        nextPage: query.page + 1,
        page: query.page,
        prevPage: query.page - 1,
        totalDocs,
        totalPages,
      },
    };
  }

  async findByIdForOwner(
    adId: string,
    user: UserReal,
  ): Promise<Record<string, any>> {
    const requester = await this.resolveRequester(user);
    await this.expireAdsByDate();

    const ad = await this.landOwnerAdModel
      .findById(adId)
      .populate([
        {
          path: 'landowner',
          select: 'fullName email',
        },
      ])
      .lean();
    if (!ad) {
      throw new BadRequestException(T.adNotFound(adId));
    }

    if (requester.isLandOwner) {
      const ownerId = this.extractOwnerId(ad.landowner);
      if (ownerId !== requester.userId) {
        throw new ForbiddenException(T.adNotOwned);
      }
    }

    // Fetch full user details to include profilePicture and landImages
    const landownerIdStr =
      ad.landowner instanceof Types.ObjectId
        ? ad.landowner.toString()
        : (ad.landowner as { _id?: any })?._id?.toString() ||
          String(ad.landowner);

    const fullLandownerDetails =
      await this.userService.findById(landownerIdStr);
    const userWithLandOwner = fullLandownerDetails as any;

    const landownerPayload: Record<string, any> = {
      ...ad.landowner,
    };

    // Include profilePicture from user details
    if (fullLandownerDetails.personalInfo?.profilePicture) {
      landownerPayload.personalInfo = {
        profilePicture: fullLandownerDetails.personalInfo.profilePicture,
      };
    }

    return this.enrichAdWithImageUrls({
      ...ad,
      landowner: landownerPayload,
    });
  }

  async create(
    user: UserReal,
    dto: CreateLandOwnerAdDto,
  ): Promise<LandOwnerAd> {
    const requester = await this.resolveRequester(user);
    if (!requester.isLandOwner) {
      throw new ForbiddenException(T.onlyLandOwnerAllowed);
    }

    const userId = requester.userId;

    if (dto.landowner && dto.landowner !== userId) {
      throw new BadRequestException(T.invalidLandownerPayload);
    }

    this.validateDateRange(dto.availableFrom, dto.availableTo);
    await this.expireAdsByDate();

    const fullUserDetails = await this.userService.findById(userId);
    const userWithLandOwner = fullUserDetails as any;
    const landImagesFromLandOwner =
      userWithLandOwner?.landOwner?.landAddress?.landImages || [];
    const locationFromUser: { latitude: number; longitude: number } =
      userWithLandOwner?.landOwner?.location || {
        latitude: 0,
        longitude: 0,
      };
    const landAreaFromUser: number = parseFloat(
      userWithLandOwner?.landOwner?.landAddress?.size || '0',
    );

    const mappedLandImages: UploadedLandImage[] = landImagesFromLandOwner.map(
      (img: File) => ({
        filename: img.filename,
        fileSize: img.fileSize,
        mimeType: img.mimeType,
      }),
    );

    const existingActiveAd = await this.landOwnerAdModel
      .findOne({
        landowner: new Types.ObjectId(userId),
        status: LandOwnerAdStatus.ACTIVE,
      })
      .exec();

    if (existingActiveAd) {
      throw new BadRequestException(T.oneActiveAdOnly);
    }

    // Combine provided images with landOwner images
    const combinedImages = [...(dto?.images || []), ...mappedLandImages];

    const payload: LandOwnerAdCreatePayload = {
      landowner: new Types.ObjectId(userId),
      title: dto.title,
      location: locationFromUser,
      landArea: landAreaFromUser,
      rentalAmount: dto.rentalAmount,
      availableFrom: new Date(dto.availableFrom),
      availableTo: new Date(dto.availableTo),
      soilType: dto.soilType,
      landHistory: dto.landHistory,
      additionalInfo: dto.additionalInfo,
      waterAvailability: dto.waterAvailability,
      images: combinedImages.length > 0 ? combinedImages : undefined,
      status: LandOwnerAdStatus.ACTIVE,
    };

    const created = await this.landOwnerAdModel.create(payload);
    return this.enrichAdWithImageUrls(created);
  }

  async updateForOwner(
    adId: string,
    user: UserReal,
    dto: UpdateLandOwnerAdDto,
  ): Promise<LandOwnerAd> {
    const requester = await this.resolveRequester(user);
    if (!requester.isLandOwner) {
      throw new ForbiddenException(T.onlyLandOwnerAllowed);
    }

    const selectedAd = await this.findByIdForOwner(adId, user);

    if (
      selectedAd.status === LandOwnerAdStatus.EXPIRED ||
      this.isExpired(selectedAd.availableTo)
    ) {
      if (selectedAd.status !== LandOwnerAdStatus.EXPIRED) {
        await this.landOwnerAdModel
          .findByIdAndUpdate(adId, { status: LandOwnerAdStatus.EXPIRED })
          .exec();
      }
      throw new BadRequestException(T.cannotUpdateExpired);
    }

    if (dto.availableFrom || dto.availableTo) {
      this.validateDateRange(
        dto.availableFrom ?? selectedAd.availableFrom.toISOString(),
        dto.availableTo ?? selectedAd.availableTo.toISOString(),
      );
    }

    // Fetch location and landArea from User document's landOwner field
    const fullUserDetails = await this.userService.findById(requester.userId);
    const userWithLandOwner = fullUserDetails as any;
    const locationFromUser: { latitude: number; longitude: number } =
      userWithLandOwner?.landOwner?.location || {
        latitude: 0,
        longitude: 0,
      };
    const landAreaFromUser: number = parseFloat(
      userWithLandOwner?.landOwner?.landAddress?.size || '0',
    );

    const payload: LandOwnerAdUpdatePayload = {
      title: dto.title,
      location: locationFromUser,
      landArea: landAreaFromUser,
      rentalAmount: dto.rentalAmount,
      soilType: dto.soilType,
      landHistory: dto.landHistory,
      additionalInfo: dto.additionalInfo,
      waterAvailability: dto.waterAvailability,
      images: dto.images,
    };

    if (dto.availableFrom) {
      payload.availableFrom = new Date(dto.availableFrom);
    }
    if (dto.availableTo) {
      payload.availableTo = new Date(dto.availableTo);
    }

    const updated = await this.landOwnerAdModel
      .findByIdAndUpdate(adId, payload, { new: true })
      .exec();

    if (!updated) {
      throw new BadRequestException(T.adNotFound(adId));
    }

    return this.enrichAdWithImageUrls(updated);
  }

  async deleteForOwner(adId: string, user: UserReal): Promise<ResponseType> {
    const requester = await this.resolveRequester(user);
    if (!requester.isLandOwner) {
      throw new ForbiddenException(T.onlyLandOwnerAllowed);
    }

    const ad = await this.findByIdForOwner(adId, user);

    // Delete all images from Azure before deleting the ad
    const images =
      (ad as unknown as { images?: UploadedLandImage[] }).images ?? [];
    for (const image of images) {
      if (image?.filename && image.filename.includes('land-owner-ads')) {
        await this.azureBlobStorageService.deleteFile(image.filename);
      }
    }

    await this.landOwnerAdModel.findByIdAndDelete(adId).exec();

    return {
      statusCode: 200,
      message: 'Land owner ad deleted successfully',
    };
  }

  async uploadLandImages(
    adId: string,
    user: UserReal,
    files: any[],
  ): Promise<LandOwnerAd> {
    const requester = await this.resolveRequester(user);
    if (!requester.isLandOwner) {
      throw new ForbiddenException(T.onlyLandOwnerAllowed);
    }

    if (!files?.length) {
      throw new BadRequestException(T.noFileProvided);
    }

    const ad = await this.findByIdForOwner(adId, user);

    const uploadedImages: UploadedLandImage[] = [];
    for (const file of files) {
      const uploadResult = await this.azureBlobStorageService.uploadFile(
        file,
        `land-owner-ads/${adId}`,
      );

      uploadedImages.push({
        filename: uploadResult.fileName,
        fileSize: String(uploadResult.size),
        mimeType: uploadResult.contentType,
        url: uploadResult.url,
      });
    }

    const existingImages = (
      (ad as unknown as { images?: UploadedLandImage[] }).images ?? []
    ).slice();
    const nextImages = [...existingImages, ...uploadedImages];

    const updatePayload = {
      images: nextImages,
    };

    const updated = await this.landOwnerAdModel
      .findByIdAndUpdate(adId, updatePayload, { new: true })
      .exec();

    if (!updated) {
      throw new BadRequestException(T.adNotFound(adId));
    }

    return this.enrichAdWithImageUrls(updated);
  }

  async deleteLandImage(
    adId: string,
    user: UserReal,
    filename: string,
  ): Promise<LandOwnerAd> {
    const requester = await this.resolveRequester(user);
    if (!requester.isLandOwner) {
      throw new ForbiddenException(T.onlyLandOwnerAllowed);
    }

    if (!filename) {
      throw new BadRequestException(T.imageNotFound);
    }

    const ad = await this.findByIdForOwner(adId, user);
    const existingImages = (
      (ad as unknown as { images?: UploadedLandImage[] }).images ?? []
    ).slice();

    const imageExists = existingImages.some(
      (image) => image.filename === filename,
    );

    if (!imageExists) {
      throw new BadRequestException(T.imageNotFound);
    }

    // Safety check: only delete files from land-owner-ads path
    if (filename.includes('land-owner-ads')) {
      await this.azureBlobStorageService.deleteFile(filename);
    }

    const nextImages = existingImages.filter(
      (image) => image.filename !== filename,
    );

    const updatePayload = {
      images: nextImages,
    };

    const updated = await this.landOwnerAdModel
      .findByIdAndUpdate(adId, updatePayload, { new: true })
      .exec();

    if (!updated) {
      throw new BadRequestException(T.adNotFound(adId));
    }

    return this.enrichAdWithImageUrls(updated);
  }

  private async enrichAdWithImageUrls(ad: any): Promise<any> {
    const adObj = ad.toObject ? ad.toObject() : ad;

    // Enrich images with URLs
    if (adObj.images && Array.isArray(adObj.images)) {
      for (const image of adObj.images) {
        if (image?.filename) {
          image.url = await this.azureBlobStorageService.getFileUrl(
            image.filename as string,
          );
        }
      }
    }

    return adObj;
  }

  private async resolveRequester(user: UserReal): Promise<{
    userId: string;
    isLandOwner: boolean;
    profilePicture?: File;
  }> {
    const userId = user.user || user.userId || user.sub;
    if (!userId) {
      throw new BadRequestException(T.unauthorizedUser);
    }

    const selectedUser = await this.userService.findById(userId);
    const roleName = String(
      (selectedUser.role as { name?: string } | undefined)?.name ?? '',
    ).toLowerCase();

    return {
      userId: String(selectedUser._id),
      isLandOwner: roleName === 'landowner',
      profilePicture: selectedUser.personalInfo?.profilePicture,
    };
  }

  private validateDateRange(
    availableFromInput: string,
    availableToInput: string,
  ): void {
    const availableFrom = new Date(availableFromInput);
    const availableTo = new Date(availableToInput);

    if (availableTo <= availableFrom) {
      throw new BadRequestException(T.invalidDateRange);
    }

    if (availableTo <= new Date()) {
      throw new BadRequestException(T.availableToInPast);
    }
  }

  private isExpired(availableTo: Date): boolean {
    return availableTo.getTime() <= Date.now();
  }

  private extractOwnerId(landowner: unknown): string {
    if (landowner instanceof Types.ObjectId) {
      return landowner.toString();
    }

    if (
      typeof landowner === 'object' &&
      landowner !== null &&
      '_id' in landowner
    ) {
      const ownerId = (landowner as { _id?: unknown })._id;
      if (ownerId instanceof Types.ObjectId) {
        return ownerId.toString();
      }
      if (typeof ownerId === 'string') {
        return ownerId;
      }
    }

    return typeof landowner === 'string' ? landowner : '';
  }

  private async expireAdsByDate(): Promise<void> {
    await this.landOwnerAdModel
      .updateMany(
        {
          status: LandOwnerAdStatus.ACTIVE,
          availableTo: { $lte: new Date() },
        },
        {
          $set: { status: LandOwnerAdStatus.EXPIRED },
        },
      )
      .exec();
  }
}
