import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class MetaDto {
  @IsNotEmpty()
  @IsString()
  readonly key: string;

  @IsNotEmpty()
  @IsString()
  readonly value: string;

  @IsNotEmpty()
  @IsBoolean()
  readonly status: boolean;
}
