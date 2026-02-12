import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { RoleModule } from '../role/role.module';
import { FarmerModule } from '../farmer/farmer.module';
import { InvestorModule } from '../investor/investor.module';
import { LandOwnerModule } from '../land-owner/land-owner.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    RoleModule,
    forwardRef(() => FarmerModule),
    forwardRef(() => InvestorModule),
    forwardRef(() => LandOwnerModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
