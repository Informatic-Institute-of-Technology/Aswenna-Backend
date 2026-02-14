import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { ConfigService } from '@nestjs/config';
import { SendMessageDto } from './dtos/send-message.dto';
import { JoinRoomDto } from './dtos/join-room.dto';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;


  private readonly users = new Map<string, string>();

  private readonly jwks;
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

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });

      const userId = payload.sub as string;
      client.data.userId = userId;

      this.users.set(userId, client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.users.delete(userId);
    }
  }

  
  @SubscribeMessage('join-room')
  joinRoom(
    @MessageBody() dto: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(dto.roomId);
  }

  
  @SubscribeMessage('send-message')
  sendMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.userId;


    
    this.server.to(dto.roomId).emit('new-message', {
      roomId: dto.roomId,
      senderId,
      message: dto.message,
    });

    
    
    const targetSocketId = this.users.get(dto.notifyUserId);

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('notification', {
        title: 'New Message',
        from: senderId,
        roomId: dto.roomId,
      });
    }
  }
}
