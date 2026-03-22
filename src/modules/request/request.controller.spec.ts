import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthorizationGuard } from 'src/core/guards/authorization.guard';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';

describe('RequestController', () => {
  let controller: RequestController;
  let requestService: {
    findAllForUser: jest.Mock;
    findByIdForUser: jest.Mock;
    createRequest: jest.Mock;
    updateForUser: jest.Mock;
    deleteForUser: jest.Mock;
    addJourneyStep: jest.Mock;
    updateJourneyStep: jest.Mock;
    removeJourneyStep: jest.Mock;
    overwriteJourneySteps: jest.Mock;
  };

  const user = { user: '67d3e18216f3ec23296efaa1' };
  const requestId = '67d3e18216f3ec23296efaa3';
  const stepId = '67d3e18216f3ec23296efab1';

  beforeEach(async () => {
    requestService = {
      findAllForUser: jest.fn(),
      findByIdForUser: jest.fn(),
      createRequest: jest.fn(),
      updateForUser: jest.fn(),
      deleteForUser: jest.fn(),
      addJourneyStep: jest.fn(),
      updateJourneyStep: jest.fn(),
      removeJourneyStep: jest.fn(),
      overwriteJourneySteps: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestController],
      providers: [
        { provide: RequestService, useValue: requestService },
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

    controller = module.get<RequestController>(RequestController);
  });

  it('getAllRequests delegates to service', async () => {
    const query = { page: 1, limit: 10 };
    const response = { data: [], pagination: { totalDocs: 0 } };
    requestService.findAllForUser.mockResolvedValue(response);

    const result = await controller.getAllRequests(user as any, query as any);

    expect(requestService.findAllForUser).toHaveBeenCalledWith(user.user, query);
    expect(result).toEqual(response);
  });

  it('getRequestById delegates to service', async () => {
    const response = { _id: requestId };
    requestService.findByIdForUser.mockResolvedValue(response);

    const result = await controller.getRequestById(user as any, requestId);

    expect(requestService.findByIdForUser).toHaveBeenCalledWith(requestId, user.user);
    expect(result).toEqual(response);
  });

  it('createRequest delegates to service', async () => {
    const dto = { target: 't1', recipient: 'r1', receiver: 'r2' };
    const response = { _id: requestId };
    requestService.createRequest.mockResolvedValue(response);

    const result = await controller.createRequest(dto as any);

    expect(requestService.createRequest).toHaveBeenCalledWith(dto);
    expect(result).toEqual(response);
  });

  it('updateRequest delegates to service', async () => {
    const dto = { description: 'updated' };
    const response = { _id: requestId, ...dto };
    requestService.updateForUser.mockResolvedValue(response);

    const result = await controller.updateRequest(user as any, requestId, dto as any);

    expect(requestService.updateForUser).toHaveBeenCalledWith(requestId, user.user, dto);
    expect(result).toEqual(response);
  });

  it('deleteRequest delegates to service', async () => {
    const response = { deleted: true };
    requestService.deleteForUser.mockResolvedValue(response);

    const result = await controller.deleteRequest(user as any, requestId);

    expect(requestService.deleteForUser).toHaveBeenCalledWith(requestId, user.user);
    expect(result).toEqual(response);
  });

  it('addJourneyStep delegates to service', async () => {
    const dto = { step: { title: 'Started' } };
    const response = { _id: requestId };
    requestService.addJourneyStep.mockResolvedValue(response);

    const result = await controller.addJourneyStep(user as any, requestId, dto as any);

    expect(requestService.addJourneyStep).toHaveBeenCalledWith(requestId, user.user, dto);
    expect(result).toEqual(response);
  });

  it('updateJourneyStep delegates to service', async () => {
    const dto = { step: { title: 'Done' } };
    const response = { _id: requestId };
    requestService.updateJourneyStep.mockResolvedValue(response);

    const result = await controller.updateJourneyStep(
      user as any,
      requestId,
      stepId,
      dto as any,
    );

    expect(requestService.updateJourneyStep).toHaveBeenCalledWith(
      requestId,
      stepId,
      user.user,
      dto,
    );
    expect(result).toEqual(response);
  });

  it('removeJourneyStep delegates to service', async () => {
    const response = { _id: requestId };
    requestService.removeJourneyStep.mockResolvedValue(response);

    const result = await controller.removeJourneyStep(user as any, requestId, stepId);

    expect(requestService.removeJourneyStep).toHaveBeenCalledWith(
      requestId,
      stepId,
      user.user,
    );
    expect(result).toEqual(response);
  });

  it('overwriteJourneySteps delegates to service', async () => {
    const dto = { journeySteps: [{ title: 'All' }] };
    const response = { _id: requestId };
    requestService.overwriteJourneySteps.mockResolvedValue(response);

    const result = await controller.overwriteJourneySteps(
      user as any,
      requestId,
      dto as any,
    );

    expect(requestService.overwriteJourneySteps).toHaveBeenCalledWith(
      requestId,
      user.user,
      dto,
    );
    expect(result).toEqual(response);
  });
});
