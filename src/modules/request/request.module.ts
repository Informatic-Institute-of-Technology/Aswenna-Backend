import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  InteractionRequest,
  InteractionRequestSchema,
} from './schemas/request.schema';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';
import { RequestGateway } from './request.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InteractionRequest.name, schema: InteractionRequestSchema },
    ]),
  ],
  providers: [RequestService, RequestGateway],
  controllers: [RequestController],
  exports: [RequestService, RequestGateway],
})
export class RequestModule {}
