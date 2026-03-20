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
import { UserReal } from 'src/core/decorators/user.decorators';
import { UserService } from 'src/modules/user/user.service';
import { CreateLandOwnerAdDto } from './dtos/land-owner-ad.create.dto';
import { LandOwnerAdQueryDto } from './dtos/land-owner-ad.query.dto';
import { UpdateLandOwnerAdDto } from './dtos/land-owner-ad.update.dto';
import {
  LandOwnerAdCreatePayload,
  LandOwnerAdSortOptions,
  LandOwnerAdUpdatePayload,
} from './land-owner-ads.types';
import { LandOwnerAd, LandOwnerAdStatus } from './schemas/land-owner-ad.schema';

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
};

@Injectable()
export class LandOwnerAdsService {
  constructor(
    @InjectModel(LandOwnerAd.name)
    private readonly landOwnerAdModel: Model<LandOwnerAd>,
    private readonly userService: UserService,
  ) {}

  @Cron('0 */15 * * * *')
  async markExpiredAds(): Promise<void> {
    await this.expireAdsByDate();
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

    const existingActiveAd = await this.landOwnerAdModel
      .findOne({
        landowner: new Types.ObjectId(userId),
        status: LandOwnerAdStatus.ACTIVE,
      })
      .exec();

    if (existingActiveAd) {
      throw new BadRequestException(T.oneActiveAdOnly);
    }

    const payload: LandOwnerAdCreatePayload = {
      landowner: new Types.ObjectId(userId),
      title: dto.title,
      location: dto.location,
      landArea: dto.landArea,
      rentalAmount: dto.rentalAmount,
      availableFrom: new Date(dto.availableFrom),
      availableTo: new Date(dto.availableTo),
      soilType: dto.soilType,
      landHistory: dto.landHistory,
      additionalInfo: dto.additionalInfo,
      image: dto.image,
      status: LandOwnerAdStatus.ACTIVE,
    };

    return this.landOwnerAdModel.create(payload);
  }

  async findAllByOwner(
    user: UserReal,
    query: LandOwnerAdQueryDto,
  ): Promise<PaginatedResponseType<LandOwnerAd[]>> {
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
        .exec(),
      this.landOwnerAdModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(totalDocs / query.limit);

    return {
      data,
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

  async findByIdForOwner(adId: string, user: UserReal): Promise<LandOwnerAd> {
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
      .exec();
    if (!ad) {
      throw new BadRequestException(T.adNotFound(adId));
    }

    if (requester.isLandOwner) {
      const ownerId = this.extractOwnerId(ad.landowner);
      if (ownerId !== requester.userId) {
        throw new ForbiddenException(T.adNotOwned);
      }
    }

    return ad;
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

    const payload: LandOwnerAdUpdatePayload = {
      title: dto.title,
      location: dto.location,
      landArea: dto.landArea,
      rentalAmount: dto.rentalAmount,
      soilType: dto.soilType,
      landHistory: dto.landHistory,
      additionalInfo: dto.additionalInfo,
      image: dto.image,
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

    return updated;
  }

  async deleteForOwner(adId: string, user: UserReal): Promise<ResponseType> {
    const requester = await this.resolveRequester(user);
    if (!requester.isLandOwner) {
      throw new ForbiddenException(T.onlyLandOwnerAllowed);
    }

    await this.findByIdForOwner(adId, user);

    await this.landOwnerAdModel.findByIdAndDelete(adId).exec();

    return {
      statusCode: 200,
      message: 'Land owner ad deleted successfully',
    };
  }

  private async resolveRequester(
    user: UserReal,
  ): Promise<{ userId: string; isLandOwner: boolean }> {
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
