import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { UserImageTarget, UserStatus } from '../schemas/user.schema';

export class UserUpdateDto {
  @IsString()
  @IsOptional()
  readonly fullName: string;

  @IsString()
  @IsOptional()
  readonly address: string;

  @IsPhoneNumber()
  @IsOptional()
  readonly phoneNumber: string;

  @IsEnum(UserStatus)
  @IsOptional()
  readonly status: UserStatus;
}

export class UserFileUploadDto {
  @IsNotEmpty()
  @IsEnum(UserImageTarget)
  target: UserImageTarget;
}
