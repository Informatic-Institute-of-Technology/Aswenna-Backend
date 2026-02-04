import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CreateAddsController } from './create-adds.controller';
import { CreateAddsService } from './create-adds.service';
import { LandAdd, LandAddSchema } from './schemas/land-adds.schema';
import { UserModule } from '../user/user.module';
import { NotificationModule } from 'src/common/notification/notification.module';


@Module({
  imports: [
    UserModule,
    NotificationModule,
    MongooseModule.forFeature([
      { name: LandAdd.name, schema: LandAddSchema },
    ]),
  ],
  controllers: [CreateAddsController],
  providers: [CreateAddsService],
})
export class CreateAddsModule {}



