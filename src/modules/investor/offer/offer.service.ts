import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { File } from 'src/common/schemas/file.schema';
import { OfferCreateDto } from './dtos/offer-create.dto';
import { Offer, OfferStatus, OfferType } from './schemas/offer.schema';
import { PaginatedResponseType } from 'src/common/interfaces/response.types';
import { AzureBlobStorageService } from 'src/config/azure/services/azure-blob-storage.service';
import { FileUploadResponse } from 'src/config/azure/types/azure-blob.types';
import { LandOwnerAd } from 'src/modules/land-owner/land-ads/schemas/land-owner-ad.schema';
import { User } from 'src/modules/user/schemas/user.schema';
import { UpdateOfferByFarmerDto } from 'src/modules/farmer/dtos/update-offer-by-farmer.dto';

const T = {
  offerNotFoundById: (id: string) => `Offer with ID ${id} not found`,
  userNotFoundById: (id: string) => `User with ID ${id} not found`,
  farmerAlreadyLinked: 'A farmer is already connected to this investor offer',
  landownerProjectNotFoundById: (id: string) =>
    `Land owner project with ID ${id} not found`,
  landownerIdMismatch:
    'The land owner ID in the payload must match the authenticated land owner',
  farmerProjectOwnership:
    'The selected farmer project does not belong to the authenticated farmer',
  landownerProjectOwnership:
    'The selected land owner project does not belong to the authenticated land owner',
  farmerNotLinked:
    'Link the authenticated farmer to this offer before uploading the agreement',
  landownerNotLinked:
    'Link the authenticated land owner to this offer before uploading the agreement',
  noAgreementFile: 'No agreement file was provided',
};

@Injectable()
export class OfferService {
  private readonly logger = new Logger(OfferService.name);

  constructor(
    @InjectModel(Offer.name) private readonly offerModel: Model<Offer>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(LandOwnerAd.name)
    private readonly landOwnerAdModel: Model<LandOwnerAd>,
    private readonly azureBlobStorageService: AzureBlobStorageService,
  ) {}

  private readonly offerPopulate = [
    {
      path: 'investor',
      select: 'fullName email',
    },
    {
      path: 'farmer',
      select: 'fullName email',
    },
    {
      path: 'farmerProject',
      select: 'projectName offerType status cropType location',
    },
    {
      path: 'landowner',
      select: 'fullName email',
    },
    {
      path: 'landownerProject',
      select:
        'title status location landArea rentalAmount availableFrom availableTo',
    },
  ];

  async expireOffers(): Promise<number> {
    const result = await this.offerModel
      .updateMany(
        {
          status: { $ne: OfferStatus.EXPIRED },
          expiredDate: { $lte: new Date() },
        },
        {
          $set: { status: OfferStatus.EXPIRED },
        },
      )
      .exec();

    return result.modifiedCount;
  }

