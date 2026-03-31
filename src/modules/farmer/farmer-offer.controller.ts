import { Body, Controller, Param, Patch } from '@nestjs/common';
import { OfferService } from '../investor/offer/offer.service';
import { Auth } from 'src/core/decorators/auth.decorator';
import { UserReal } from 'src/core/decorators/user.decorators';
import { FarmerOfferParamsDto } from './dtos/farmer-offer-params.dto';
import { UpdateOfferByFarmerDto } from './dtos/update-offer-by-farmer.dto';

@Controller({ path: 'farmer-offer', version: '1' })
@Auth()
export class FarmerOfferController {
  constructor(private readonly offerService: OfferService) {}

  @Patch(':offer')
  async updateOfferConnection(
    @UserReal() user: UserReal,
    @Param() params: FarmerOfferParamsDto,
    @Body() dto: UpdateOfferByFarmerDto,
  ) {
    return this.offerService.linkFarmerToOffer(
      params.offer,
      user.user,
      dto.farmerProjectId,
      dto.farmerId,
    );
  }
}
