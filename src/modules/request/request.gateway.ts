import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { InteractionRequest } from './schemas/request.schema';

@WebSocketGateway({ namespace: 'requests', cors: true })
@Injectable()
export class RequestGateway {
  @WebSocketServer()
  private readonly server: Server;

  constructor() {}

  sendNewRequest(receiver: string, payload: InteractionRequest) {
    if (this.server)
      this.server.to(`user:${receiver}`).emit('new-request', payload);
  }

  sendStatusUpdate(sender: string, payload: InteractionRequest) {
    if (this.server)
      this.server.to(`user:${sender}`).emit('request-updated', payload);
  }

  sendRequestCancelled(payload: InteractionRequest) {
    if (this.server) {
      this.server
        .to(`user:${payload.sender.toString()}`)
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
