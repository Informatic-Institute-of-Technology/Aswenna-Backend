import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateAddDto {
 @IsString()
landOwnerId: string;

  @IsString()
  location: string;

  @IsString()
  landArea: string;

  @IsString()
  availableFrom: string;

  @IsString()
  availableTo: string;

  @IsNumber()
  rentalAmount: number;

  @IsString()
  soilType: string;

  @IsOptional()
  @IsString()
  landHistory?: string;

  @IsOptional()
  @IsString()
  additionalInfo?: string;
}
