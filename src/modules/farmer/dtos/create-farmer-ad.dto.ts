import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class HarvestDetailsDto {

  @IsNumber()
  expectedHarvest: number;

  @IsNumber()
  expectedLandArea: number;

}

export class CommissionDetailsDto {

  @IsNumber()
  commissionPercentage: number;

  @IsNumber()
  investmentAmount: number;

  @IsNumber()
  noOfInstallments: number;

}

export class CreateFarmerAdDto {

  @IsString()
  offerType: 'harvest' | 'commission';

  @IsString()
  projectName: string;

  @IsString()
  description: string;

  @IsString()
  cropType: string;

  @IsString()
  location: string;

  @IsString()
  effectiveDateFrom: string;

  @IsString()
  effectiveDateTo: string;

  @IsString()
  farmingMethods: string;

  @IsString()
  agreementType: string;

  @IsArray()
  preferredRegions: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => HarvestDetailsDto)
  harvestBasedDetails?: HarvestDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CommissionDetailsDto)
  commissionBasedDetails?: CommissionDetailsDto;

}