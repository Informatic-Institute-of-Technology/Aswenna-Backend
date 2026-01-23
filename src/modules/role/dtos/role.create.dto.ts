import { IsNotEmpty, IsString } from 'class-validator';

export class RoleCreateDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  readonly description: string;
}
