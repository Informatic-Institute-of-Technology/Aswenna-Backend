import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { FarmingMethod, OfferStatus, OfferType } from '../schemas/offer.schema';

export class OfferCreateDto {
  @IsEnum(OfferType)
  @IsNotEmpty()
  readonly offerType: OfferType;

  @IsMongoId()
  @IsNotEmpty()
  readonly investor: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  readonly description: string;

  @IsString()
  @IsNotEmpty()
  readonly cropIcon: string;

  @IsString()
  @IsNotEmpty()
  readonly backgroundImage: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  readonly expectedROI: number;

  @IsString()
  @IsNotEmpty()
  readonly currency: string;

  @IsOptional()
  @IsEnum(OfferStatus)
  readonly status?: OfferStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  readonly applicationsCount?: number;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.DIRECT_HARVEST)
  @IsString()
  @IsNotEmpty()
  readonly projectTitle?: string;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.DIRECT_HARVEST)
  @IsString()
  @IsNotEmpty()
  readonly cropType?: string;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.DIRECT_HARVEST)
  @IsString()
  @IsNotEmpty()
  readonly cropVariety?: string;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.DIRECT_HARVEST)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  readonly requiredQuantity?: number;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.DIRECT_HARVEST)
  @IsString()
  @IsNotEmpty()
  readonly quantityUnit?: string;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.DIRECT_HARVEST)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  readonly pricePerUnit?: number;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.DIRECT_HARVEST)
  @IsString()
  @IsNotEmpty()
  readonly deliveryLocation?: string;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.DIRECT_HARVEST)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  readonly totalBudget?: number;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.DIRECT_HARVEST)
  @IsString()
  @IsNotEmpty()
  readonly companyName?: string;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.DIRECT_HARVEST)
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  readonly preferredRegion?: string[];

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.SPONSORSHIP)
  @IsString()
  @IsNotEmpty()
  readonly sponsorshipTitle?: string;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.SPONSORSHIP)
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  readonly cropTypes?: string[];

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.SPONSORSHIP)
  @IsDateString()
  @IsNotEmpty()
  readonly startDate?: string;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.SPONSORSHIP)
  @IsDateString()
  @IsNotEmpty()
  readonly endDate?: string;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.SPONSORSHIP)
  @IsEnum(FarmingMethod)
  @IsNotEmpty()
  readonly preferredFarmingMethod?: FarmingMethod;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.SPONSORSHIP)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  readonly minimumInvestment?: number;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.SPONSORSHIP)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  readonly maximumInvestment?: number;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.SPONSORSHIP)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  readonly commissionRate?: number;

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.SPONSORSHIP)
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  readonly supportType?: string[];

  @ValidateIf((o: OfferCreateDto) => o.offerType === OfferType.SPONSORSHIP)
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  readonly preferredRegions?: string[];
}
