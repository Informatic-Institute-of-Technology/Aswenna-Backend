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
import { CreateOfferDto } from './dtos/offer.create.dto';
import { OfferParamsDto, OfferQueryDto } from './dtos/offer.query.dto';

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
    );
  }

  @Get(':offer')
  async findById(@Param() params: OfferParamsDto) {
    return this.offerService.findById(params.offer);
  }

  @Post()
  async create(@Body() createOfferDto: CreateOfferDto) {
    return this.offerService.create(createOfferDto);
  }

  @Put(':offer')
  async update(
    @Param() params: OfferParamsDto,
    @Body() updateOfferDto: Partial<CreateOfferDto>,
  ) {
    return this.offerService.update(params.offer, updateOfferDto);
  }

  @Delete(':offer')
  async delete(@Param() params: OfferParamsDto) {
    return this.offerService.delete(params.offer);
  }
}
