import { MailerService } from '@nestjs-modules/mailer/dist/mailer.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(to: string, subject: string, message: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        from: '"Aswenna System" <no-reply@aswenna.lk>',
        to,
        subject,
        text: message,
      });

      Logger.log(`Email sent to ${to}`, 'NotificationService');
    } catch (error) {
      Logger.error('Email sending failed', error, 'NotificationService');
    }
  }

  async sendSms(phone: string, message: string): Promise<void> {
    Logger.log(`SMS sent to ${phone}: ${message}`, 'NotificationService');
  }
}
