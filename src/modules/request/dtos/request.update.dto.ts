import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { RequestStatus } from '../schemas/request.schema';

export class UpdateRequestStatusDto {
  @IsEnum([
    RequestStatus.APPROVED,
    RequestStatus.REJECTED,
    RequestStatus.CANCELLED,
  ])
  @IsNotEmpty()
  readonly status: RequestStatus;
}

export class UpdateRequestDto {
  @IsOptional()
  @IsEnum([
    RequestStatus.APPROVED,
    RequestStatus.REJECTED,
    RequestStatus.CANCELLED,
  ])
  readonly status?: RequestStatus;

  @IsOptional()
  readonly metadata?: Record<string, any>;
}
