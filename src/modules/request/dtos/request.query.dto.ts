import { IsMongoId, IsNotEmpty } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

export class RequestQueryDto extends PaginationDto {}

export class RequestParamsDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly requestId: string;
}
