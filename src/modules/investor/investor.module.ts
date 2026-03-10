import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvestorController } from './investor.controller';
import { InvestorService } from './investor.service';
import { Investor, InvestorSchema } from './schemas/investor.schema';
import { UserModule } from '../user/user.module';
import { RoleModule } from '../role/role.module';
import { OfferModule } from './offer/offer.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Investor.name, schema: InvestorSchema },
    ]),
    forwardRef(() => UserModule),
    RoleModule,
    OfferModule,
  ],
  controllers: [InvestorController],
  providers: [InvestorService],
  exports: [InvestorService, OfferModule],
})
export class InvestorModule {}