  async findAll(
    page: number,
    limit: number,
    search: string,
    sort: string,
    type?: OfferType,
  ): Promise<PaginatedResponseType<Offer[]>> {
    await this.expireOffers();

    const sortOptions: Record<string, 'asc' | 'desc'> = {};
    if (sort)
      sort.split(',').forEach((field) => {
        const isDesc = field.startsWith('-');
        const cleanField = field.replace(/^[+-]/, '').trim();
        sortOptions[cleanField] = isDesc ? 'desc' : 'asc';
      });

    const filter: Record<string, unknown> = {};

    if (type) filter.offerType = type;

    if (search) {
      filter.$or = [
        { investorName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        {
          'harvestBaseDetails.projectTitle': {
            $regex: search,
            $options: 'i',
          },
        },
        {
          'harvestBaseDetails.companyName': {
            $regex: search,
            $options: 'i',
          },
        },
        { 'harvestBaseDetails.cropType': { $regex: search, $options: 'i' } },
        {
          'commissionDetails.sponsorshipTitle': {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    const [data, totalDocs] = await Promise.all([
      this.offerModel
        .find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(this.offerPopulate)
        .exec(),
      this.offerModel.countDocuments(filter).exec(),
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

  async findById(id: string): Promise<Offer | null> {
    await this.expireOffers();

    return this.offerModel.findById(id).populate(this.offerPopulate).exec();
  }

  async create(offer: OfferCreateDto): Promise<Offer> {
    await this.expireOffers();

    const mappedPayload = this.mapFlatPayloadToSchema(
      offer,
      offer.offerType,
      true,
      true,
    );

    const createdOffer = await this.offerModel.create({
      ...mappedPayload,
      status: OfferStatus.OPEN,
    });

    return this.findOfferOrThrow(createdOffer._id.toString());
  }

  private mapFlatPayloadToSchema(
    offer: Partial<OfferCreateDto>,
    offerType: OfferType,
    forceTypeDetails = false,
    clearOtherType = false,
  ): Partial<Offer> {
    const payload: Record<string, unknown> = {
      offerType,
    };

    if (offer.investor !== undefined)
      payload.investor = new Types.ObjectId(offer.investor);
    if (offer.description !== undefined)
      payload.description = offer.description;
    if (offer.cropIcon !== undefined) payload.cropIcon = offer.cropIcon;
    if (offer.backgroundImage !== undefined)
      payload.backgroundImage = offer.backgroundImage;
    if (offer.expectedROI !== undefined)
      payload.expectedROI = offer.expectedROI;
    if (offer.currency !== undefined) payload.currency = offer.currency;
    if (offer.expiredDate !== undefined)
      payload.expiredDate = new Date(offer.expiredDate);
    if (offer.status !== undefined) payload.status = offer.status;
    if (offer.applicationsCount !== undefined)
      payload.applicationsCount = offer.applicationsCount;

    if (
      payload.expiredDate instanceof Date &&
      payload.expiredDate.getTime() <= Date.now()
    ) {
      payload.status = OfferStatus.EXPIRED;
    }

    const hasDirectHarvestFields =
      offer.projectTitle !== undefined ||
      offer.cropType !== undefined ||
      offer.cropVariety !== undefined ||
      offer.requiredQuantity !== undefined ||
      offer.quantityUnit !== undefined ||
      offer.pricePerUnit !== undefined ||
      offer.deliveryLocation !== undefined ||
      offer.totalBudget !== undefined ||
      offer.companyName !== undefined ||
      offer.preferredRegion !== undefined;

    const hasSponsorshipFields =
      offer.sponsorshipTitle !== undefined ||
      offer.cropTypes !== undefined ||
      offer.preferredFarmingMethod !== undefined ||
      offer.minimumInvestment !== undefined ||
      offer.maximumInvestment !== undefined ||
      offer.commissionRate !== undefined ||
      offer.supportType !== undefined ||
      offer.preferredRegions !== undefined;

    if (
      offerType === OfferType.DIRECT_HARVEST &&
      (forceTypeDetails || hasDirectHarvestFields)
    ) {
      payload.harvestBaseDetails = {
        ...(offer.projectTitle !== undefined && {
          projectTitle: offer.projectTitle,
        }),
        ...(offer.cropType !== undefined && { cropType: offer.cropType }),
        ...(offer.cropVariety !== undefined && {
          cropVariety: offer.cropVariety,
        }),
        ...(offer.requiredQuantity !== undefined && {
          requiredQuantity: offer.requiredQuantity,
        }),
        ...(offer.quantityUnit !== undefined && {
          quantityUnit: offer.quantityUnit,
        }),
        ...(offer.pricePerUnit !== undefined && {
          pricePerUnit: offer.pricePerUnit,
        }),
        ...(offer.deliveryLocation !== undefined && {
          deliveryLocation: offer.deliveryLocation,
        }),
        ...(offer.totalBudget !== undefined && {
          totalBudget: offer.totalBudget,
        }),
        ...(offer.companyName !== undefined && {
          companyName: offer.companyName,
        }),
        ...(offer.preferredRegion !== undefined && {
          preferredRegion: offer.preferredRegion,
        }),
      };
      if (clearOtherType) payload.commissionDetails = undefined;
    }

    if (
      offerType === OfferType.SPONSORSHIP &&
      (forceTypeDetails || hasSponsorshipFields)
    ) {
      payload.commissionDetails = {
        ...(offer.sponsorshipTitle !== undefined && {
          sponsorshipTitle: offer.sponsorshipTitle,
        }),
        ...(offer.cropTypes !== undefined && {
          cropTypes: offer.cropTypes,
        }),
        ...(offer.preferredFarmingMethod !== undefined && {
          preferredFarmingMethod: offer.preferredFarmingMethod,
        }),
        ...(offer.minimumInvestment !== undefined && {
          minimumInvestment: offer.minimumInvestment,
        }),
        ...(offer.maximumInvestment !== undefined && {
          maximumInvestment: offer.maximumInvestment,
        }),
        ...(offer.commissionRate !== undefined && {
          commissionRate: offer.commissionRate,
        }),
        ...(offer.supportType !== undefined && {
          supportType: offer.supportType,
        }),
        ...(offer.preferredRegions !== undefined && {
          preferredRegions: offer.preferredRegions,
        }),
      };
      if (clearOtherType) payload.harvestBaseDetails = undefined;
    }

    return payload as Partial<Offer>;
  }

  async update(
    id: string,
    offerDto: Partial<OfferCreateDto>,
  ): Promise<Offer | null> {
    await this.expireOffers();

    const existingOffer = await this.offerModel.findById(id).exec();

    if (!existingOffer) {
      throw new BadRequestException(T.offerNotFoundById(id));
    }

    const targetOfferType = offerDto.offerType ?? existingOffer.offerType;
    const isTypeExplicitlyChanged = offerDto.offerType !== undefined;
    const mappedPayload = this.mapFlatPayloadToSchema(
      offerDto,
      targetOfferType,
      false,
      isTypeExplicitlyChanged,
    );

    await this.offerModel
      .findByIdAndUpdate(id, mappedPayload, { new: true })
      .exec();

    return this.findOfferOrThrow(id);
  }

  async delete(id: string): Promise<Offer | null> {
    return this.offerModel.findByIdAndDelete(id).exec();
  }

  async linkFarmerToOffer(
    offerId: string,
    actorUserId: string,
    payload: UpdateOfferByFarmerDto,
  ): Promise<Offer> {
    await this.expireOffers();

    const resolvedFarmerId = actorUserId;
    const offer = await this.findOfferOrThrow(offerId);

    await this.ensureUserExists(resolvedFarmerId);

    const previousFarmerId = this.extractObjectIdString(offer.farmer);

    if (previousFarmerId) {
      throw new BadRequestException(T.farmerAlreadyLinked);
    }

    const shouldResetAgreement = previousFarmerId !== resolvedFarmerId;
    const hasLinkedLandowner = Boolean(
      this.extractObjectIdString(offer.landowner),
    );

    if (shouldResetAgreement) {
      await this.deleteStoredFile(offer.farmerAgreement?.filename);
    }

    await this.offerModel
      .findByIdAndUpdate(
        offerId,
        {
          $set: {
            farmer: new Types.ObjectId(resolvedFarmerId),
            costBreakdown: payload.costBreakdown,
            milestoneBreakdown: payload.milestoneBreakdown,
            ...(hasLinkedLandowner ? { status: OfferStatus.PENDING } : {}),
          },
          ...(shouldResetAgreement
            ? { $unset: { farmerAgreement: 1, farmerProject: 1 } }
            : { $unset: { farmerProject: 1 } }),
        },
        { new: true },
      )
      .exec();

    return this.findOfferOrThrow(offerId);
  }

  async uploadFarmerAgreement(
    offerId: string,
    actorUserId: string,
    file: any,
  ): Promise<Offer> {
    await this.expireOffers();

    if (!file) {
      throw new BadRequestException(T.noAgreementFile);
    }

    const offer = await this.findOfferOrThrow(offerId);
    const linkedFarmerId = this.extractObjectIdString(offer.farmer);

    if (!linkedFarmerId || linkedFarmerId !== actorUserId) {
      throw new ForbiddenException(T.farmerNotLinked);
    }

    const uploadResult = await this.azureBlobStorageService.uploadFile(
      file,
      `investor-offers/${offerId}/farmer-agreements`,
    );

    await this.deleteStoredFile(offer.farmerAgreement?.filename);

    await this.offerModel
      .findByIdAndUpdate(
        offerId,
        {
          $set: {
            farmerAgreement: this.buildStoredFile(uploadResult),
          },
        },
        { new: true },
      )
      .exec();

    return this.findOfferOrThrow(offerId);
  }

  async linkLandownerToOffer(
    offerId: string,
    actorUserId: string,
    landownerProjectId: string,
    landownerId?: string,
  ): Promise<Offer> {
    await this.expireOffers();

    if (landownerId && landownerId !== actorUserId) {
      throw new ForbiddenException(T.landownerIdMismatch);
    }

    const resolvedLandownerId = landownerId ?? actorUserId;
    const offer = await this.findOfferOrThrow(offerId);

    await this.ensureUserExists(resolvedLandownerId);

    const landownerProject = await this.landOwnerAdModel
      .findById(landownerProjectId)
      .select('landowner')
      .exec();

    if (!landownerProject) {
      throw new BadRequestException(
        T.landownerProjectNotFoundById(landownerProjectId),
      );
    }

    const projectOwnerId = this.extractObjectIdString(
      landownerProject.landowner,
    );
    if (projectOwnerId !== resolvedLandownerId) {
      throw new ForbiddenException(T.landownerProjectOwnership);
    }

    const previousLandownerId = this.extractObjectIdString(offer.landowner);
    const previousLandownerProjectId = this.extractObjectIdString(
      offer.landownerProject,
    );
    const shouldResetAgreement =
      previousLandownerId !== resolvedLandownerId ||
      previousLandownerProjectId !== landownerProjectId;

    if (shouldResetAgreement) {
      await this.deleteStoredFile(offer.landownerAgreement?.filename);
    }

    await this.offerModel
      .findByIdAndUpdate(
        offerId,
        {
          $set: {
            landowner: new Types.ObjectId(resolvedLandownerId),
            landownerProject: new Types.ObjectId(landownerProjectId),
          },
          ...(shouldResetAgreement
            ? { $unset: { landownerAgreement: 1 } }
            : {}),
        },
        { new: true },
      )
      .exec();

    return this.findOfferOrThrow(offerId);
  }

  async uploadLandownerAgreement(
    offerId: string,
    actorUserId: string,
    file: any,
  ): Promise<Offer> {
    await this.expireOffers();

    if (!file) {
      throw new BadRequestException(T.noAgreementFile);
    }

    const offer = await this.findOfferOrThrow(offerId);
    const linkedLandownerId = this.extractObjectIdString(offer.landowner);

    if (!linkedLandownerId || linkedLandownerId !== actorUserId) {
      throw new ForbiddenException(T.landownerNotLinked);
    }

    const uploadResult = await this.azureBlobStorageService.uploadFile(
      file,
      `investor-offers/${offerId}/landowner-agreements`,
    );

    await this.deleteStoredFile(offer.landownerAgreement?.filename);

    await this.offerModel
      .findByIdAndUpdate(
        offerId,
        {
          $set: {
            landownerAgreement: this.buildStoredFile(uploadResult),
          },
        },
        { new: true },
      )
      .exec();

    return this.findOfferOrThrow(offerId);
  }

  private async findOfferOrThrow(id: string): Promise<Offer> {
    const offer = await this.offerModel
      .findById(id)
      .populate(this.offerPopulate)
      .exec();

    if (!offer) {
      throw new BadRequestException(T.offerNotFoundById(id));
    }

    return offer;
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).select('_id').exec();

    if (!user) {
      throw new BadRequestException(T.userNotFoundById(userId));
    }
  }

  private extractObjectIdString(value: unknown): string {
    if (!value) {
      return '';
    }

    if (value instanceof Types.ObjectId) {
      return value.toString();
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      const documentLike = value as { _id?: unknown; id?: unknown };

      if (documentLike._id instanceof Types.ObjectId) {
        return documentLike._id.toString();
      }

      if (typeof documentLike._id === 'string') {
        return documentLike._id;
      }

      if (documentLike.id instanceof Types.ObjectId) {
        return documentLike.id.toString();
      }

      if (typeof documentLike.id === 'string') {
        return documentLike.id;
      }
    }

    return '';
  }

  private buildStoredFile(uploadResult: FileUploadResponse): Partial<File> {
    return {
      filename: uploadResult.fileName,
      fileSize: String(uploadResult.size),
      mimeType: uploadResult.contentType,
      url: uploadResult.url,
    };
  }

  private async deleteStoredFile(fileName?: string): Promise<void> {
    if (!fileName) {
      return;
    }

    try {
      await this.azureBlobStorageService.deleteFile(fileName);
    } catch (error) {
      this.logger.warn(
        `Unable to delete previous offer file ${fileName}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
