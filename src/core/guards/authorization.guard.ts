import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// Augment Express Request to include `user`
declare module 'express' {
  interface Request {
    user: { sub: string; [key: string]: any };
  }
}

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request: Request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authorization.split(' ')[1];
    if (!token) throw new UnauthorizedException('Invalid Authorization header');

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
      return true;
    } catch (error) {
      console.log('JWT verification failed:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
