import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [ConfigModule],
  providers: [ChatGateway],
})
export class ChatModule {}
