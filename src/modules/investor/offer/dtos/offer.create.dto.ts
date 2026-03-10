import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { FarmingMethod, OfferType } from '../schemas/offer.schema';

export class RequiredQuantityDto {
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;
}

export class HarvestBaseDetailsDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  cropName: string;

  @IsString()
  @IsNotEmpty()
  cropVariety: string;

  @ValidateNested()
  @Type(() => RequiredQuantityDto)
  requiredQuantity: RequiredQuantityDto;

  @IsNumber()
  @IsNotEmpty()
  pricePerUnit: number;

  @IsDateString()
  @IsNotEmpty()
  deliveryDeadline: string;

  @IsString()
  @IsNotEmpty()
  deliveryLocation: string;

  @IsString()
  @IsNotEmpty()
  qualityStandards: string;

  @IsNumber()
  @IsNotEmpty()
  totalBudget: number;
}

export class CommissionDetailsDto {
  @IsEnum(FarmingMethod)
  @IsNotEmpty()
  preferredFarmingMethod: FarmingMethod;

  @IsNumber()
  @IsNotEmpty()
  minimumInvestment: number;

  @IsNumber()
  @IsNotEmpty()
  maximumInvestment: number;

  @IsNumber()
  @IsNotEmpty()
  commissionRate: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  supportTypes: string[];

  @IsNumber()
  @IsNotEmpty()
  minDuration: number;

  @IsNumber()
  @IsNotEmpty()
  maxDuration: number;
}

export class CreateOfferDto {
  @IsEnum(OfferType)
  @IsNotEmpty()
  readonly offerType: OfferType;

  // Common details - flattened directly
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  readonly projectTitle: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  readonly description: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  readonly preferredRegions: string[];

  @ValidateIf((o: CreateOfferDto) => o.offerType === OfferType.HARVEST_BASE)
  @ValidateNested()
  @Type(() => HarvestBaseDetailsDto)
  @IsNotEmpty()
  readonly harvestBaseDetails?: HarvestBaseDetailsDto;

  @ValidateIf((o: CreateOfferDto) => o.offerType === OfferType.COMMISSION)
  @ValidateNested()
  @Type(() => CommissionDetailsDto)
  @IsNotEmpty()
  readonly commissionDetails?: CommissionDetailsDto;
}
