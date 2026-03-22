import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RequestTargetType } from '../schemas/request.schema';

export class RequestStatusBadgeDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  variant: string;

  @IsString()
  @IsNotEmpty()
  color: string;
}

export class RequestTagDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  variant: string;
}

export class RequestJourneyStepDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  icon: string;
}

export class RequestCreateDto {
  @IsMongoId()
  @IsNotEmpty()
  target: string;

  @IsString()
  @IsIn(Object.values(RequestTargetType))
  targetType: RequestTargetType;

  @IsMongoId()
  @IsNotEmpty()
  recipient: string;

  @IsMongoId()
  @IsNotEmpty()
  receiver: string;

  @ValidateNested()
  @Type(() => RequestStatusBadgeDto)
  statusBadge: RequestStatusBadgeDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestTagDto)
  tags: RequestTagDto[];

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  @IsString()
  investmentAmount?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RequestJourneyStepDto)
  journeySteps: RequestJourneyStepDto[];

  @IsOptional()
  @IsString()
  insight?: string;

  @IsOptional()
  @IsBoolean()
  highlighted?: boolean;
}
