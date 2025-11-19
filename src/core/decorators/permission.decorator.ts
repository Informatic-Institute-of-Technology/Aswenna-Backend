import { applyDecorators, SetMetadata } from '@nestjs/common';

export function Permission(permission: string) {
  return applyDecorators(SetMetadata('permission', [permission]));
}
