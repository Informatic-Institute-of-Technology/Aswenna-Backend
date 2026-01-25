import { Body, Controller, Post } from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferCreateDto } from './dtos/offer.create.dto';

@Controller({ path: 'offer', version: '1' })
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  async create(@Body() createOfferDto: OfferCreateDto) {
    return this.offerService.create(createOfferDto);
  }
}
