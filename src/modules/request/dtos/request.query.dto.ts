import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { RequestStatus } from '../schemas/request.schema';

export class RequestQueryDto extends PaginationDto {
  @IsOptional()
  @IsMongoId()
  recipient?: string;

  @IsOptional()
  @IsMongoId()
  receiver?: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  /**
   * When true, returns only requests where the investor agreement has not been uploaded yet.
   * Useful for investors to see which requests still need their agreement file.
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  agreementPending?: boolean;
}
