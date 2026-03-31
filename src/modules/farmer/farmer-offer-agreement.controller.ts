import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LEGACY_UPLOAD_MULTER_OPTIONS } from 'src/common/constants/upload.constants';
import { UploadLimitExceptionFilter } from 'src/common/filters/upload-limit-exception.filter';
import { Auth } from 'src/core/decorators/auth.decorator';
import { UserReal } from 'src/core/decorators/user.decorators';
import { OfferService } from '../investor/offer/offer.service';
import { FarmerOfferParamsDto } from './dtos/farmer-offer-params.dto';

@Controller({ path: 'farmer-offer', version: '1' })
@Auth()
@UseFilters(UploadLimitExceptionFilter)
export class FarmerOfferAgreementController {
  constructor(private readonly offerService: OfferService) {}

  @Post(':offer/agreement')
  @UseInterceptors(FileInterceptor('file', LEGACY_UPLOAD_MULTER_OPTIONS))
  async uploadAgreement(
    @UserReal() user: UserReal,
    @Param() params: FarmerOfferParamsDto,
    @UploadedFile() file: any,
  ) {
    return this.offerService.uploadFarmerAgreement(
      params.offer,
      user.user,
      file,
    );
  }
}
