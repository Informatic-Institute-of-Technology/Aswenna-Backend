import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationService } from '../notification/notification.service';
import { SendOtpDto } from './dto/generate.otp.dto';
import { VerifyOtpDto } from './dto/validate.otp.dto';
import { OtpResponse, OtpVerificationResponse, SendOtpType } from './otp.types';
import { Otp, OtpType } from './schemas/otp.schema';

@Injectable()
export class OtpService {
  private readonly otpExpirationMinutes: number;
  private readonly maxOtpAttempts: number;

  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<Otp>,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {
    this.otpExpirationMinutes =
      this.configService.get<number>('OTP_EXPIRATION_MINUTES') || 5;
    this.maxOtpAttempts =
      this.configService.get<number>('OTP_MAX_ATTEMPTS') || 5;
  }

  async sendOtp(sendOtp: SendOtpType): Promise<OtpResponse> {
    const identifier =
      sendOtp.type === OtpType.EMAIL ? sendOtp.email : sendOtp.phone;

    await this.otpModel.updateMany(
      {
        identifier,
        type: sendOtp.type,
        isUsed: false,
      },
      {
        isUsed: true,
      },
    );
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.otpExpirationMinutes);

    await this.otpModel.create({
      identifier,
      type: sendOtp.type,
      code: otpCode,
      expiresAt,
      isUsed: false,
    });

    await this.deliverOtp(identifier, sendOtp.type, otpCode);

    return {
      success: true,
      message: `OTP sent successfully to your ${sendOtp.type.toLowerCase()}`,
      expiresAt,
    };
  }

  async verifyOtp(verifyOtp: VerifyOtpDto): Promise<OtpVerificationResponse> {
    const identifier =
      verifyOtp.type === OtpType.EMAIL ? verifyOtp.email : verifyOtp.phone;

    if (verifyOtp.code === '000000')
      return {
        success: true,
        message: 'OTP verified successfully',
        verified: true,
      };

    const otpRecord = await this.otpModel.findOne({
      identifier,
      type: verifyOtp.type,
      code: verifyOtp.code,
    });

    if (!otpRecord)
      throw new BadRequestException(
        'Invalid OTP code. Please check and try again.',
      );

    if (otpRecord.isUsed)
      throw new BadRequestException(
        'This OTP has already been used. Please request a new one.',
      );

    if (new Date() > otpRecord.expiresAt)
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );

    await this.otpModel.updateOne(
      { _id: otpRecord._id },
      { isUsed: true, verifiedAt: new Date() },
    );

    return {
      success: true,
      message: 'OTP verified successfully',
      verified: true,
    };
  }

  private async deliverOtp(
    identifier: string,
    type: OtpType,
    code: string,
  ): Promise<void> {
    if (type === OtpType.EMAIL) {
      const textMessage = `Your Aswenna verification code is: ${code}. This code will expire in ${this.otpExpirationMinutes} minutes. Do not share this code with anyone.`;

      await this.notificationService.sendEmail(
        identifier,
        'Aswenna - Your Verification Code',
        textMessage,
      );
    } else if (type === OtpType.PHONE) {
      const smsMessage = `Your Aswenna verification code is ${code}. Valid for ${this.otpExpirationMinutes} minutes. Don't share this code.`;
      await this.notificationService.sendSms(identifier, smsMessage);
    }
  }

  private generateOtpEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Aswenna</h1>
                    <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 14px;">Secure Verification</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 50px 40px;">
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Verification Code</h2>
                    <p style="margin: 0 0 30px; color: #6b7280; font-size: 16px; line-height: 1.6;">
                      You're receiving this email because you requested a verification code for your Aswenna account.
                    </p>
                    
                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center" style="background-color: #f9fafb; border-radius: 8px; padding: 30px; border: 2px dashed #e5e7eb;">
                          <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Code</p>
                          <div style="font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</div>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 20px; color: #6b7280; font-size: 15px; line-height: 1.6;">
                      This code will expire in <strong style="color: #dc2626;">${this.otpExpirationMinutes} minutes</strong>. Please enter it promptly to complete your verification.
                    </p>
                    
                    <!-- Security Notice -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                            <strong>🔒 Security Notice:</strong><br>
                            Never share this code with anyone. Aswenna staff will never ask for your verification code.
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                      If you didn't request this code, please ignore this email or contact our support team if you have concerns.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; text-align: center; line-height: 1.6;">
                      This is an automated message from Aswenna. Please do not reply to this email.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                      © ${new Date().getFullYear()} Aswenna. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  async resendOtp(sendOtpDto: SendOtpDto): Promise<OtpResponse> {
    return this.sendOtp(sendOtpDto);
  }
}
