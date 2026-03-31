import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RequestStatus } from '../schemas/request.schema';
import {
  RequestJourneyStepDto,
  RequestStatusBadgeDto,
  RequestTagDto,
} from './request.create.dto';

export class RequestUpdateDto {
  @IsOptional()
  @IsMongoId()
  target?: string;

  @IsOptional()
  @IsMongoId()
  recipient?: string;

  @IsOptional()
  @IsMongoId()
  receiver?: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => RequestStatusBadgeDto)
  statusBadge?: RequestStatusBadgeDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestTagDto)
  tags?: RequestTagDto[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  @IsString()
  investmentAmount?: string;

  @IsOptional()
  @IsString()
  insight?: string;

  @IsOptional()
  @IsBoolean()
  highlighted?: boolean;
}

export class AddJourneyStepDto {
  @ValidateNested()
  @Type(() => RequestJourneyStepDto)
  step: RequestJourneyStepDto;
}

export class UpdateJourneyStepDto {
  @ValidateNested()
  @Type(() => RequestJourneyStepDto)
  step: RequestJourneyStepDto;
}

export class RemoveJourneyStepDto {
  @IsMongoId()
  @IsNotEmpty()
  stepId: string;
}

export class OverwriteJourneyStepsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RequestJourneyStepDto)
  journeySteps: RequestJourneyStepDto[];
}
