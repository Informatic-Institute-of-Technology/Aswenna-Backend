import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LandOwnerController } from './land-owner.controller';
import { LandOwnerService } from './land-owner.service';
import { LandOwner, LandOwnerSchema } from './schemas/land-owner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LandOwner.name, schema: LandOwnerSchema },
    ]),
  ],
  controllers: [LandOwnerController],
  providers: [LandOwnerService],
  exports: [LandOwnerService],
})
export class LandOwnerModule {}
