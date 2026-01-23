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
  @MinLength(2)
  readonly firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  readonly lastName: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  readonly address: string;

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
