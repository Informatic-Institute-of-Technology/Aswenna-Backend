import { IsMongoId } from 'class-validator';

export class PermissionParamsDto {
  @IsMongoId()
  permission: string;
}
