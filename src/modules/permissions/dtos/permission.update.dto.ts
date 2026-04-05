import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionDto } from './permission.create.dto';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
