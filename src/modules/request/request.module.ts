import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserRequest, UserRequestSchema } from './schemas/request.schema';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserRequest.name, schema: UserRequestSchema },
    ]),
  ],
  providers: [RequestService],
  controllers: [RequestController],
  exports: [RequestService],
})
export class RequestModule {}
