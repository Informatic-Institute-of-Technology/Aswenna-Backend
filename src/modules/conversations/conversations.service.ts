import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginatedResponseType } from 'src/common/interfaces/response.types';
import { User } from '../user/schemas/user.schema';
import {
  AddConversationMemberDto,
  CreateGroupConversationDto,
} from './dtos/create-group-conversation.dto';
import { CreateDirectConversationDto } from './dtos/create-direct-conversation.dto';
import { ListConversationsQueryDto } from './dtos/list-conversations.query.dto';
import {
  Conversation,
  ConversationMemberRole,
  ConversationType,
} from './schemas/conversation.schema';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async ensureMember(conversationId: string, userId: string) {
    this.assertObjectId(conversationId, 'Invalid conversation id');
    this.assertObjectId(userId, 'Invalid user id');

    const conversation = await this.conversationModel
      .findOne({
        _id: new Types.ObjectId(conversationId),
        'members.userId': new Types.ObjectId(userId),
      })
      .select({ _id: 1 })
      .lean();

    if (!conversation) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    return true;
  }

  async createDirectConversation(
    actorUserId: string,
    dto: CreateDirectConversationDto,
  ) {
    if (actorUserId === dto.peerUserId) {
      throw new BadRequestException(
        'Cannot create a direct chat with yourself',
      );
    }

    await this.assertUsersExist([actorUserId, dto.peerUserId]);
    const directKey = this.buildDirectKey(actorUserId, dto.peerUserId);

    const existing = await this.conversationModel
      .findOne({ type: ConversationType.DIRECT, directKey })
      .populate('members.userId', '_id fullName email auth0Id')
      .lean();

    if (existing) return existing;

    const created = await this.conversationModel.create({
      type: ConversationType.DIRECT,
      createdBy: new Types.ObjectId(actorUserId),
      directKey,
      members: [
        {
          userId: new Types.ObjectId(actorUserId),
          role: ConversationMemberRole.MEMBER,
        },
        {
          userId: new Types.ObjectId(dto.peerUserId),
          role: ConversationMemberRole.MEMBER,
        },
      ],
    });

    return this.findById(created._id.toString());
  }

  async createGroupConversation(
    actorUserId: string,
    dto: CreateGroupConversationDto,
  ) {
    const requestedMembers = new Set(dto.memberIds.filter(Boolean));
    requestedMembers.delete(actorUserId);

    if (requestedMembers.size < 2) {
      throw new BadRequestException(
        'Group conversation must contain at least 3 members including creator',
      );
    }

    const memberIds = Array.from(requestedMembers);
    await this.assertUsersExist([actorUserId, ...memberIds]);

    const created = await this.conversationModel.create({
      type: ConversationType.GROUP,
      name: dto.name,
      createdBy: new Types.ObjectId(actorUserId),
      members: [
        {
          userId: new Types.ObjectId(actorUserId),
          role: ConversationMemberRole.OWNER,
        },
        ...memberIds.map((id) => ({
          userId: new Types.ObjectId(id),
          role: ConversationMemberRole.MEMBER,
        })),
      ],
    });

    return this.findById(created._id.toString());
  }

  async listUserConversations(
    actorUserId: string,
    query: ListConversationsQueryDto,
  ): Promise<PaginatedResponseType<Conversation[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    this.assertObjectId(actorUserId, 'Invalid user id');

    const filter = { 'members.userId': new Types.ObjectId(actorUserId) };

    const [total, items] = await Promise.all([
      this.conversationModel.countDocuments(filter),
      this.conversationModel
        .find(filter)
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('members.userId', '_id fullName email auth0Id')
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

  async findAll(
    query: ListConversationsQueryDto,
  ): Promise<PaginatedResponseType<Conversation[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, totalDocs] = await Promise.all([
      this.conversationModel
        .find({})
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('members.userId', '_id fullName email auth0Id')
        .exec(),
      this.conversationModel.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalDocs / limit);

    return {
      data,
      pagination: {
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
        nextPage: page + 1,
        page,
        prevPage: page - 1,
        totalDocs,
        totalPages,
      },
    };
  }

  async listConversationsByUser(
    requesterId: string,
    userId: string,
    query: ListConversationsQueryDto,
  ): Promise<PaginatedResponseType<Conversation[]>> {
    if (requesterId !== userId) {
      throw new ForbiddenException('Cannot view another user conversations');
    }

    return this.listUserConversations(userId, query);
  }

  async findById(conversationId: string) {
    this.assertObjectId(conversationId, 'Invalid conversation id');
    const conversation = await this.conversationModel
      .findById(conversationId)
      .populate('members.userId', '_id fullName email auth0Id')
      .lean();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async touchLastMessage(
    conversationId: string,
    lastMessageText: string,
    timestamp: Date,
  ) {
    await this.conversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      {
        $set: {
          lastMessageText,
          lastMessageAt: timestamp,
        },
      },
    );
  }

  async addMember(
    actorUserId: string,
    conversationId: string,
    dto: AddConversationMemberDto,
  ) {
    const conversation = await this.getConversationForMemberManagement(
      conversationId,
      actorUserId,
    );

    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException(
        'Cannot add members to a direct conversation. Create a new group conversation.',
      );
    }

    if (
      conversation.members.some((member) =>
        this.idsEqual(member.userId, dto.userId),
      )
    ) {
      throw new BadRequestException('User is already a member of this group');
    }

    await this.assertUsersExist([dto.userId]);

    await this.conversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      {
        $push: {
          members: {
            userId: new Types.ObjectId(dto.userId),
            role: dto.role ?? ConversationMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        },
      },
    );

    return this.findById(conversationId);
  }

  async removeMember(
    actorUserId: string,
    conversationId: string,
    memberUserId: string,
  ) {
    const conversation = await this.getConversationForMemberManagement(
      conversationId,
      actorUserId,
    );

    if (conversation.type === ConversationType.DIRECT) {
      throw new BadRequestException(
        'Cannot remove members from a direct conversation. Create a new group conversation.',
      );
    }

    const member = conversation.members.find((item) =>
      this.idsEqual(item.userId, memberUserId),
    );

    if (!member) {
      throw new NotFoundException('Member not found in this conversation');
    }

    if (member.role === ConversationMemberRole.OWNER) {
      throw new BadRequestException('Cannot remove group owner');
    }

    await this.conversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      { $pull: { members: { userId: new Types.ObjectId(memberUserId) } } },
    );

    return this.findById(conversationId);
  }

  private async getConversationForMemberManagement(
    conversationId: string,
    actorUserId: string,
  ) {
    this.assertObjectId(conversationId, 'Invalid conversation id');
    this.assertObjectId(actorUserId, 'Invalid actor user id');

    const conversation = await this.conversationModel
      .findById(conversationId)
      .lean();
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const actorMember = conversation.members.find((member) =>
      this.idsEqual(member.userId, actorUserId),
    );
    if (!actorMember) {
      throw new ForbiddenException(
        'Only conversation members can manage members',
      );
    }

    if (
      actorMember.role !== ConversationMemberRole.OWNER &&
      actorMember.role !== ConversationMemberRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only owner/admin can add or remove members',
      );
    }

    return conversation;
  }

  private buildDirectKey(userA: string, userB: string) {
    return [userA, userB].sort().join(':');
  }

  private idsEqual(
    left: Types.ObjectId | string,
    right: Types.ObjectId | string,
  ) {
    return String(left) === String(right);
  }

  private assertObjectId(value: string, message: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(message);
    }
  }

  private async assertUsersExist(userIds: string[]) {
    const normalized = Array.from(new Set(userIds));
    const validIds = normalized.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length !== normalized.length) {
      throw new BadRequestException('Invalid user id in member list');
    }

    const existingCount = await this.userModel.countDocuments({
      _id: { $in: validIds.map((id) => new Types.ObjectId(id)) },
    });

    if (existingCount !== normalized.length) {
      throw new NotFoundException('One or more users not found');
    }
  }
}
