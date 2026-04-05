import { Module } from '@nestjs/common';
import { OfferModule } from '../investor/offer/offer.module';
import { LandOwnerOfferAgreementController } from './land-owner-offer-agreement.controller';
import { LandOwnerOfferController } from './land-owner-offer.controller';

@Module({
  imports: [OfferModule],
  controllers: [LandOwnerOfferController, LandOwnerOfferAgreementController],
})
export class LandOwnerOfferModule {}
