import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class ChatNotifierService {
  private server?: Server;

  setServer(server: Server) {
    this.server = server;
  }

  emitConversationCreated(userIds: string[], conversationId: string) {
    this.emitConversationSync(userIds, {
      action: 'created',
      conversationId,
    });
  }

  emitConversationDeleted(userIds: string[], conversationId: string) {
    this.emitConversationSync(userIds, {
      action: 'deleted',
      conversationId,
    });
  }

  private emitConversationSync(
    userIds: string[],
    payload: { action: 'created' | 'deleted'; conversationId: string },
  ) {
    if (!this.server) return;

    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    uniqueUserIds.forEach((userId) => {
      this.server?.to(this.userRoom(userId)).emit('conversation:sync', payload);
    });
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }
}
