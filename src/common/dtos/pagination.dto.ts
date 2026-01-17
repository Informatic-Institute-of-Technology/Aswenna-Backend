import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsNotEmpty()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @IsNotEmpty()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit: number = 10;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  readonly search: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  readonly sort: string;
}
