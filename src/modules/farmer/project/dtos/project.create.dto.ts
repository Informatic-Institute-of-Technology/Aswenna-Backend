import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsMongoId,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectLandAvailability, ProjectType } from '../project.types';

export class HarvestDetailsDto {
  // @IsNotEmpty()
  // @IsNumber()
  // readonly expectedHarvest: number;

  @IsNotEmpty()
  @IsNumber()
  readonly expectedLandArea: number;
}

export class CommissionDetailsDto {
  @IsNotEmpty()
  @IsNumber()
  readonly commissionPercentage: number;

  @IsNotEmpty()
  @IsNumber()
  readonly expectedLandArea: number;
}

export class CostBreakdownItemDto {
  @IsNotEmpty()
  @IsString()
  readonly category: string;

  @IsNotEmpty()
  @IsString()
  readonly description: string;

  @IsNotEmpty()
  @IsNumber()
  readonly estimatedCost: number;
}

export class MilestoneBreakdownItemDto {
  @IsNotEmpty()
  @IsString()
  readonly milestone: string;

  @IsNotEmpty()
  @IsString()
  readonly description: string;

  @IsNotEmpty()
  @IsNumber()
  readonly estimatedAmount: number;
}

export class ProjectCreateDto {
  @IsNotEmpty()
  @IsMongoId()
  readonly farmer: string;

  @IsNotEmpty()
  @IsEnum(ProjectType)
  readonly offerType: ProjectType;

  @IsNotEmpty()
  @IsEnum(ProjectLandAvailability)
  readonly landAvailability: ProjectLandAvailability;

  @ValidateIf((o: ProjectCreateDto) => o.offerType === ProjectType.HARVEST)
  @IsNotEmpty()
  @IsString()
  readonly projectName: string;

  @ValidateIf((o: ProjectCreateDto) => o.offerType === ProjectType.HARVEST)
  @IsNotEmpty()
  @IsString()
  readonly description: string;

  @IsNotEmpty()
  @IsString()
  readonly cropType: string;

  @ValidateIf((o: ProjectCreateDto) => o.offerType === ProjectType.HARVEST)
  @IsNotEmpty()
  @IsString()
  readonly cropIcon: string;

  @ValidateIf((o: ProjectCreateDto) => o.offerType === ProjectType.HARVEST)
  @IsNotEmpty()
  @IsString()
  readonly backgroundImage: string;

  @IsNotEmpty()
  @IsString()
  readonly location: string;

  @IsNotEmpty()
  @IsString()
  readonly farmingMethods: string;

  @IsArray()
  @IsString({ each: true })
  readonly preferredRegions: string[];

  @ValidateIf((o: ProjectCreateDto) => o.offerType === ProjectType.HARVEST)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostBreakdownItemDto)
  readonly costBreakdown: CostBreakdownItemDto[];

  @ValidateIf((o: ProjectCreateDto) => o.offerType === ProjectType.HARVEST)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneBreakdownItemDto)
  readonly milestoneBreakdown: MilestoneBreakdownItemDto[];

  @ValidateIf((o: ProjectCreateDto) => o.offerType === ProjectType.HARVEST)
  @IsNotEmpty()
  @IsNumber()
  readonly totalInvestmentRequired: number;

  @ValidateIf((o: ProjectCreateDto) => o.offerType === ProjectType.HARVEST)
  @IsNotEmpty()
  @IsDateString()
  readonly effectiveDateFrom: Date;

  @IsNotEmpty()
  @IsDateString()
  readonly effectiveDateTo: Date;

  @IsOptional()
  @IsBoolean()
  readonly visibility: boolean;

  @ValidateIf((o: ProjectCreateDto) => o.offerType === ProjectType.HARVEST)
  @ValidateNested()
  @Type(() => HarvestDetailsDto)
  readonly harvestBasedDetails?: HarvestDetailsDto;

  @ValidateIf((o: ProjectCreateDto) => o.offerType === ProjectType.COMMISSION)
  @ValidateNested()
  @Type(() => CommissionDetailsDto)
  readonly commissionBasedDetails?: CommissionDetailsDto;
}
