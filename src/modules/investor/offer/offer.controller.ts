import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferParamsDto, OfferQueryDto } from './dtos/offer.query.dto';
import { OfferCreateDto } from './dtos/offer-create.dto';

@Controller({ path: 'investor-offer', version: '1' })
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Get()
  async findAll(@Query() query: OfferQueryDto) {
    return this.offerService.findAll(
      query.page,
      query.limit,
      query.search,
      query.sort,
      query.type,
      query.status,
    );
  }

  @Get(':offer')
  async findById(@Param() params: OfferParamsDto) {
    return this.offerService.findById(params.offer);
  }

  @Post()
  async create(@Body() offer: OfferCreateDto) {
    return this.offerService.create(offer);
  }

  @Put(':offer')
  async update(
    @Param() params: OfferParamsDto,
    @Body() offer: Partial<OfferCreateDto>,
  ) {
    return this.offerService.update(params.offer, offer);
  }

  @Delete(':offer')
  async delete(@Param() params: OfferParamsDto) {
    return this.offerService.delete(params.offer);
  }
}
