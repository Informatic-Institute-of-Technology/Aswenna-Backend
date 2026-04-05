import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { OfferStatus, OfferType } from '../schemas/offer.schema';

export class OfferParamsDto {
  @IsNotEmpty()
  @IsMongoId()
  readonly offer: string;
}

export class OfferQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OfferType)
  readonly type?: OfferType;

  @IsOptional()
  @IsEnum(OfferStatus)
  readonly status?: OfferStatus;
}
