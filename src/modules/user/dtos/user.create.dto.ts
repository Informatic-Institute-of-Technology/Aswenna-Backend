import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  MinLength,
  IsBoolean,
  IsBase64,
  IsDateString,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PersonalInfoDto {
  @IsOptional()
  @IsBase64()
  readonly profilePicture: string;

  @IsNotEmpty()
  @IsString()
  readonly nicNumber: string;

  @IsNotEmpty()
  @IsDateString()
  readonly birthday: string;

  @IsNotEmpty()
  @IsString()
  readonly gender: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(150)
  readonly age: number;

  @IsNotEmpty()
  @IsString()
  readonly province: string;

  @IsNotEmpty()
  @IsString()
  readonly district: string;

  @IsNotEmpty()
  @IsString()
  readonly postalCode: string;

  @IsNotEmpty()
  @IsString()
  readonly address: string;
}

export class FarmerDetailsDto {
  @IsNotEmpty()
  @IsString()
  readonly dsDivision: string;

  @IsNotEmpty()
  @IsString()
  readonly gnDivision: string;

  @IsNotEmpty()
  @IsString()
  readonly crop: string;

  @IsNotEmpty()
  @IsString()
  readonly experience: string;

  @IsNotEmpty()
  @IsString()
  readonly regions: string;

  @IsNotEmpty()
  @IsString()
  readonly specificNeeds: string;
}

export class UserCreateDto {
  @IsString()
  @IsNotEmpty()
  readonly fullName: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsBoolean()
  @IsOptional()
  readonly emailVerified: boolean;

  @IsPhoneNumber()
  @IsNotEmpty()
  readonly phoneNumber: string;

  @IsOptional()
  @IsBoolean()
  readonly phoneNumberVerified: boolean;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @IsStrongPassword()
  readonly password: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  readonly personalInfo: PersonalInfoDto;

  @IsOptional()
  @IsString()
  readonly role: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FarmerDetailsDto)
  readonly farmerDetails: FarmerDetailsDto;
}
