import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class UserCreateDto {
  @IsString()
  @IsNotEmpty()
  readonly fullName: string;

  @IsOptional()
  @IsNotEmpty()
  readonly address: string;

  @IsNotEmpty()
  @IsString()
  readonly nicNumber: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @IsStrongPassword()
  readonly password: string;

  @IsPhoneNumber()
  @IsOptional()
  readonly phoneNumber: string;

  @IsMongoId()
  @IsOptional()
  readonly role: string;
}
