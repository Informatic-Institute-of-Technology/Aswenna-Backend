import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { RequestService } from './request.service';
import { UserRequest } from './schemas/request.schema';

describe('RequestService', () => {
  let service: RequestService;
  let requestModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    deleteOne: jest.Mock;
  };

  const userId = '67d3e18216f3ec23296efaa1';
  const otherUserId = '67d3e18216f3ec23296efaa2';
  const requestId = '67d3e18216f3ec23296efaa3';

  beforeEach(async () => {
    requestModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      deleteOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestService,
        {
          provide: getModelToken(UserRequest.name),
          useValue: requestModel,
        },
      ],
    }).compile();

    service = module.get<RequestService>(RequestService);
  });

  it('findAllForUser returns paginated requests', async () => {
    const findChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([{ _id: requestId }]),
    };

    requestModel.find.mockReturnValue(findChain);
    requestModel.countDocuments.mockResolvedValue(1);

    const result = await service.findAllForUser(userId, {
      page: 1,
      limit: 10,
    } as any);

    expect(requestModel.find).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
    expect(result.pagination.totalDocs).toBe(1);
  });

  it('findAllForUser throws when filtering recipient/receiver without self', async () => {
    await expect(
      service.findAllForUser(userId, {
        page: 1,
        limit: 10,
        recipient: otherUserId,
      } as any),
    ).rejects.toThrow(
      new ForbiddenException(
        'You can only filter by recipient/receiver when one is your own user id',
      ),
    );
  });

  it('findByIdForUser returns request when accessible', async () => {
    requestModel.findById.mockResolvedValue({
      _id: requestId,
      recipient: new Types.ObjectId(userId),
      receiver: new Types.ObjectId(otherUserId),
    });

    const result = await service.findByIdForUser(requestId, userId);

    expect(result).toBeDefined();
  });

  it('findByIdForUser throws when request not found', async () => {
    requestModel.findById.mockResolvedValue(null);

    await expect(service.findByIdForUser(requestId, userId)).rejects.toThrow(
      new NotFoundException('Request not found'),
    );
  });

  it('findByIdForUser throws when requester has no access', async () => {
    requestModel.findById.mockResolvedValue({
      _id: requestId,
      recipient: new Types.ObjectId(otherUserId),
      receiver: new Types.ObjectId('67d3e18216f3ec23296efaa4'),
    });

    await expect(service.findByIdForUser(requestId, userId)).rejects.toThrow(
      new ForbiddenException(
        'You can only access requests where you are recipient or receiver',
      ),
    );
  });

  it('createRequest creates a request with ObjectId conversion', async () => {
    requestModel.create.mockResolvedValue({ _id: requestId });

    const result = await service.createRequest({
      target: '67d3e18216f3ec23296efaa5',
      recipient: userId,
      receiver: otherUserId,
      timestamp: '2026-01-01T00:00:00.000Z',
      highlighted: true,
    } as any);

    expect(requestModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.any(Types.ObjectId),
        recipient: expect.any(Types.ObjectId),
        receiver: expect.any(Types.ObjectId),
        highlighted: true,
      }),
    );
    expect(result).toEqual({ _id: requestId });
  });

  it('createRequest throws when recipient and receiver are same', async () => {
    await expect(
      service.createRequest({
        target: '67d3e18216f3ec23296efaa5',
        recipient: userId,
        receiver: userId,
      } as any),
    ).rejects.toThrow(
      new BadRequestException('recipient and receiver must be different users'),
    );
  });

  it('updateForUser updates mutable fields and saves', async () => {
    const requestDoc = {
      _id: requestId,
      recipient: new Types.ObjectId(userId),
      receiver: new Types.ObjectId(otherUserId),
      save: jest.fn().mockResolvedValue({ _id: requestId, description: 'updated' }),
    } as any;

    requestModel.findById.mockResolvedValue(requestDoc);

    const result = await service.updateForUser(requestId, userId, {
      description: 'updated',
      highlighted: false,
    } as any);

    expect(requestDoc.save).toHaveBeenCalled();
    expect(result).toEqual({ _id: requestId, description: 'updated' });
  });

  it('deleteForUser deletes request when user has access', async () => {
    requestModel.findById.mockResolvedValue({
      _id: requestId,
      recipient: new Types.ObjectId(userId),
      receiver: new Types.ObjectId(otherUserId),
    });
    requestModel.deleteOne.mockResolvedValue({});

    const result = await service.deleteForUser(requestId, userId);

    expect(requestModel.deleteOne).toHaveBeenCalledWith({ _id: requestId });
    expect(result).toEqual({ deleted: true });
  });

  it('addJourneyStep appends step and saves', async () => {
    const requestDoc = {
      journeySteps: [],
      save: jest.fn().mockResolvedValue({ _id: requestId }),
    } as any;
    jest.spyOn(service, 'findByIdForUser').mockResolvedValue(requestDoc);

    const result = await service.addJourneyStep(requestId, userId, {
      step: { title: 'Started' },
    });

    expect(requestDoc.journeySteps).toHaveLength(1);
    expect(requestDoc.save).toHaveBeenCalled();
    expect(result).toEqual({ _id: requestId });
  });

  it('updateJourneyStep updates existing step', async () => {
    const stepId = '67d3e18216f3ec23296efab0';
    const requestDoc = {
      journeySteps: [
        {
          _id: new Types.ObjectId(stepId),
          title: 'A',
          description: 'B',
          timestamp: 'T',
          status: 'S',
          icon: 'I',
        },
      ],
      save: jest.fn().mockResolvedValue({ _id: requestId }),
    } as any;

    jest.spyOn(service, 'findByIdForUser').mockResolvedValue(requestDoc);

    await service.updateJourneyStep(requestId, stepId, userId, {
      step: {
        title: 'New',
        description: 'New D',
        timestamp: 'Now',
        status: 'Done',
        icon: 'ok',
      },
    } as any);

    expect(requestDoc.journeySteps[0].title).toBe('New');
    expect(requestDoc.save).toHaveBeenCalled();
  });

  it('removeJourneyStep removes matching step', async () => {
    const stepId = '67d3e18216f3ec23296efab1';
    const requestDoc = {
      journeySteps: [
        { _id: new Types.ObjectId(stepId) },
        { _id: new Types.ObjectId('67d3e18216f3ec23296efab2') },
      ],
      save: jest.fn().mockResolvedValue({ _id: requestId }),
    } as any;
    jest.spyOn(service, 'findByIdForUser').mockResolvedValue(requestDoc);

    await service.removeJourneyStep(requestId, stepId, userId);

    expect(requestDoc.journeySteps).toHaveLength(1);
    expect(requestDoc.save).toHaveBeenCalled();
  });

  it('overwriteJourneySteps replaces all steps', async () => {
    const requestDoc = {
      journeySteps: [{ _id: 'x' }],
      save: jest.fn().mockResolvedValue({ _id: requestId, journeySteps: [{ _id: 'n1' }] }),
    } as any;
    jest.spyOn(service, 'findByIdForUser').mockResolvedValue(requestDoc);

    const result = await service.overwriteJourneySteps(requestId, userId, {
      journeySteps: [{ _id: 'n1' }],
    } as any);

    expect(requestDoc.journeySteps).toEqual([{ _id: 'n1' }]);
    expect(result).toEqual({ _id: requestId, journeySteps: [{ _id: 'n1' }] });
  });
});
