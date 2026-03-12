import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OfferController } from './offer.controller';
import { OfferService } from './offer.service';
import { Offer, OfferSchema } from './schemas/offer.schema';
import { OfferExpiryCron } from './helpers/offer-expiry.cron';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Offer.name, schema: OfferSchema }]),
  ],
  controllers: [OfferController],
  providers: [OfferService, OfferExpiryCron],
  exports: [OfferService],
})
export class OfferModule {}
