import { IsMongoId, IsNotEmpty } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

export class FarmerQueryDto extends PaginationDto {}

export class FarmerParamsDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly farmer: string;
}
