import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    message: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: '"Aswenna System" <no-reply@aswenna.lk>',
        to,
        subject,
        text: message,
      });

      Logger.log(`Email sent to ${to}`, 'NotificationService');
    } catch (error) {
      Logger.error('Email sending failed', error);
    }
  }
}
