import { OtpType } from './schemas/otp.schema';

export interface SendOtpType {
  readonly type: OtpType;
  readonly email: string;
  readonly phone: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  expiresAt?: Date;
}

export interface OtpVerificationResponse {
  success: boolean;
  message: string;
  verified: boolean;
}
