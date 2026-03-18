import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

interface ChatSocketData {
  userId?: string;
  sub?: string;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const client = context.switchToWs().getClient<Socket>();
    const data = client.data as ChatSocketData;

    if (data.userId) return true;

    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException('Missing WebSocket token');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<Record<string, unknown>>(token);
      const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
      if (!sub) {
        throw new UnauthorizedException('Token subject is missing');
      }

      data.userId = sub;
      data.sub = sub;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired WebSocket token');
    }
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token as unknown;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken.replace(/^Bearer\s+/i, '').trim();
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7).trim();
    }

    return null;
  }
}
