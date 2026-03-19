import {
  IsOptional,
  IsArray,
  IsMongoId,
  IsString,
  IsNumber,
  IsDateString,
  IsBoolean,
  ValidateNested,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  HarvestDetailsDto,
  CommissionDetailsDto,
  CostBreakdownItemDto,
  MilestoneBreakdownItemDto,
} from './project.create.dto';
import {
  ProjectLandAvailability,
  ProjectStatus,
  ProjectType,
} from '../project.types';

export class ProjectUpdateDto {
  @IsOptional()
  @IsMongoId()
  readonly user?: string;

  @IsOptional()
  @IsEnum(ProjectType)
  readonly offerType: ProjectType;

  @IsOptional()
  @IsEnum(ProjectLandAvailability)
  readonly landAvailability: ProjectLandAvailability;

  @IsOptional()
  @IsString()
  readonly projectName: string;

  @IsOptional()
  @IsString()
  readonly description: string;

  @IsOptional()
  @IsString()
  readonly cropType: string;

  @IsOptional()
  @IsString()
  readonly cropIcon: string;

  @IsOptional()
  @IsString()
  readonly backgroundImage: string;

  @IsOptional()
  @IsString()
  readonly location: string;

  @IsOptional()
  @IsString()
  readonly farmingMethods: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly preferredRegions: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostBreakdownItemDto)
  readonly costBreakdown: CostBreakdownItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneBreakdownItemDto)
  readonly milestoneBreakdown: MilestoneBreakdownItemDto[];

  @IsOptional()
  @IsNumber()
  readonly totalInvestmentRequired: number;

  @IsOptional()
  @IsDateString()
  readonly effectiveDateFrom: Date;

  @IsOptional()
  @IsDateString()
  readonly effectiveDateTo: Date;

  @IsOptional()
  @IsBoolean()
  readonly visibility: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => HarvestDetailsDto)
  readonly harvestBasedDetails: HarvestDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CommissionDetailsDto)
  readonly commissionBasedDetails: CommissionDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HarvestDetailsDto)
  readonly harvestDetails: HarvestDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CommissionDetailsDto)
  readonly commissionDetails: CommissionDetailsDto;
}

export class ProjectStatusUpdateDto {
  @IsNotEmpty()
  @IsEnum(ProjectStatus)
  readonly status: ProjectStatus;
}
