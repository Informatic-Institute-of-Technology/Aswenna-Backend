import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateOfferDto } from './dtos/offer.create.dto';
import { Offer, OfferType } from './schemas/offer.schema';
import { PaginatedResponseType } from 'src/common/interfaces/response.types';

@Injectable()
export class OfferService {
  constructor(
    @InjectModel(Offer.name) private readonly offerModel: Model<Offer>,
  ) {}

  async create(offerDto: CreateOfferDto): Promise<Offer> {
    const createdOffer = new this.offerModel(offerDto);
    return createdOffer.save();
  }

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

    const filter: Record<string, any> = {};

    if (type) filter.offerType = type;

    if (search) {
      filter.$or = [
        { projectTitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'harvestBaseDetails.companyName': { $regex: search, $options: 'i' } },
        { 'harvestBaseDetails.cropName': { $regex: search, $options: 'i' } },
      ];
    }

    const [data, totalDocs] = await Promise.all([
      this.offerModel
        .find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
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
    return this.offerModel.findById(id).exec();
  }

  async update(
    id: string,
    offerDto: Partial<CreateOfferDto>,
  ): Promise<Offer | null> {
    const existingOffer = await this.offerModel.findById(id).exec();

    if (!existingOffer) {
      throw new BadRequestException(`Offer with ID ${id} not found`);
    }

    return this.offerModel
      .findByIdAndUpdate(id, offerDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<Offer | null> {
    return this.offerModel.findByIdAndDelete(id).exec();
  }
}
