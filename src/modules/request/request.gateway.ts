import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import type { IRequestResponse } from './request.types';

@WebSocketGateway({ namespace: 'requests', cors: true })
@Injectable()
export class RequestGateway {
  @WebSocketServer()
  private readonly server: Server;

  constructor() {}

  sendNewRequest(userId: string, payload: IRequestResponse) {
    if (this.server)
      this.server.to(`user:${userId}`).emit('new-request', payload);
  }

  sendStatusUpdate(userId: string, payload: IRequestResponse) {
    if (this.server)
      this.server.to(`user:${userId}`).emit('request-updated', payload);
  }

  sendRequestCancelled(payload: IRequestResponse) {
    if (this.server) {
      this.server
        .to(`user:${payload.recipient.toString()}`)
        .emit('request-cancelled', payload);
      this.server
        .to(`user:${payload.receiver.toString()}`)
        .emit('request-cancelled', payload);
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { user: string },
  ) {
    const room = `user:${data.user}`;
    client.join(room);
    client.emit('joined', { room });
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { user: string },
  ) {
    const room = `user:${data.user}`;
    client.leave(room);
    client.emit('left', { room });
  }
}
