import { Module } from '@nestjs/common';
import { ChatNotifierService } from './chat-notifier.service';

@Module({
  providers: [ChatNotifierService],
  exports: [ChatNotifierService],
})
export class ChatNotifierModule {}
