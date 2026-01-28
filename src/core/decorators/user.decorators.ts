import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface UserReal {
  user: string;
}

export const UserReal = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): UserReal => {
    const request: Request = ctx.switchToHttp().getRequest();

    return request.user as unknown as UserReal;
  },
);
