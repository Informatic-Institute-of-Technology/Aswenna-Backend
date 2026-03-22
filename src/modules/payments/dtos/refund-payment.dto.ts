import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class RefundPaymentDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly amount?: number;

  @IsOptional()
  @IsString()
  readonly reason?: string;
}
