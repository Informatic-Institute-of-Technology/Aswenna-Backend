import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class LandOwnerAdFileDto {
  @IsString()
  @IsNotEmpty()
  readonly filename: string;

  @IsString()
  @IsNotEmpty()
  readonly fileSize: string;

  @IsString()
  @IsNotEmpty()
  readonly mimeType: string;

  @IsString()
  @IsOptional()
  readonly url?: string;
}

export class CreateLandOwnerAdDto {
  @IsOptional()
  @IsMongoId()
  readonly landowner?: string;

  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString()
  @IsOptional()
  readonly location?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  readonly landArea?: number;

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

  @IsString()
  @IsNotEmpty()
  readonly waterAvailability: string;

  @ValidateNested()
  @Type(() => LandOwnerAdFileDto)
  readonly images: LandOwnerAdFileDto[];
}
