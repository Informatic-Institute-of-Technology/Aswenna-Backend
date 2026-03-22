import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConversationsService } from './conversations.service';
import {
  Conversation,
  ConversationMemberRole,
  ConversationType,
} from './schemas/conversation.schema';
import { User } from '../user/schemas/user.schema';
import { Message } from '../messages/schemas/message.schema';
import { AzureBlobStorageService } from 'src/config/azure/services/azure-blob-storage.service';
import { ChatNotifierService } from '../chat/chat-notifier.service';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let conversationModel: {
    findOne: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    countDocuments: jest.Mock;
    find: jest.Mock;
    updateOne: jest.Mock;
    deleteOne: jest.Mock;
  };
  let userModel: {
    countDocuments: jest.Mock;
  };
  let messageModel: {
    deleteMany: jest.Mock;
  };
  let azureBlobStorageService: {
    getFileUrl: jest.Mock;
  };
  let chatNotifierService: {
    emitConversationCreated: jest.Mock;
    emitConversationDeleted: jest.Mock;
  };

  const actorUserId = '67d3e18216f3ec23296ef901';
  const peerUserId = '67d3e18216f3ec23296ef902';
  const conversationId = '67d3e18216f3ec23296ef903';

  beforeEach(async () => {
    conversationModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
      find: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
    };

    userModel = {
      countDocuments: jest.fn(),
    };

    messageModel = {
      deleteMany: jest.fn(),
    };

    azureBlobStorageService = {
      getFileUrl: jest.fn(),
    };

    chatNotifierService = {
      emitConversationCreated: jest.fn(),
      emitConversationDeleted: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: getModelToken(Conversation.name),
          useValue: conversationModel,
        },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Message.name), useValue: messageModel },
        {
          provide: AzureBlobStorageService,
          useValue: azureBlobStorageService,
        },
        { provide: ChatNotifierService, useValue: chatNotifierService },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  it('ensureMember throws for invalid ids', async () => {
    await expect(service.ensureMember('x', actorUserId)).rejects.toThrow(
      new BadRequestException('Invalid conversation id'),
    );
  });

  it('createDirectConversation throws when actor equals peer', async () => {
    await expect(
      service.createDirectConversation(actorUserId, { peerUserId: actorUserId }),
    ).rejects.toThrow(new BadRequestException('Cannot create a direct chat with yourself'));
  });

  it('createGroupConversation throws when less than 3 members total', async () => {
    await expect(
      service.createGroupConversation(actorUserId, {
        name: 'Group',
        memberIds: [peerUserId],
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Group conversation must contain at least 3 members including creator',
      ),
    );
  });

  it('listConversationsByUser throws when requester != user', async () => {
    await expect(
      service.listConversationsByUser('67d3e18216f3ec23296ef999', actorUserId, {
        page: 1,
        limit: 10,
      } as any),
    ).rejects.toThrow(
      new ForbiddenException('Cannot view another user conversations'),
    );
  });

  it('deleteConversation deletes records and emits notification for owner/admin', async () => {
    conversationModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: conversationId,
        type: ConversationType.GROUP,
        members: [
          { userId: actorUserId, role: ConversationMemberRole.OWNER },
          { userId: peerUserId, role: ConversationMemberRole.MEMBER },
        ],
      }),
    });
    messageModel.deleteMany.mockResolvedValue({});
    conversationModel.deleteOne.mockResolvedValue({});

    const result = await service.deleteConversation(actorUserId, conversationId);

    expect(messageModel.deleteMany).toHaveBeenCalled();
    expect(conversationModel.deleteOne).toHaveBeenCalled();
    expect(chatNotifierService.emitConversationDeleted).toHaveBeenCalledWith(
      [peerUserId],
      conversationId,
    );
    expect(result).toEqual({ message: 'Conversation deleted successfully' });
  });

  it('deleteConversation throws when conversation not found', async () => {
    conversationModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    await expect(
      service.deleteConversation(actorUserId, conversationId),
    ).rejects.toThrow(new NotFoundException('Conversation not found'));
  });
});
