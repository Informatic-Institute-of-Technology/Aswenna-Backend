import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { FarmerAdsController } from './farmer-ads.controller';
import { FarmerAdsService } from './farmer-ads.service';

import { FarmerAd, FarmerAdSchema } from './schemas/farmer-ad.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FarmerAd.name, schema: FarmerAdSchema },
    ]),
  ],
  controllers: [FarmerAdsController],
  providers: [FarmerAdsService],
  exports: [FarmerAdsService],
})
export class FarmerAdsModule {}