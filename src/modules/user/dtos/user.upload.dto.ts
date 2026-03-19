import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserImageTarget } from '../schemas/user.schema';

export class UserUploadRequestFileDto {
  @IsEnum(UserImageTarget)
  readonly target: UserImageTarget;

  @IsString()
  @IsNotEmpty()
  readonly originalName: string;

  @IsString()
  @IsNotEmpty()
  readonly contentType: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly size: number;
}

export class UserUploadRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UserUploadRequestFileDto)
  readonly files: UserUploadRequestFileDto[];
}

export class UserUploadCompleteFileDto {
  @IsEnum(UserImageTarget)
  readonly target: UserImageTarget;

  @IsString()
  @IsNotEmpty()
  readonly fileName: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly size: number;

  @IsString()
  @IsNotEmpty()
  readonly mimeType: string;
}

export class UserUploadCompleteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UserUploadCompleteFileDto)
  readonly files: UserUploadCompleteFileDto[];
}
