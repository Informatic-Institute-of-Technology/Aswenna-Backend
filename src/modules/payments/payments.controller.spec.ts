import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthorizationGuard } from 'src/core/guards/authorization.guard';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: {
    findAll: jest.Mock;
    createCheckoutSession: jest.Mock;
    handlePayHereNotify: jest.Mock;
    findById: jest.Mock;
    refundById: jest.Mock;
    deleteById: jest.Mock;
  };

  const paymentId = '67d3e18216f3ec23296efaa1';
  const userId = '67d3e18216f3ec23296efaa3';
  const contractId = '67d3e18216f3ec23296efaa2';

  beforeEach(async () => {
    paymentsService = {
      findAll: jest.fn(),
      createCheckoutSession: jest.fn(),
      handlePayHereNotify: jest.fn(),
      findById: jest.fn(),
      refundById: jest.fn(),
      deleteById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: paymentsService },
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

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('findAll delegates to service', async () => {
    const query = { page: 1, limit: 10 };
    const response = { data: [], pagination: { totalDocs: 0 } };
    paymentsService.findAll.mockResolvedValue(response);

    const result = await controller.findAll(query as any);

    expect(paymentsService.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual(response);
  });

  it('findAllByUser delegates with user filter override', async () => {
    const query = { page: 1, limit: 10 };
    const response = {
      data: [{ _id: paymentId }],
      pagination: { totalDocs: 1 },
    };
    paymentsService.findAll.mockResolvedValue(response);

    const result = await controller.findAllByUser(userId, query as any);

    expect(paymentsService.findAll).toHaveBeenCalledWith(query, {
      user: userId,
    });
    expect(result).toEqual(response);
  });

  it('findAllByContract delegates with contract filter override', async () => {
    const query = { page: 1, limit: 10 };
    const response = {
      data: [{ _id: paymentId }],
      pagination: { totalDocs: 1 },
    };
    paymentsService.findAll.mockResolvedValue(response);

    const result = await controller.findAllByContract(contractId, query as any);

    expect(paymentsService.findAll).toHaveBeenCalledWith(query, {
      contract: contractId,
    });
    expect(result).toEqual(response);
  });

  it('checkout delegates to service with user id', async () => {
    const dto = {
      paymentId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
    };
    const response = { paymentId, payload: {}, checkoutUrl: 'url' };
    paymentsService.createCheckoutSession.mockResolvedValue(response);

    const result = await controller.checkout(dto as any, userId);

    expect(paymentsService.createCheckoutSession).toHaveBeenCalledWith(
      dto,
      userId,
    );
    expect(result).toEqual(response);
  });

  it('notify delegates to service', async () => {
    const notifyDto = { order_id: 'ORD-1' };
    const response = { received: true, paymentId, status: 'paid' };
    paymentsService.handlePayHereNotify.mockResolvedValue(response);

    const result = await controller.notify(notifyDto as any);

    expect(paymentsService.handlePayHereNotify).toHaveBeenCalledWith(notifyDto);
    expect(result).toEqual(response);
  });

  it('findById delegates to service', async () => {
    const response = { _id: paymentId };
    paymentsService.findById.mockResolvedValue(response);

    const result = await controller.findById(paymentId);

    expect(paymentsService.findById).toHaveBeenCalledWith(paymentId);
    expect(result).toEqual(response);
  });

  it('refund delegates to service', async () => {
    const dto = { amount: 200, reason: 'Customer request' };
    const response = { _id: paymentId, status: 'refunded' };
    paymentsService.refundById.mockResolvedValue(response);

    const result = await controller.refund(paymentId, dto as any, userId);

    expect(paymentsService.refundById).toHaveBeenCalledWith(
      paymentId,
      dto,
      userId,
    );
    expect(result).toEqual(response);
  });

  it('deleteById delegates to service', async () => {
    const response = { deleted: true };
    paymentsService.deleteById.mockResolvedValue(response);

    const result = await controller.deleteById(paymentId);

    expect(paymentsService.deleteById).toHaveBeenCalledWith(paymentId);
    expect(result).toEqual(response);
  });
});
