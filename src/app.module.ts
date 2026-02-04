import { Module } from '@nestjs/common';
import { ConfigModule } from './core/config/config.module';
import { JwtConfigModule } from './config/jwt/jwt.module';
import { DatabaseModule } from './config/database/database.module';
import { HealthModule } from './core/health/health.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionModule } from './modules/permission/permission.module';
import { InvestorModule } from './modules/investor/investor.module';
import { FarmerModule } from './modules/farmer/farmer.module';
import { LandOwnerModule } from './modules/land-owner/land-owner.module';
import { RequestModule } from './modules/request/request.module';
import { CreateAddsModule } from './modules/create-adds/create-adds.module';
import { OtpModule } from './modules/otp/otp.module';
import { MailModule } from './config/mail/mail.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule,
    JwtConfigModule,
    DatabaseModule,
    OtpModule,
    HealthModule,
    UserModule,
    AuthModule,
    PermissionModule,
    InvestorModule,
    FarmerModule,
    LandOwnerModule,
    RequestModule,
    CreateAddsModule,
    NotificationModule,
    MailModule,
  ],
})
export class AppModule {}
