import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { UserImageTarget } from '../schemas/user.schema';

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
}

export class UserFileUploadDto {
  @IsNotEmpty()
  @IsEnum(UserImageTarget)
  target: UserImageTarget;
}
