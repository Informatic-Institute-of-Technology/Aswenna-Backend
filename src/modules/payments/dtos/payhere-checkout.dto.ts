import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
} from 'class-validator';

export class PayHereCheckoutDto {
  @IsOptional()
  @IsMongoId()
  readonly paymentId?: string;

  @ValidateIf((dto: PayHereCheckoutDto) => !dto.paymentId)
  @IsNotEmpty()
  @IsMongoId()
  readonly contract?: string;

  @ValidateIf((dto: PayHereCheckoutDto) => !dto.paymentId)
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  readonly amount?: number;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsNotEmpty()
  @IsString()
  readonly firstName: string;

  @IsNotEmpty()
  @IsString()
  readonly lastName: string;

  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsOptional()
  @IsString()
  readonly phone?: string;

  @IsOptional()
  @IsString()
  readonly address?: string;

  @IsOptional()
  @IsString()
  readonly city?: string;

  @IsOptional()
  @IsString()
  readonly country?: string;

  @IsOptional()
  @IsString()
  readonly returnUrl?: string;

  @IsOptional()
  @IsString()
  readonly cancelUrl?: string;

  @IsOptional()
  @IsString()
  readonly notifyUrl?: string;

  @IsOptional()
  @IsString()
  readonly items?: string;
}
