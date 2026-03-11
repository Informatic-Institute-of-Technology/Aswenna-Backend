import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OfferCreateDto } from './dtos/offer-create.dto';
import { Offer, OfferType } from './schemas/offer.schema';
import { PaginatedResponseType } from 'src/common/interfaces/response.types';

@Injectable()
export class OfferService {
  constructor(
    @InjectModel(Offer.name) private readonly offerModel: Model<Offer>,
  ) {}

  async findAll(
    page: number,
    limit: number,
    search: string,
    sort: string,
    type?: OfferType,
  ): Promise<PaginatedResponseType<Offer[]>> {
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
        .populate([
          {
            path: 'investor',
            select: 'fullName email',
          },
        ])
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
    return this.offerModel
      .findById(id)
      .populate([
        {
          path: 'investor',
          select: 'fullName email',
        },
      ])
      .exec();
  }

  async create(offer: OfferCreateDto): Promise<Offer> {
    const mappedPayload = this.mapFlatPayloadToSchema(
      offer,
      offer.offerType,
      true,
      true,
    );

    return await this.offerModel.create(mappedPayload);
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
    if (offer.status !== undefined) payload.status = offer.status;
    if (offer.applicationsCount !== undefined)
      payload.applicationsCount = offer.applicationsCount;

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
      offer.startDate !== undefined ||
      offer.endDate !== undefined ||
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
        ...(offer.startDate !== undefined && {
          startDate: new Date(offer.startDate),
        }),
        ...(offer.endDate !== undefined && {
          endDate: new Date(offer.endDate),
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
    const existingOffer = await this.offerModel.findById(id).exec();

    if (!existingOffer) {
      throw new BadRequestException(`Offer with ID ${id} not found`);
    }

    const targetOfferType = offerDto.offerType ?? existingOffer.offerType;
    const isTypeExplicitlyChanged = offerDto.offerType !== undefined;
    const mappedPayload = this.mapFlatPayloadToSchema(
      offerDto,
      targetOfferType,
      false,
      isTypeExplicitlyChanged,
    );

    return this.offerModel
      .findByIdAndUpdate(id, mappedPayload, { new: true })
      .exec();
  }

  async delete(id: string): Promise<Offer | null> {
    return this.offerModel.findByIdAndDelete(id).exec();
  }
}
