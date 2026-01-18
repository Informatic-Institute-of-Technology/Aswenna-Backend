import { IsOptional, IsString } from 'class-validator';

export class RoleUpdateDto {
  @IsString()
  @IsOptional()
  readonly description: string;
}
