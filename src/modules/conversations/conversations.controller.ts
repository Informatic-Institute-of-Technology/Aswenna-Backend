import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/core/decorators/auth.decorator';
import { UserReal } from 'src/core/decorators/user.decorators';
import { CreateDirectConversationDto } from './dtos/create-direct-conversation.dto';
import {
  AddConversationMemberDto,
  CreateGroupConversationDto,
} from './dtos/create-group-conversation.dto';
import { ListConversationsQueryDto } from './dtos/list-conversations.query.dto';
import { ConversationsService } from './conversations.service';

@Controller({ path: 'conversations', version: '1' })
@Auth()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  listAllConversations(@Query() query: ListConversationsQueryDto) {
    return this.conversationsService.findAll(query);
  }

  @Get('me')
  listMyConversations(
    @UserReal() user: UserReal,
    @Query() query: ListConversationsQueryDto,
  ) {
    return this.conversationsService.listUserConversations(user.user, query);
  }

  @Post('direct')
  createDirectConversation(
    @UserReal() user: UserReal,
    @Body() dto: CreateDirectConversationDto,
  ) {
    return this.conversationsService.createDirectConversation(user.user, dto);
  }

  @Post('group')
  createGroupConversation(
    @UserReal() user: UserReal,
    @Body() dto: CreateGroupConversationDto,
  ) {
    return this.conversationsService.createGroupConversation(user.user, dto);
  }

  @Get('user/:userId')
  listUserConversations(
    @UserReal() requester: UserReal,
    @Param('userId') userId: string,
    @Query() query: ListConversationsQueryDto,
  ) {
    return this.conversationsService.listConversationsByUser(
      requester.user,
      userId,
      query,
    );
  }

  @Post(':id/members')
  addMember(
    @UserReal() user: UserReal,
    @Param('id') conversationId: string,
    @Body() dto: AddConversationMemberDto,
  ) {
    return this.conversationsService.addMember(user.user, conversationId, dto);
  }

  @Delete(':id/members/:memberUserId')
  removeMember(
    @UserReal() user: UserReal,
    @Param('id') conversationId: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.conversationsService.removeMember(
      user.user,
      conversationId,
      memberUserId,
    );
  }

  @Delete(':id')
  deleteConversation(
    @UserReal() user: UserReal,
    @Param('id') conversationId: string,
  ) {
    return this.conversationsService.deleteConversation(
      user.user,
      conversationId,
    );
  }
}
