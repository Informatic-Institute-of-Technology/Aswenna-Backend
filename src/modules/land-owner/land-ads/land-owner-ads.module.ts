import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AzureConfigModule } from 'src/config/azure/azure.module';
import { UserModule } from 'src/modules/user/user.module';
import { LandOwnerAdsController } from './land-owner-ads.controller';
import { LandOwnerAd, LandOwnerAdSchema } from './schemas/land-owner-ad.schema';
import { LandOwnerAdsService } from './land-owner-ads.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LandOwnerAd.name, schema: LandOwnerAdSchema },
    ]),
    AzureConfigModule,
    UserModule,
  ],
  controllers: [LandOwnerAdsController],
  providers: [LandOwnerAdsService],
  exports: [LandOwnerAdsService],
})
export class LandOwnerAdsModule {}
