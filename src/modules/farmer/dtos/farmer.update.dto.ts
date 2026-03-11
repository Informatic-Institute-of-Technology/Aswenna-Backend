import { IsOptional, IsString } from 'class-validator';

export class FarmerUpdateDto {
  @IsOptional()
  @IsString()
  readonly dsDivision: string;

  @IsOptional()
  @IsString()
  readonly gnDivision: string;

  @IsOptional()
  @IsString()
  readonly govijanaSevaId: string;

  @IsOptional()
  @IsString()
  readonly crop: string;

  @IsOptional()
  @IsString()
  readonly experience: string;

  @IsOptional()
  @IsString()
  readonly regions: string;

  @IsOptional()
  @IsString()
  readonly specificNeeds: string;
}
