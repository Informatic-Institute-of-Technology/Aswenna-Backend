import { IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class UserUpdateDto {
  @IsString()
  @IsOptional()
  readonly firstName: string;

  @IsString()
  @IsOptional()
  readonly lastName: string;

  @IsString()
  @IsOptional()
  readonly address: string;

  @IsPhoneNumber()
  @IsOptional()
  readonly phoneNumber: string;
}
