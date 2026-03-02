import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  MinLength,
  IsBoolean,
  IsDateString,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '../schemas/user.schema';

export class PersonalInfoDto {
  @IsNotEmpty()
  @IsString()
  readonly nicNumber: string;

  @IsNotEmpty()
  @IsDateString()
  readonly birthday: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  readonly gender: Gender;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(150)
  readonly age: number;

  @IsNotEmpty()
  @IsString()
  readonly address: string;

  @IsNotEmpty()
  @IsString()
  readonly postalCode: string;

  @IsNotEmpty()
  @IsString()
  readonly city: string;

  @IsNotEmpty()
  @IsString()
  readonly province: string;

  @IsNotEmpty()
  @IsString()
  readonly district: string;
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
  readonly govijanaSevaId: string;

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

export class InvestorDetailsDto {
  @IsNotEmpty()
  @IsString()
  readonly dsDivision: string;

  @IsNotEmpty()
  @IsString()
  readonly gnDivision: string;

  @IsNotEmpty()
  @IsString()
  readonly organizationName: string;

  @IsNotEmpty()
  @IsString()
  readonly companyAddress: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  readonly organizationPhoneNumber: string;

  @IsNotEmpty()
  @IsString()
  readonly registrationNo: string;

  @IsNotEmpty()
  @IsString()
  readonly cropFocus: string;
}

export class LandOwnerLocationDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  readonly latitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  readonly longitude: number;
}

export class LandAddressDto {
  @IsNotEmpty()
  @IsString()
  readonly street: string;

  @IsNotEmpty()
  @IsString()
  readonly city: string;

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
  readonly size: string;

  @IsNotEmpty()
  @IsString()
  readonly soilType: string;

  @IsNotEmpty()
  @IsString()
  readonly rentalExpectation: string;

  @IsNotEmpty()
  @IsString()
  readonly dsDivision: string;

  @IsNotEmpty()
  @IsString()
  readonly gnDivision: string;
}

export class LandOwnerDetailsDto {
  @IsNotEmpty()
  @IsString()
  readonly dsDivision: string;

  @IsNotEmpty()
  @IsString()
  readonly gnDivision: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LandOwnerLocationDto)
  readonly location: LandOwnerLocationDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LandAddressDto)
  readonly landAddress: LandAddressDto;
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

  @IsNotEmpty()
  @IsString()
  readonly role: string;

  @ValidateIf((o: UserCreateDto) => o.role.toLowerCase() === 'farmer')
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FarmerDetailsDto)
  readonly farmerDetails?: FarmerDetailsDto;

  @ValidateIf((o: UserCreateDto) => o.role.toLowerCase() === 'investor')
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => InvestorDetailsDto)
  readonly investorDetails: InvestorDetailsDto;

  @ValidateIf((o: UserCreateDto) => o.role.toLowerCase() === 'landowner')
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LandOwnerDetailsDto)
  readonly landOwnerDetails: LandOwnerDetailsDto;
}
