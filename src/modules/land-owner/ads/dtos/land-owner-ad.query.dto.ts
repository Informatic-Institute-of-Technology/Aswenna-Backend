import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

export class LandOwnerAdQueryDto extends PaginationDto {}

export class LandOwnerAdParamsDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly ad: string;
}

export class LandOwnerAdImageDeleteQueryDto {
  @IsString()
  @IsNotEmpty()
  readonly filename: string;
}
