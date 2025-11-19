import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { PermissionGuard } from '../guards/permission.guard';

export function Auth() {
  return applyDecorators(UseGuards(AuthorizationGuard, PermissionGuard));
}
