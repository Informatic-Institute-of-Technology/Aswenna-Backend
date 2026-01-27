import { IsMongoId, IsNotEmpty } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

export class ProjectQueryDto extends PaginationDto {}

export class ProjectParamsDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly project: string;
}
