import { Module } from '@nestjs/common';
import { OfferModule } from '../investor/offer/offer.module';
import { FarmerOfferAgreementController } from './farmer-offer-agreement.controller';
import { FarmerOfferController } from './farmer-offer.controller';

@Module({
  imports: [OfferModule],
  controllers: [FarmerOfferController, FarmerOfferAgreementController],
})
export class FarmerOfferModule {}
