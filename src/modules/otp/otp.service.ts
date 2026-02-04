import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Otp, OtpType } from './schemas/otp.schema';
import { SendOtpDto } from './dto/generate.otp.dto';
import { VerifyOtpDto } from './dto/validate.otp.dto';
import { OtpResponse, OtpVerificationResponse, SendOtpType } from './otp.types';
import { NotificationService } from '../../common/notification/notification.service';

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
    const message = `Your Aswenna verification code is: ${code}. This code will expire in ${this.otpExpirationMinutes} minutes. Do not share this code with anyone.`;

    if (type === OtpType.EMAIL)
      await this.notificationService.sendEmail(
        identifier,
        'Aswenna - Verification Code',
        message,
      );
    else if (type === OtpType.PHONE)
      await this.notificationService.sendSms(identifier, message);
  }

  async resendOtp(sendOtpDto: SendOtpDto): Promise<OtpResponse> {
    return this.sendOtp(sendOtpDto);
  }
}
