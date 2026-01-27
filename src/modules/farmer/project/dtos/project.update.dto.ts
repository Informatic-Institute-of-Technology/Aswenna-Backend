import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsBoolean,
  ValidateNested,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HarvestDetailsDto, CommissionDetailsDto } from './project.create.dto';
import { ProjectStatus } from '../project.types';

export class ProjectUpdateDto {
  @IsOptional()
  @IsString()
  readonly title: string;

  @IsOptional()
  @IsString()
  readonly description: string;

  @IsOptional()
  @IsString()
  readonly cropType: string;

  @IsOptional()
  @IsString()
  readonly location: string;

  @IsOptional()
  @IsNumber()
  readonly investmentRequired: number;

  @IsOptional()
  @IsNumber()
  readonly expectedROI: number;

  @IsOptional()
  @IsDateString()
  readonly startDate: Date;

  @IsOptional()
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

export class ProjectStatusUpdateDto {
  @IsNotEmpty()
  @IsEnum(ProjectStatus)
  readonly status: ProjectStatus;
}
