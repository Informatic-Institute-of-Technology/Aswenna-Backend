import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { PaymentStatus } from '../schemas/payment.schema';

export class PaymentQueryDto extends PaginationDto {
  @IsOptional()
  @IsMongoId()
  readonly user?: string;

  @IsOptional()
  @IsMongoId()
  readonly contract?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  readonly status?: PaymentStatus;
}
