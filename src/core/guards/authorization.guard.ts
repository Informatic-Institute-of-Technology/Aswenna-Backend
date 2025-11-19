import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { createRemoteJWKSet, JWTPayload, jwtVerify } from 'jose';

// Augment Express Request to include `user`
declare module 'express' {
  interface Request {
    user: JWTPayload;
  }
}

@Injectable()
export class AuthorizationGuard implements CanActivate {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly audience: string;
  private readonly issuer: string;

  constructor(private readonly configService: ConfigService) {
    const domain = this.configService.get<string>('auth0.domain') ?? '';
    this.audience = this.configService.get<string>('auth0.audience') ?? '';
    this.issuer = `https://${domain}/`;

    this.jwks = createRemoteJWKSet(
      new URL(`https://${domain}/.well-known/jwks.json`),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authorization.split(' ')[1];
    if (!token) throw new UnauthorizedException('Invalid Authorization header');

    try {
      // Decode & verify token using JWKS provider
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
