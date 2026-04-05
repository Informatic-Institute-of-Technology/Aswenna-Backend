import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface UserReal {
  user: string;
  userId?: string;
  sub?: string;
  email?: string;
  [key: string]: unknown;
}

export const UserReal = createParamDecorator(
  (
    data: keyof UserReal | undefined,
    ctx: ExecutionContext,
  ): UserReal | string => {
    const request: Request = ctx.switchToHttp().getRequest();
    const tokenUser = (request.user ?? {}) as Record<string, unknown>;

    const sub = typeof tokenUser.sub === 'string' ? tokenUser.sub : undefined;
    const userId =
      typeof tokenUser.userId === 'string' ? tokenUser.userId : sub;

    const normalizedUser: UserReal = {
      ...(tokenUser as UserReal),
      sub,
      userId,
      user: userId ?? '',
    };

    if (data) {
      const value = normalizedUser[data];
      return typeof value === 'string' ? value : '';
    }

    return normalizedUser;
  },
);
