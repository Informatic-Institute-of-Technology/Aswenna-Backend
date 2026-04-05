import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RequestCostBreakdownItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  estimatedCost: number;
}

export class RequestMilestoneBreakdownItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  estimatedAmount: number;

  @IsDateString()
  paymentOverDueDate: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class FarmerRequestOfferCreateDto {
  @IsMongoId()
  @IsNotEmpty()
  investorOffer: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RequestCostBreakdownItemDto)
  costBreakdown: RequestCostBreakdownItemDto[];

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RequestMilestoneBreakdownItemDto)
  milestoneBreakdown: RequestMilestoneBreakdownItemDto[];
}
