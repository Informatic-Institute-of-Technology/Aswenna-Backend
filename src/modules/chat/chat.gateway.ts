import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatNotifierService } from './chat-notifier.service';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';
import {
  JoinConversationEventDto,
  ReadReceiptEventDto,
  SendMessageEventDto,
  TypingEventDto,
} from './dtos/chat-event.dto';
import { WsJwtGuard } from './guards/ws-jwt.guard';

interface ChatSocketData {
  userId?: string;
}

@WebSocketGateway({ namespace: 'chat', cors: true })
@UseGuards(WsJwtGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
)
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly chatNotifierService: ChatNotifierService,
  ) {}

  afterInit(server: Server) {
    this.chatNotifierService.setServer(server);
  }

  async handleConnection(client: Socket) {
    const userId = await this.resolveUserIdFromHandshake(client);
    if (!userId) {
      client.disconnect();
      return;
    }

    const data = client.data as ChatSocketData;
    data.userId = userId;
    await client.join(this.userRoom(userId));
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinConversationEventDto,
  ): Promise<WsResponse<{ conversationId: string }>> {
    const userId = this.getUserId(client);
    await this.conversationsService.ensureMember(
      payload.conversationId,
      userId,
    );

    await client.join(this.conversationRoom(payload.conversationId));
    return {
      event: 'conversation:joined',
      data: { conversationId: payload.conversationId },
    };
  }

  @SubscribeMessage('conversation:leave')
  async leaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinConversationEventDto,
  ): Promise<WsResponse<{ conversationId: string }>> {
    const userId = this.getUserId(client);
    await this.conversationsService.ensureMember(
      payload.conversationId,
      userId,
    );

    await client.leave(this.conversationRoom(payload.conversationId));
    return {
      event: 'conversation:left',
      data: { conversationId: payload.conversationId },
    };
  }

  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageEventDto,
  ): Promise<WsResponse<{ id: string; conversationId: string }>> {
    const userId = this.getUserId(client);

    const message = await this.messagesService.sendMessage(userId, {
      conversationId: payload.conversationId,
      content: payload.content,
      type: payload.type,
    });

    this.server
      .to(this.conversationRoom(payload.conversationId))
      .emit('message:new', message);

    return {
      event: 'message:sent',
      data: {
        id: String(message?._id),
        conversationId: payload.conversationId,
      },
    };
  }

  @SubscribeMessage('typing:start')
  async typingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingEventDto,
  ): Promise<WsResponse<{ ok: true }>> {
    const userId = this.getUserId(client);
    await this.conversationsService.ensureMember(
      payload.conversationId,
      userId,
    );

    client
      .to(this.conversationRoom(payload.conversationId))
      .emit('typing:update', {
        conversationId: payload.conversationId,
        userId,
        isTyping: true,
      });

    return { event: 'typing:ack', data: { ok: true } };
  }

  @SubscribeMessage('typing:stop')
  async typingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingEventDto,
  ): Promise<WsResponse<{ ok: true }>> {
    const userId = this.getUserId(client);
    await this.conversationsService.ensureMember(
      payload.conversationId,
      userId,
    );

    client
      .to(this.conversationRoom(payload.conversationId))
      .emit('typing:update', {
        conversationId: payload.conversationId,
        userId,
        isTyping: false,
      });

    return { event: 'typing:ack', data: { ok: true } };
  }

  @SubscribeMessage('message:read')
  async readReceipt(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ReadReceiptEventDto,
  ): Promise<
    WsResponse<{ conversationId: string; userId: string; messageIds: string[] }>
  > {
    const userId = this.getUserId(client);

    const readResult = await this.messagesService.markConversationRead(
      userId,
      payload.conversationId,
      payload.messageIds,
    );

    this.server
      .to(this.conversationRoom(payload.conversationId))
      .emit('message:read', readResult);

    return {
      event: 'message:read:ack',
      data: readResult,
    };
  }

  private getUserId(client: Socket): string {
    const data = client.data as ChatSocketData;
    const userId = data.userId;
    if (!userId) {
      throw new WsException('Unauthorized');
    }
    return userId;
  }

  private conversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private async resolveUserIdFromHandshake(
    client: Socket,
  ): Promise<string | null> {
    const authToken = client.handshake.auth?.token as unknown;
    const headerToken = client.handshake.headers.authorization;

    const tokenCandidate =
      typeof authToken === 'string' && authToken.length > 0
        ? authToken
        : typeof headerToken === 'string'
          ? headerToken
          : null;

    if (!tokenCandidate) return null;

    const token = tokenCandidate.replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;

    try {
      const payload =
        await this.jwtService.verifyAsync<Record<string, unknown>>(token);
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
