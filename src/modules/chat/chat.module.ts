import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';
import { ChatGateway } from './chat.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@Module({
  imports: [ConversationsModule, MessagesModule],
  providers: [ChatGateway, WsJwtGuard],
  exports: [ChatGateway],
})
export class ChatModule {}
