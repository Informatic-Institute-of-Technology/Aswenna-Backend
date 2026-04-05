import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AzureConfigModule } from 'src/config/azure/azure.module';
import {
  FarmerProject,
  FarmerProjectSchema,
} from 'src/modules/farmer/schemas/farmer-project.schema';
import {
  LandOwnerAd,
  LandOwnerAdSchema,
} from 'src/modules/land-owner/land-ads/schemas/land-owner-ad.schema';
import { PaymentsModule } from 'src/modules/payments/payments.module';
import { User, UserSchema } from 'src/modules/user/schemas/user.schema';
import { OfferController } from './offer.controller';
import { OfferService } from './offer.service';
import { Offer, OfferSchema } from './schemas/offer.schema';
import { OfferExpiryCron } from './helpers/offer-expiry.cron';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Offer.name, schema: OfferSchema },
      { name: User.name, schema: UserSchema },
      { name: FarmerProject.name, schema: FarmerProjectSchema },
      { name: LandOwnerAd.name, schema: LandOwnerAdSchema },
    ]),
    AzureConfigModule,
    PaymentsModule,
  ],
  controllers: [OfferController],
  providers: [OfferService, OfferExpiryCron],
  exports: [OfferService],
})
export class OfferModule {}
