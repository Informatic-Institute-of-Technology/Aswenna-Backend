import { Body, Controller, Param, Patch } from '@nestjs/common';
import { Auth } from 'src/core/decorators/auth.decorator';
import { UserReal } from 'src/core/decorators/user.decorators';
import { OfferService } from '../investor/offer/offer.service';
import { LandOwnerOfferParamsDto } from './dtos/land-owner-offer-params.dto';
import { UpdateOfferByLandOwnerDto } from './dtos/update-offer-by-land-owner.dto';

@Controller({ path: 'land-owner-offer', version: '1' })
@Auth()
export class LandOwnerOfferController {
  constructor(private readonly offerService: OfferService) {}

  @Patch(':offer')
  async updateOfferConnection(
    @UserReal() user: UserReal,
    @Param() params: LandOwnerOfferParamsDto,
    @Body() dto: UpdateOfferByLandOwnerDto,
  ) {
    return this.offerService.linkLandownerToOffer(
      params.offer,
      user.user,
      dto.landownerProjectId,
      dto.landownerId,
    );
  }
}
