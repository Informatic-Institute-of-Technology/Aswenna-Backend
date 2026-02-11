import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthorizationGuard } from '../guards/authorization.guard';

export function Auth() {
  return applyDecorators(UseGuards(AuthorizationGuard));
}
