import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectType } from '../project.types';

export class HarvestDetailsDto {
  @IsNotEmpty()
  @IsNumber()
  readonly expectedYield: number;

  @IsNotEmpty()
  @IsString()
  readonly yieldUnit: string;

  @IsNotEmpty()
  @IsNumber()
  readonly investorSharePercentage: number;

  @IsNotEmpty()
  @IsString()
  readonly riskLevel: string;
}

export class CommissionDetailsDto {
  @IsNotEmpty()
  @IsEnum(['FIXED', 'PERCENTAGE'])
  readonly commissionType: 'FIXED' | 'PERCENTAGE';

  @IsNotEmpty()
  @IsNumber()
  readonly commissionValue: number;

  @IsNotEmpty()
  @IsString()
  readonly serviceDescription: string;
}

export class ProjectCreateDto {
  @IsNotEmpty()
  @IsMongoId()
  readonly farmer: string;

  @IsNotEmpty()
  @IsEnum(ProjectType)
  readonly type: ProjectType;

  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @IsNotEmpty()
  @IsString()
  readonly description: string;

  @IsNotEmpty()
  @IsString()
  readonly cropType: string;

  @IsNotEmpty()
  @IsString()
  readonly location: string;

  @IsNotEmpty()
  @IsNumber()
  readonly investmentRequired: number;

  @IsNotEmpty()
  @IsNumber()
  readonly expectedROI: number;

  @IsNotEmpty()
  @IsDateString()
  readonly startDate: Date;

  @IsNotEmpty()
  @IsDateString()
  readonly endDate: Date;

  @IsOptional()
  @IsBoolean()
  readonly visibility: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => HarvestDetailsDto)
  readonly harvestDetails: HarvestDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CommissionDetailsDto)
  readonly commissionDetails: CommissionDetailsDto;
}
