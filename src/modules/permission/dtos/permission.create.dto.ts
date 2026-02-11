import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PermissionType } from 'src/common/enums/permission.type.enum';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  scope: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PermissionType)
  @IsOptional()
  type?: PermissionType;
}
