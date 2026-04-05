import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { UserStatus } from '../schemas/user.schema';

export class PersonalInfoDto {
  @IsOptional()
  @IsString()
  readonly address: string;

  @IsOptional()
  @IsString()
  readonly postalCode: string;

  @IsOptional()
  @IsString()
  readonly city: string;

  @IsOptional()
  @IsString()
  readonly province: string;

  @IsOptional()
  @IsString()
  readonly district: string;
}

export class FarmerDetailsDto {
  @IsOptional()
  @IsString()
  readonly dsDivision: string;

  @IsOptional()
  @IsString()
  readonly gnDivision: string;

  @IsOptional()
  @IsString()
  readonly govijanaSevaId: string;

  @IsOptional()
  @IsString()
  readonly crop: string;

  @IsOptional()
  @IsString()
  readonly experience: string;

  @IsOptional()
  @IsString()
  readonly regions: string;

  @IsOptional()
  @IsString()
  readonly specificNeeds: string;
}

export class InvestorDetailsDto {
  @IsOptional()
  @IsString()
  readonly dsDivision: string;

  @IsOptional()
  @IsString()
  readonly gnDivision: string;

  @IsOptional()
  @IsString()
  readonly organizationName: string;

  @IsOptional()
  @IsString()
  readonly companyAddress: string;

  @IsOptional()
  @IsPhoneNumber()
  readonly organizationPhoneNumber: string;

  @IsOptional()
  @IsString()
  readonly registrationNo: string;

  @IsOptional()
  @IsString()
  readonly cropFocus: string;
}

export class LandOwnerDetailsDto {
  @IsOptional()
  @IsString()
  readonly dsDivision: string;

  @IsOptional()
  @IsString()
  readonly gnDivision: string;
}

export class UserUpdateDto {
  @IsOptional()
  @IsEnum(UserStatus)
  readonly status: UserStatus;

  @IsString()
  @IsOptional()
  readonly fullName: string;

  @IsPhoneNumber()
  @IsOptional()
  readonly phoneNumber: string;

  @IsOptional()
  @IsBoolean()
  readonly phoneNumberVerified: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  readonly personalInfo: PersonalInfoDto;

  @IsOptional()
  @IsString()
  readonly role: string;

  @ValidateIf((o: UserUpdateDto) => o.role?.toLowerCase() === 'farmer')
  @IsOptional()
  @ValidateNested()
  @Type(() => FarmerDetailsDto)
  readonly farmerDetails?: FarmerDetailsDto;

  @ValidateIf((o: UserUpdateDto) => o.role?.toLowerCase() === 'investor')
  @IsOptional()
  @ValidateNested()
  @Type(() => InvestorDetailsDto)
  readonly investorDetails: InvestorDetailsDto;

  @ValidateIf((o: UserUpdateDto) => o.role?.toLowerCase() === 'landowner')
  @IsOptional()
  @ValidateNested()
  @Type(() => LandOwnerDetailsDto)
  readonly landOwnerDetails: LandOwnerDetailsDto;
}
