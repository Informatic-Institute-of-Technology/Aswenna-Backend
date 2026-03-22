import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { LEGACY_UPLOAD_MULTER_OPTIONS } from 'src/common/constants/upload.constants';
import { Auth } from 'src/core/decorators/auth.decorator';
import { UserReal } from 'src/core/decorators/user.decorators';
import { CreateLandOwnerAdDto } from './dtos/land-owner-ad.create.dto';
import {
  LandOwnerAdImageDeleteQueryDto,
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

  @Post(':ad/images')
  @UseInterceptors(AnyFilesInterceptor(LEGACY_UPLOAD_MULTER_OPTIONS))
  async uploadImages(
    @UserReal() user: UserReal,
    @Param() params: LandOwnerAdParamsDto,
    @UploadedFiles() files: any[],
  ) {
    return this.landOwnerAdsService.uploadLandImages(params.ad, user, files);
  }

  @Delete(':ad/images')
  async deleteImage(
    @UserReal() user: UserReal,
    @Param() params: LandOwnerAdParamsDto,
    @Query() query: LandOwnerAdImageDeleteQueryDto,
  ) {
    return this.landOwnerAdsService.deleteLandImage(
      params.ad,
      user,
      query.filename,
    );
  }
}
