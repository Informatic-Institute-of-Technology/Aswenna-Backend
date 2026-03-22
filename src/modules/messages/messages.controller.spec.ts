import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthorizationGuard } from 'src/core/guards/authorization.guard';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

describe('MessagesController', () => {
  let controller: MessagesController;
  let messagesService: {
    getConversationMessages: jest.Mock;
    sendMessage: jest.Mock;
  };

  beforeEach(async () => {
    messagesService = {
      getConversationMessages: jest.fn(),
      sendMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        { provide: MessagesService, useValue: messagesService },
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

    controller = module.get<MessagesController>(MessagesController);
  });

  it('getMessages delegates to service', async () => {
    const response = { data: [], pagination: { totalDocs: 0 } };
    messagesService.getConversationMessages.mockResolvedValue(response);

    const result = await controller.getMessages(
      { user: '67d3e18216f3ec23296ef802' } as any,
      '67d3e18216f3ec23296ef801',
      { page: 1, limit: 10 } as any,
    );

    expect(messagesService.getConversationMessages).toHaveBeenCalledWith(
      '67d3e18216f3ec23296ef802',
      '67d3e18216f3ec23296ef801',
      { page: 1, limit: 10 },
    );
    expect(result).toEqual(response);
  });

  it('sendMessage delegates to service', async () => {
    const dto = { conversationId: '67d3e18216f3ec23296ef801', content: 'Hi' };
    const response = { _id: 'm1', ...dto };
    messagesService.sendMessage.mockResolvedValue(response);

    const result = await controller.sendMessage(
      { user: '67d3e18216f3ec23296ef802' } as any,
      dto as any,
    );

    expect(messagesService.sendMessage).toHaveBeenCalledWith(
      '67d3e18216f3ec23296ef802',
      dto,
    );
    expect(result).toEqual(response);
  });
});
