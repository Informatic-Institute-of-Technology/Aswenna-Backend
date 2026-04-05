import { Module } from '@nestjs/common';
import { ConfigModule } from './core/config/config.module';
import { JwtConfigModule } from './config/jwt/jwt.module';
import { DatabaseModule } from './config/database/database.module';
import { AzureConfigModule } from './config/azure/azure.module';
import { HealthModule } from './core/health/health.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionModule } from './modules/permissions/permission.module';
import { InvestorModule } from './modules/investor/investor.module';
import { FarmerModule } from './modules/farmer/farmer.module';
import { LandOwnerModule } from './modules/land-owner/land-owner.module';
import { RequestModule } from './modules/request/request.module';
import { CreateAddsModule } from './modules/create-adds/create-adds.module';
import { OtpModule } from './modules/otp/otp.module';
import { MailModule } from './config/mail/mail.module';
import { NotificationModule } from './modules/notification/notification.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FarmerAdsModule } from './modules/farmer/farmer-ads.module';
import { FarmerOfferModule } from './modules/farmer/farmer-offer.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ChatModule } from './modules/chat/chat.module';
import { LandOwnerAdsModule } from './modules/land-owner/land-ads/land-owner-ads.module';
import { LandOwnerOfferModule } from './modules/land-owner/land-owner-offer.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    JwtConfigModule,
    DatabaseModule,
    AzureConfigModule,
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
    FileUploadModule,
    FarmerAdsModule,
    FarmerOfferModule,
    ConversationsModule,
    MessagesModule,
    ChatModule,
    LandOwnerAdsModule,
    LandOwnerOfferModule,
  ],
})
export class AppModule {}
