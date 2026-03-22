import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { Contract, ContractSchema } from './schemas/contract.schema';
import { OfferModule } from '../investor/offer/offer.module';
import {
  LandOwnerAd,
  LandOwnerAdSchema,
} from '../land-owner/land-ads/schemas/land-owner-ad.schema';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
      { name: LandOwnerAd.name, schema: LandOwnerAdSchema },
    ]),
    OfferModule,
    PaymentsModule,
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
