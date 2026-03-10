import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { OfferType } from '../schemas/offer.schema';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

export class OfferParamsDto {
  @IsNotEmpty()
  @IsMongoId()
  readonly offer: string;
}

export class OfferQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OfferType)
  readonly type?: OfferType;
}
