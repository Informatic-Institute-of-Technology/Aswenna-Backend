import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FarmerController } from './farmer.controller';
import { FarmerService } from './farmer.service';
import { Farmer, FarmerSchema } from './schemas/farmer.schema';
import { UserModule } from '../user/user.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Farmer.name, schema: FarmerSchema }]),
    UserModule,
    RoleModule,
  ],
  controllers: [FarmerController],
  providers: [FarmerService],
  exports: [FarmerService],
})
export class FarmerModule {}
