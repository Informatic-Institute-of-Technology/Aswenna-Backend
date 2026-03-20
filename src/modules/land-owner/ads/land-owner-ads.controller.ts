import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/core/decorators/auth.decorator';
import { UserReal } from 'src/core/decorators/user.decorators';
import { CreateLandOwnerAdDto } from './dtos/land-owner-ad.create.dto';
import {
  LandOwnerAdParamsDto,
  LandOwnerAdQueryDto,
} from './dtos/land-owner-ad.query.dto';
import { UpdateLandOwnerAdDto } from './dtos/land-owner-ad.update.dto';
import { LandOwnerAdsService } from './land-owner-ads.service';

@Controller({ path: 'land-owner/ads', version: '1' })
@Auth()
export class LandOwnerAdsController {
  constructor(private readonly landOwnerAdsService: LandOwnerAdsService) {}

  @Post()
  async create(@UserReal() user: UserReal, @Body() dto: CreateLandOwnerAdDto) {
    return this.landOwnerAdsService.create(user, dto);
  }

  @Get()
  async findAll(
    @UserReal() user: UserReal,
    @Query() query: LandOwnerAdQueryDto,
  ) {
    return this.landOwnerAdsService.findAllByOwner(user, query);
  }

  @Get(':ad')
  async findById(
    @UserReal() user: UserReal,
    @Param() params: LandOwnerAdParamsDto,
  ) {
    return this.landOwnerAdsService.findByIdForOwner(params.ad, user);
  }

  @Patch(':ad')
  async update(
    @UserReal() user: UserReal,
    @Param() params: LandOwnerAdParamsDto,
    @Body() dto: UpdateLandOwnerAdDto,
  ) {
    return this.landOwnerAdsService.updateForOwner(params.ad, user, dto);
  }

  @Delete(':ad')
  async remove(
    @UserReal() user: UserReal,
    @Param() params: LandOwnerAdParamsDto,
  ) {
    return this.landOwnerAdsService.deleteForOwner(params.ad, user);
  }
}
