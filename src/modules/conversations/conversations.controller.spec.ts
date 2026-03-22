import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthorizationGuard } from 'src/core/guards/authorization.guard';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

describe('ConversationsController', () => {
  let controller: ConversationsController;
  let conversationsService: {
    findAll: jest.Mock;
    listUserConversations: jest.Mock;
    createDirectConversation: jest.Mock;
    createGroupConversation: jest.Mock;
    listConversationsByUser: jest.Mock;
    addMember: jest.Mock;
    removeMember: jest.Mock;
    deleteConversation: jest.Mock;
    findById: jest.Mock;
  };

  const user = { user: '67d3e18216f3ec23296ef901' };
  const conversationId = '67d3e18216f3ec23296ef903';

  beforeEach(async () => {
    conversationsService = {
      findAll: jest.fn(),
      listUserConversations: jest.fn(),
      createDirectConversation: jest.fn(),
      createGroupConversation: jest.fn(),
      listConversationsByUser: jest.fn(),
      addMember: jest.fn(),
      removeMember: jest.fn(),
      deleteConversation: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        { provide: ConversationsService, useValue: conversationsService },
        {
          provide: AuthorizationGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn().mockReturnValue(true) },
        },
      ],
    }).compile();

    controller = module.get<ConversationsController>(ConversationsController);
  });

  it('listAllConversations delegates to service', async () => {
    const response = { data: [], pagination: { totalDocs: 0 } };
    conversationsService.findAll.mockResolvedValue(response);

    const result = await controller.listAllConversations({ page: 1, limit: 10 } as any);

    expect(conversationsService.findAll).toHaveBeenCalled();
    expect(result).toEqual(response);
  });

  it('createDirectConversation delegates to service', async () => {
    const dto = { peerUserId: '67d3e18216f3ec23296ef902' };
    const response = { _id: conversationId };
    conversationsService.createDirectConversation.mockResolvedValue(response);

    const result = await controller.createDirectConversation(user as any, dto as any);

    expect(conversationsService.createDirectConversation).toHaveBeenCalledWith(user.user, dto);
    expect(result).toEqual(response);
  });

  it('createGroupConversation delegates to service', async () => {
    const dto = { name: 'Group', memberIds: ['67d3e18216f3ec23296ef902', '67d3e18216f3ec23296ef904'] };
    const response = { _id: conversationId };
    conversationsService.createGroupConversation.mockResolvedValue(response);

    const result = await controller.createGroupConversation(user as any, dto as any);

    expect(conversationsService.createGroupConversation).toHaveBeenCalledWith(user.user, dto);
    expect(result).toEqual(response);
  });

  it('addMember delegates to service', async () => {
    const dto = { userId: '67d3e18216f3ec23296ef905' };
    const response = { _id: conversationId };
    conversationsService.addMember.mockResolvedValue(response);

    const result = await controller.addMember(user as any, conversationId, dto as any);

    expect(conversationsService.addMember).toHaveBeenCalledWith(user.user, conversationId, dto);
    expect(result).toEqual(response);
  });

  it('deleteConversation delegates to service', async () => {
    const response = { message: 'Conversation deleted successfully' };
    conversationsService.deleteConversation.mockResolvedValue(response);

    const result = await controller.deleteConversation(user as any, conversationId);

    expect(conversationsService.deleteConversation).toHaveBeenCalledWith(user.user, conversationId);
    expect(result).toEqual(response);
  });
});
