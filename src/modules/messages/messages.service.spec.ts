import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { MessagesService } from './messages.service';
import { Message, MessageType } from './schemas/message.schema';
import { ConversationsService } from '../conversations/conversations.service';

describe('MessagesService', () => {
  let service: MessagesService;
  let messageModel: {
    countDocuments: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    updateMany: jest.Mock;
  };
  let conversationsService: {
    ensureMember: jest.Mock;
    touchLastMessage: jest.Mock;
  };

  const conversationId = '67d3e18216f3ec23296ef801';
  const actorUserId = '67d3e18216f3ec23296ef802';

  beforeEach(async () => {
    messageModel = {
      countDocuments: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updateMany: jest.fn(),
    };

    conversationsService = {
      ensureMember: jest.fn(),
      touchLastMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getModelToken(Message.name),
          useValue: messageModel,
        },
        {
          provide: ConversationsService,
          useValue: conversationsService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  it('getConversationMessages throws on invalid conversation id', async () => {
    await expect(
      service.getConversationMessages(actorUserId, 'invalid-id', {
        page: 1,
        limit: 10,
      } as any),
    ).rejects.toThrow(new BadRequestException('Invalid conversation id'));
  });

  it('getConversationMessages returns paginated messages', async () => {
    conversationsService.ensureMember.mockResolvedValue(true);
    messageModel.countDocuments.mockResolvedValue(1);
    const findChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([{ _id: 'm1' }]),
    };
    messageModel.find.mockReturnValue(findChain);

    const result = await service.getConversationMessages(actorUserId, conversationId, {
      page: 1,
      limit: 10,
    } as any);

    expect(conversationsService.ensureMember).toHaveBeenCalledWith(
      conversationId,
      actorUserId,
    );
    expect(result.data).toHaveLength(1);
    expect(result.pagination.totalDocs).toBe(1);
  });

  it('sendMessage creates message and updates conversation last message', async () => {
    conversationsService.ensureMember.mockResolvedValue(true);
    const createdAt = new Date();
    messageModel.create.mockResolvedValue({ _id: 'm1', createdAt });
    messageModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'm1', content: 'Hello' }),
      }),
    });

    const result = await service.sendMessage(actorUserId, {
      conversationId,
      content: 'Hello',
      type: MessageType.TEXT,
    } as any);

    expect(messageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Hello',
        senderId: expect.any(Types.ObjectId),
      }),
    );
    expect(conversationsService.touchLastMessage).toHaveBeenCalledWith(
      conversationId,
      'Hello',
      createdAt,
    );
    expect(result).toEqual({ _id: 'm1', content: 'Hello' });
  });

  it('markConversationRead returns empty messageIds when no unread records', async () => {
    conversationsService.ensureMember.mockResolvedValue(true);
    messageModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await service.markConversationRead(
      actorUserId,
      conversationId,
      [],
    );

    expect(result).toEqual({
      conversationId,
      userId: actorUserId,
      messageIds: [],
    });
    expect(messageModel.updateMany).not.toHaveBeenCalled();
  });

  it('markConversationRead updates unread messages and returns ids', async () => {
    conversationsService.ensureMember.mockResolvedValue(true);
    const unread = [{ _id: new Types.ObjectId('67d3e18216f3ec23296ef8aa') }];
    messageModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(unread),
      }),
    });
    messageModel.updateMany.mockResolvedValue({});

    const result = await service.markConversationRead(actorUserId, conversationId);

    expect(messageModel.updateMany).toHaveBeenCalled();
    expect(result.messageIds).toEqual([String(unread[0]._id)]);
  });
});
