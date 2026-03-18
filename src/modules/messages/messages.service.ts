import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginatedResponseType } from 'src/common/interfaces/response.types';
import { ConversationsService } from '../conversations/conversations.service';
import { GetMessagesQueryDto } from './dtos/get-messages.query.dto';
import { SendMessageDto } from './dtos/send-message.dto';
import { Message, MessageType } from './schemas/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    private readonly conversationsService: ConversationsService,
  ) {}

  async getConversationMessages(
    actorUserId: string,
    conversationId: string,
    query: GetMessagesQueryDto,
  ): Promise<PaginatedResponseType<Message[]>> {
    this.assertObjectId(conversationId, 'Invalid conversation id');
    await this.conversationsService.ensureMember(conversationId, actorUserId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const filter = { conversationId: new Types.ObjectId(conversationId) };

    const [total, items] = await Promise.all([
      this.messageModel.countDocuments(filter),
      this.messageModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('senderId', '_id fullName email auth0Id')
        .exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: items,
      pagination: {
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
        nextPage: page + 1,
        page,
        prevPage: page - 1,
        totalDocs: total,
        totalPages,
      },
    };
  }

  async sendMessage(actorUserId: string, dto: SendMessageDto) {
    this.assertObjectId(dto.conversationId, 'Invalid conversation id');
    await this.conversationsService.ensureMember(
      dto.conversationId,
      actorUserId,
    );

    const created = await this.messageModel.create({
      conversationId: new Types.ObjectId(dto.conversationId),
      senderId: new Types.ObjectId(actorUserId),
      content: dto.content,
      type: dto.type ?? MessageType.TEXT,
    });

    await this.conversationsService.touchLastMessage(
      dto.conversationId,
      dto.content,
      created.createdAt,
    );

    return this.messageModel
      .findById(created._id)
      .populate('senderId', '_id fullName email auth0Id')
      .lean();
  }

  async markConversationRead(
    actorUserId: string,
    conversationId: string,
    messageIds?: string[],
  ) {
    this.assertObjectId(conversationId, 'Invalid conversation id');
    await this.conversationsService.ensureMember(conversationId, actorUserId);

    const validMessageIds = (messageIds ?? []).filter((id) =>
      Types.ObjectId.isValid(id),
    );

    const filter: Record<string, unknown> = {
      conversationId: new Types.ObjectId(conversationId),
      senderId: { $ne: new Types.ObjectId(actorUserId) },
      'readBy.userId': { $ne: new Types.ObjectId(actorUserId) },
    };

    if (validMessageIds.length) {
      filter._id = { $in: validMessageIds.map((id) => new Types.ObjectId(id)) };
    }

    const unreadMessages = await this.messageModel
      .find(filter)
      .select({ _id: 1 })
      .lean();

    if (unreadMessages.length === 0) {
      return {
        conversationId,
        userId: actorUserId,
        messageIds: [],
      };
    }

    await this.messageModel.updateMany(
      {
        _id: { $in: unreadMessages.map((message) => message._id) },
        'readBy.userId': { $ne: new Types.ObjectId(actorUserId) },
      },
      {
        $push: {
          readBy: {
            userId: new Types.ObjectId(actorUserId),
            readAt: new Date(),
          },
        },
      },
    );

    return {
      conversationId,
      userId: actorUserId,
      messageIds: unreadMessages.map((message) => String(message._id)),
    };
  }

  private assertObjectId(value: string, message: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(message);
    }
  }
}
