import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Auth } from 'src/core/decorators/auth.decorator';
import { UserReal } from 'src/core/decorators/user.decorators';
import { GetMessagesQueryDto } from './dtos/get-messages.query.dto';
import { SendMessageDto } from './dtos/send-message.dto';
import { MessagesService } from './messages.service';

@Controller({ path: 'messages', version: '1' })
@Auth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':conversationId')
  getMessages(
    @UserReal() user: UserReal,
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.messagesService.getConversationMessages(
      user.user,
      conversationId,
      query,
    );
  }

  @Post()
  sendMessage(@UserReal() user: UserReal, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(user.user, dto);
  }
}
