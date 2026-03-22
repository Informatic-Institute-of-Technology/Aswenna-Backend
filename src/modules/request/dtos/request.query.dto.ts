import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { RequestTargetType } from '../schemas/request.schema';

export class RequestQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsIn(Object.values(RequestTargetType))
  targetType?: RequestTargetType;

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
  @IsString()
  status?: string;
}

export class RequestParamsDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly id: string;
}
