import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CostBreakdownItemForOfferDto {
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @IsNotEmpty()
  @IsNumber()
  readonly estimatedCost: number;
}

export class MilestoneBreakdownItemForOfferDto {
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @IsNotEmpty()
  @IsNumber()
  readonly estimatedAmount: number;

  @IsNotEmpty()
  @IsDateString()
  readonly paymentOverDueDate: Date;

  @IsNotEmpty()
  @IsDateString()
  readonly startDate: Date;

  @IsNotEmpty()
  @IsDateString()
  readonly endDate: Date;
}

export class UpdateOfferByFarmerDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostBreakdownItemForOfferDto)
  readonly costBreakdown: CostBreakdownItemForOfferDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneBreakdownItemForOfferDto)
  readonly milestoneBreakdown: MilestoneBreakdownItemForOfferDto[];
}
