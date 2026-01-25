import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Offer } from './schemas/offer.schema';
import { OfferCreateDto } from './dtos/offer.create.dto';

@Injectable()
export class OfferService {
  constructor(
    @InjectModel(Offer.name) private readonly offerModel: Model<Offer>,
  ) {}

  async create(offerDto: OfferCreateDto): Promise<Offer> {
    const createdOffer = new this.offerModel(offerDto);
    return createdOffer.save();
  }
}
