import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('email.host'),
          port: configService.get<number>('email.port'),
          secure: false,
          auth: {
            user: configService.get<string>('email.user'),
            pass: configService.get<string>('email.pass'),
          },
        },
        defaults: {
          from: `"Aswenna Smart Agriculture" <${configService.get<string>('email.user')}>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [MailerModule],
})
export class MailModule {}
