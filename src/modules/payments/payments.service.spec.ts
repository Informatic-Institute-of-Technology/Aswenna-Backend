import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { createHash } from 'crypto';
import { PaymentsService } from './payments.service';
import { ContractPayment, PaymentStatus } from './schemas/payment.schema';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentModel: {
    insertMany: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
    findById: jest.Mock;
    findByIdAndDelete: jest.Mock;
    create: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findOne: jest.Mock;
  };
  let configService: { get: jest.Mock };

  const paymentId = '67d3e18216f3ec23296efaa1';
  const contractId = '67d3e18216f3ec23296efaa2';
  const userId = '67d3e18216f3ec23296efaa3';

  beforeEach(async () => {
    paymentModel = {
      insertMany: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findOne: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getModelToken(ContractPayment.name),
          useValue: paymentModel,
        },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  const md5 = (value: string) => createHash('md5').update(value).digest('hex');

  it('createMany returns empty array when input is empty', async () => {
    const result = await service.createMany([]);

    expect(result).toEqual([]);
    expect(paymentModel.insertMany).not.toHaveBeenCalled();
  });

  it('createMany inserts all payments', async () => {
    const payload = [{ amount: 100 }, { amount: 200 }] as any;
    paymentModel.insertMany.mockResolvedValue(payload);

    const result = await service.createMany(payload);

    expect(paymentModel.insertMany).toHaveBeenCalledWith(payload);
    expect(result).toEqual(payload);
  });

  it('findAll returns paginated data with filters', async () => {
    const docs = [{ _id: paymentId }];
    const findChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(docs),
    };

    paymentModel.find.mockReturnValue(findChain);
    paymentModel.countDocuments.mockResolvedValue(1);

    const result = await service.findAll({
      page: 1,
      limit: 10,
      user: userId,
      contract: contractId,
      status: PaymentStatus.PENDING,
      search: 'inv-001',
      sort: '-createdAt',
    } as any);

    expect(paymentModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.any(Types.ObjectId),
        contract: expect.any(Types.ObjectId),
        status: PaymentStatus.PENDING,
        $or: expect.any(Array),
      }),
    );
    expect(result.data).toEqual(docs);
    expect(result.pagination.totalDocs).toBe(1);
  });

  it('findById returns payment when found', async () => {
    const paymentDoc = { _id: paymentId };
    const findByIdChain = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(paymentDoc),
    };
    paymentModel.findById.mockReturnValue(findByIdChain);

    const result = await service.findById(paymentId);

    expect(result).toEqual(paymentDoc);
  });

  it('findById throws when payment not found', async () => {
    const findByIdChain = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    };
    paymentModel.findById.mockReturnValue(findByIdChain);

    await expect(service.findById(paymentId)).rejects.toThrow(
      new NotFoundException('Payment not found'),
    );
  });

  it('deleteById deletes and returns confirmation', async () => {
    paymentModel.findByIdAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: paymentId }),
    });

    const result = await service.deleteById(paymentId);

    expect(result).toEqual({ deleted: true });
  });

  it('deleteById throws when payment does not exist', async () => {
    paymentModel.findByIdAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.deleteById(paymentId)).rejects.toThrow(
      new NotFoundException('Payment not found'),
    );
  });

  it('createCheckoutSession throws when merchant config is missing', async () => {
    configService.get.mockReturnValue('');

    await expect(
      service.createCheckoutSession({
        paymentId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
      } as any),
    ).rejects.toThrow(
      new BadRequestException('PayHere merchant configuration is missing'),
    );
  });

  it('createCheckoutSession throws when creating without contract/amount', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'payhere.merchantId') return 'MERCHANT';
      if (key === 'payhere.merchantSecret') return 'SECRET';
      if (key === 'payhere.currency') return 'LKR';
      return '';
    });

    await expect(
      service.createCheckoutSession({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
      } as any),
    ).rejects.toThrow(
      new BadRequestException(
        'paymentId or both contract and amount are required',
      ),
    );
  });

  it('createCheckoutSession returns payload for existing payment', async () => {
    const paymentDoc = {
      _id: new Types.ObjectId(paymentId),
      amount: 1000,
      description: 'Installment',
      contract: new Types.ObjectId(contractId),
      updatedBy: 'system',
      orderId: 'ORDER-123',
    } as any;

    configService.get.mockImplementation((key: string) => {
      if (key === 'payhere.merchantId') return 'MERCHANT';
      if (key === 'payhere.merchantSecret') return 'SECRET';
      if (key === 'payhere.currency') return 'LKR';
      if (key === 'payhere.checkoutUrl')
        return 'https://sandbox.payhere.lk/pay/checkout';
      return '';
    });

    paymentModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(paymentDoc),
    });
    paymentModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: paymentId }),
    });

    const result = await service.createCheckoutSession(
      {
        paymentId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
      } as any,
      userId,
    );

    expect(paymentModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(result.paymentId).toBe(paymentId);
    expect(result.checkoutUrl).toContain('payhere');
    expect(result.payload.order_id).toBe('ORDER-123');
  });

  it('handlePayHereNotify throws when secret is missing', async () => {
    configService.get.mockReturnValue('');

    await expect(
      service.handlePayHereNotify({ order_id: 'ORD-1' } as any),
    ).rejects.toThrow(
      new BadRequestException('PayHere merchant secret is missing'),
    );
  });

  it('handlePayHereNotify throws when payment cannot be found', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'payhere.merchantSecret') return 'SECRET';
      return '';
    });

    paymentModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.handlePayHereNotify({
        merchant_id: 'MERCHANT',
        order_id: 'ORD-1',
        payhere_amount: '1000.00',
        payhere_currency: 'LKR',
        status_code: '2',
        md5sig: 'INVALID',
      } as any),
    ).rejects.toThrow(
      new NotFoundException('Payment not found for PayHere notification'),
    );
  });

  it('handlePayHereNotify updates payment when signature is valid', async () => {
    const notifyBase = {
      merchant_id: 'MERCHANT',
      order_id: 'ORD-1',
      payhere_amount: '1000.00',
      payhere_currency: 'LKR',
      status_code: '2',
      payment_id: 'PAYHERE-1',
      method: 'VISA',
      status_message: 'Authorized',
    };

    const merchantSecret = 'SECRET';
    const merchantSecretHash = md5(merchantSecret).toUpperCase();
    const md5sig = md5(
      `${notifyBase.merchant_id}${notifyBase.order_id}${notifyBase.payhere_amount}${notifyBase.payhere_currency}${notifyBase.status_code}${merchantSecretHash}`,
    ).toUpperCase();

    configService.get.mockImplementation((key: string) => {
      if (key === 'payhere.merchantSecret') return merchantSecret;
      return '';
    });

    paymentModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(paymentId) }),
    });

    paymentModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(paymentId),
        status: PaymentStatus.PAID,
      }),
    });

    const result = await service.handlePayHereNotify({
      ...notifyBase,
      md5sig,
    } as any);

    expect(paymentModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(result).toEqual({
      received: true,
      paymentId,
      status: PaymentStatus.PAID,
    });
  });

  it('refundById throws when payment is not paid', async () => {
    paymentModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(paymentId),
        status: PaymentStatus.PENDING,
        amount: 1000,
      }),
    });

    await expect(
      service.refundById(paymentId, { amount: 100 } as any, userId),
    ).rejects.toThrow(
      new BadRequestException('Only paid payments can be refunded'),
    );
  });

  it('refundById throws when refund amount exceeds paid amount', async () => {
    paymentModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(paymentId),
        status: PaymentStatus.PAID,
        amount: 1000,
      }),
    });

    await expect(
      service.refundById(paymentId, { amount: 1200 } as any, userId),
    ).rejects.toThrow(
      new BadRequestException(
        'Refund amount cannot exceed original payment amount',
      ),
    );
  });

  it('refundById updates payment to refunded', async () => {
    paymentModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(paymentId),
        status: PaymentStatus.PAID,
        amount: 1000,
      }),
    });

    paymentModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(paymentId),
        status: PaymentStatus.REFUNDED,
      }),
    });

    const result = await service.refundById(
      paymentId,
      { amount: 500, reason: 'Customer request' } as any,
      userId,
    );

    expect(paymentModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(result.status).toBe(PaymentStatus.REFUNDED);
  });
});
