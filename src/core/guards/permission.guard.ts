import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): Promise<boolean> | boolean {
    const request: Request = context.switchToHttp().getRequest();

    const userPermissions = (request?.user?.scope as string) || '';
    const requiredPermissions =
      this.reflector.get<string[]>('permission', context.getHandler()) || [];
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.split(' ').includes(permission),
    );

    if (requiredPermissions.length === 0 || hasPermission) return true;

    throw new ForbiddenException(
      'Insufficient permissions to access this resource',
    );
  }
}
