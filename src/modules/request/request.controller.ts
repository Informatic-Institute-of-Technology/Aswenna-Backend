import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequestService } from './request.service';
import { Auth } from 'src/core/decorators/auth.decorator';
import { UserReal } from 'src/core/decorators/user.decorators';
import { LEGACY_UPLOAD_MULTER_OPTIONS } from 'src/common/constants/upload.constants';
import { FarmerRequestOfferCreateDto } from './dtos/farmer-request-offer.create.dto';
import { RequestQueryDto } from './dtos/request.query.dto';
import { UpdateJourneyStepDto } from './dtos/request.update.dto';

@Controller({ path: 'request', version: '1' })
@Auth()
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post('farmer/offer')
  farmerRequestOffer(
    @UserReal() user: UserReal,
    @Body() dto: FarmerRequestOfferCreateDto,
  ) {
    return this.requestService.farmerRequestOffer(user.user, dto);
  }

  @Get()
  findAll(@UserReal() user: UserReal, @Query() query: RequestQueryDto) {
    return this.requestService.findAll(user.user, query);
  }

  @Patch(':requestId/journey-steps/:stepId')
  updateJourneyStep(
    @UserReal() user: UserReal,
    @Param('requestId') requestId: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateJourneyStepDto,
  ) {
    return this.requestService.updateJourneyStep(
      requestId,
      stepId,
      user.user,
      dto,
    );
  }

  @Post(':requestId/investor-agreement')
  @UseInterceptors(FileInterceptor('file', LEGACY_UPLOAD_MULTER_OPTIONS))
  uploadInvestorAgreement(
    @UserReal() user: UserReal,
    @Param('requestId') requestId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.requestService.uploadInvestorAgreement(
      requestId,
      user.user,
      file,
    );
  }

  @Delete(':requestId')
  delete(@UserReal() user: UserReal, @Param('requestId') requestId: string) {
    return this.requestService.delete(requestId, user.user);
  }
}
