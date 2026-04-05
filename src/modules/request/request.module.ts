import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Offer,
  OfferSchema,
} from 'src/modules/investor/offer/schemas/offer.schema';
import { AzureConfigModule } from 'src/config/azure/azure.module';
import { ContractsModule } from 'src/modules/contracts/contracts.module';
import { UserRequest, UserRequestSchema } from './schemas/request.schema';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserRequest.name, schema: UserRequestSchema },
      { name: Offer.name, schema: OfferSchema },
    ]),
    AzureConfigModule,
    ContractsModule,
  ],
  providers: [RequestService],
  controllers: [RequestController],
  exports: [RequestService],
})
export class RequestModule {}
