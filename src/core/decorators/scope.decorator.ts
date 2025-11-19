import { applyDecorators, SetMetadata } from '@nestjs/common';

export function Scope(permission: string) {
  return applyDecorators(SetMetadata('permission', [permission]));
}
