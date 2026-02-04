import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { RequestType } from '../schemas/request.schema';

export class RequestCreateDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly receiver: string;

  @IsMongoId()
  @IsNotEmpty()
  readonly targetId: string;

  @IsEnum(RequestType)
  @IsNotEmpty()
  readonly targetType: RequestType;

  @IsOptional()
  @IsObject()
  readonly metadata?: Record<string, any>;
}
