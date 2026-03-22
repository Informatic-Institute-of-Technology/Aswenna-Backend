import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginatedResponseType } from 'src/common/interfaces/response.types';
import { RequestCreateDto } from './dtos/request.create.dto';
import { RequestQueryDto } from './dtos/request.query.dto';
import {
  OverwriteJourneyStepsDto,
  RequestUpdateDto,
  UpdateJourneyStepDto,
} from './dtos/request.update.dto';
import { UserRequest } from './schemas/request.schema';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(UserRequest.name)
    private readonly requestModel: Model<UserRequest>,
  ) {}

  async findAllForUser(
    userId: string,
    query: RequestQueryDto,
  ): Promise<PaginatedResponseType<UserRequest[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const filter: FilterQuery<UserRequest> = {
      $or: [
        { recipient: new Types.ObjectId(userId) },
        { receiver: new Types.ObjectId(userId) },
      ],
    };

    if (query.targetType) filter.targetType = query.targetType;
    if (query.target) filter.target = new Types.ObjectId(query.target);
    if (query.status) filter.status = query.status;

    if (query.recipient || query.receiver) {
      const recipientFilter = query.recipient
        ? new Types.ObjectId(query.recipient)
        : undefined;
      const receiverFilter = query.receiver
        ? new Types.ObjectId(query.receiver)
        : undefined;

      const requestedSelf =
        recipientFilter?.toString() === userId ||
        receiverFilter?.toString() === userId;

      if (!requestedSelf) {
        throw new ForbiddenException(
          'You can only filter by recipient/receiver when one is your own user id',
        );
      }

      if (recipientFilter) filter.recipient = recipientFilter;
      if (receiverFilter) filter.receiver = receiverFilter;
    }

    const [data, totalDocs] = await Promise.all([
      this.requestModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.requestModel.countDocuments(filter),
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

  async findByIdForUser(id: string, userId: string): Promise<UserRequest> {
    const request = await this.requestModel.findById(id);
    if (!request) throw new NotFoundException('Request not found');

    this.assertUserCanAccess(request, userId);
    return request;
  }

  async createRequest(dto: RequestCreateDto): Promise<UserRequest> {
    this.ensureRecipientOrReceiverRole(dto.recipient, dto.receiver);

    return this.requestModel.create({
      ...dto,
      target: new Types.ObjectId(dto.target),
      recipient: new Types.ObjectId(dto.recipient),
      receiver: new Types.ObjectId(dto.receiver),
      timestamp: dto.timestamp ? new Date(dto.timestamp) : undefined,
      highlighted: dto.highlighted ?? false,
    });
  }

  async updateForUser(
    id: string,
    userId: string,
    dto: RequestUpdateDto,
  ): Promise<UserRequest> {
    const request = await this.requestModel.findById(id);
    if (!request) throw new NotFoundException('Request not found');
    this.assertUserCanAccess(request, userId);

    if (dto.recipient || dto.receiver) {
      this.ensureRecipientOrReceiverRole(
        dto.recipient ?? request.recipient.toString(),
        dto.receiver ?? request.receiver.toString(),
      );
    }

    if (dto.target) request.target = new Types.ObjectId(dto.target);
    if (dto.recipient) request.recipient = new Types.ObjectId(dto.recipient);
    if (dto.receiver) request.receiver = new Types.ObjectId(dto.receiver);
    if (dto.status !== undefined) request.status = dto.status;
    if (dto.statusBadge) request.statusBadge = dto.statusBadge;
    if (dto.tags) request.tags = dto.tags;
    if (dto.description !== undefined) request.description = dto.description;
    if (dto.timestamp !== undefined)
      request.timestamp = new Date(dto.timestamp);
    if (dto.investmentAmount !== undefined)
      request.investmentAmount = dto.investmentAmount;
    if (dto.insight !== undefined) request.insight = dto.insight;
    if (dto.highlighted !== undefined) request.highlighted = dto.highlighted;

    return request.save();
  }

  async deleteForUser(id: string, userId: string): Promise<{ deleted: true }> {
    const request = await this.requestModel.findById(id);
    if (!request) throw new NotFoundException('Request not found');
    this.assertUserCanAccess(request, userId);

    await this.requestModel.deleteOne({ _id: request._id });
    return { deleted: true };
  }

  async addJourneyStep(
    requestId: string,
    userId: string,
    dto: { step: any },
  ): Promise<UserRequest> {
    const request = await this.findByIdForUser(requestId, userId);
    request.journeySteps.push(dto.step);
    return request.save();
  }

  async updateJourneyStep(
    requestId: string,
    stepId: string,
    userId: string,
    dto: UpdateJourneyStepDto,
  ): Promise<UserRequest> {
    const request = await this.findByIdForUser(requestId, userId);
    const step = request.journeySteps.find(
      (item) => item._id.toString() === stepId,
    );

    if (!step) throw new NotFoundException('Journey step not found');

    step.title = dto.step.title;
    step.description = dto.step.description;
    step.timestamp = dto.step.timestamp;
    step.status = dto.step.status;
    step.icon = dto.step.icon;

    return request.save();
  }

  async removeJourneyStep(
    requestId: string,
    stepId: string,
    userId: string,
  ): Promise<UserRequest> {
    const request = await this.findByIdForUser(requestId, userId);
    request.journeySteps = request.journeySteps.filter(
      (item) => item._id.toString() !== stepId,
    );

    return request.save();
  }

  async overwriteJourneySteps(
    requestId: string,
    userId: string,
    dto: OverwriteJourneyStepsDto,
  ): Promise<UserRequest> {
    const request = await this.findByIdForUser(requestId, userId);
    request.journeySteps = dto.journeySteps as any;
    return request.save();
  }

  private assertUserCanAccess(request: UserRequest, userId: string): void {
    const isRecipient = request.recipient.toString() === userId;
    const isReceiver = request.receiver.toString() === userId;

    if (!isRecipient && !isReceiver) {
      throw new ForbiddenException(
        'You can only access requests where you are recipient or receiver',
      );
    }
  }

  private ensureRecipientOrReceiverRole(
    recipient: string,
    receiver: string,
  ): void {
    if (!recipient || !receiver) {
      throw new BadRequestException('recipient and receiver are required');
    }

    if (recipient === receiver) {
      throw new BadRequestException(
        'recipient and receiver must be different users',
      );
    }
  }
}
