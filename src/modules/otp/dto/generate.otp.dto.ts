import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  ValidateIf,
} from 'class-validator';
import { OtpType } from '../schemas/otp.schema';

export class SendOtpDto {
  @IsNotEmpty()
  @IsEnum(OtpType)
  readonly type: OtpType;

  @ValidateIf((o: SendOtpDto) => o.type === OtpType.EMAIL)
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ValidateIf((o: SendOtpDto) => o.type === OtpType.PHONE)
  @IsNotEmpty()
  @IsPhoneNumber()
  readonly phone: string;
}
