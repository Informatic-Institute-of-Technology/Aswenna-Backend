import { IsMongoId, IsNotEmpty } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

export class RoleQueryDto extends PaginationDto {}

export class RoleParamsDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly role: string;
}
