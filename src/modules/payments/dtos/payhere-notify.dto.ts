import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PayHereNotifyDto {
  @IsNotEmpty()
  @IsString()
  readonly merchant_id: string;

  @IsNotEmpty()
  @IsString()
  readonly order_id: string;

  @IsOptional()
  @IsString()
  readonly payment_id?: string;

  @IsNotEmpty()
  @IsString()
  readonly payhere_amount: string;

  @IsNotEmpty()
  @IsString()
  readonly payhere_currency: string;

  @IsNotEmpty()
  @IsString()
  readonly status_code: string;

  @IsOptional()
  @IsString()
  readonly method?: string;

  @IsOptional()
  @IsString()
  readonly status_message?: string;

  @IsOptional()
  @IsString()
  readonly card_holder_name?: string;

  @IsOptional()
  @IsString()
  readonly card_no?: string;

  @IsOptional()
  @IsString()
  readonly custom_1?: string;

  @IsOptional()
  @IsString()
  readonly custom_2?: string;

  @IsNotEmpty()
  @IsString()
  readonly md5sig: string;
}
