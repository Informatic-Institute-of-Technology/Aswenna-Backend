import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import { OtpType } from '../schemas/otp.schema';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsEnum(OtpType)
  type: OtpType;

  @IsNotEmpty({ message: 'OTP code is required' })
  @IsString({ message: 'OTP code must be a string' })
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  code: string;

  @ValidateIf((o: VerifyOtpDto) => o.type === OtpType.EMAIL)
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ValidateIf((o: VerifyOtpDto) => o.type === OtpType.PHONE)
  @IsNotEmpty()
  @IsPhoneNumber()
  phone?: string;
}
