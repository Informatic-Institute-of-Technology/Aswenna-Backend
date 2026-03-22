import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLandOwnerAdDto {
  @IsOptional()
  @IsMongoId()
  readonly landowner?: string;

  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  readonly location: string;

  @Type(() => Number)
  @IsNumber()
  readonly landArea: number;

  @Type(() => Number)
  @IsNumber()
  readonly rentalAmount: number;

  @IsDateString()
  readonly availableFrom: string;

  @IsDateString()
  readonly availableTo: string;

  @IsString()
  @IsNotEmpty()
  readonly soilType: string;

  @IsString()
  @IsOptional()
  readonly landHistory?: string;

  @IsString()
  @IsNotEmpty()
  readonly additionalInfo: string;
}
