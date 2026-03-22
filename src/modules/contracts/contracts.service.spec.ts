import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ContractsService } from './contracts.service';
import { Contract } from './schemas/contract.schema';
import { OfferService } from '../investor/offer/offer.service';
import { OfferType } from '../investor/offer/schemas/offer.schema';
import { LandOwnerAd } from '../land-owner/ads/schemas/land-owner-ad.schema';
import { PaymentsService } from '../payments/payments.service';
import { PaymentStatus } from '../payments/schemas/payment.schema';

describe('ContractsService', () => {
  let service: ContractsService;
  let contractModel: {
    findOne: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    create: jest.Mock;
  };
  let landOwnerAdModel: {
    findById: jest.Mock;
  };
  let offerService: {
    findById: jest.Mock;
  };
  let paymentsService: {
    createMany: jest.Mock;
  };

  const offerId = '67d3e18216f3ec23296efaa1';
  const farmerId = '67d3e18216f3ec23296efaa2';
  const investorId = '67d3e18216f3ec23296efaa3';
  const contractId = new Types.ObjectId();

  beforeEach(async () => {
    contractModel = {
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      create: jest.fn(),
    };

    landOwnerAdModel = {
      findById: jest.fn(),
    };

    offerService = {
      findById: jest.fn(),
    };

    paymentsService = {
      createMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: getModelToken(Contract.name), useValue: contractModel },
        { provide: getModelToken(LandOwnerAd.name), useValue: landOwnerAdModel },
        { provide: OfferService, useValue: offerService },
        { provide: PaymentsService, useValue: paymentsService },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  it('throws when offer id is invalid', async () => {
    await expect(
      service.create({
        type: 'investor-harvest-base',
        offer: 'invalid-offer-id',
        farmer: farmerId,
        milestones: [
          {
            title: 'Phase 1',
            description: 'Preparation',
            startDate: '2026-01-01',
            endDate: '2026-02-01',
            payment: 500,
          },
        ],
        financialBreakdown: [{ category: 'Seeds', amount: 500 }],
      } as any),
    ).rejects.toThrow(new BadRequestException('Invalid offer ID in payload'));
  });

  it('throws when offer is not found', async () => {
    offerService.findById.mockResolvedValue(null);

    await expect(
      service.create({
        type: 'investor-harvest-base',
        offer: offerId,
        farmer: farmerId,
        milestones: [
          {
            title: 'Phase 1',
            description: 'Preparation',
            startDate: '2026-01-01',
            endDate: '2026-02-01',
            payment: 500,
          },
        ],
        financialBreakdown: [{ category: 'Seeds', amount: 500 }],
      } as any),
    ).rejects.toThrow(new BadRequestException(`Offer with ID ${offerId} not found`));
  });

  it('throws when contract type and offer type are incompatible', async () => {
    offerService.findById.mockResolvedValue({
      _id: new Types.ObjectId(offerId),
      offerType: OfferType.DIRECT_HARVEST,
      investor: new Types.ObjectId(investorId),
      commissionDetails: { minimumInvestment: 1000 },
    });

    await expect(
      service.create({
        type: 'investor-sponsorship',
        offer: offerId,
      } as any),
    ).rejects.toThrow(
      new BadRequestException(
        'investor-sponsorship contracts require a sponsorship offer',
      ),
    );
  });

  it('creates a new contract and attaches generated payments', async () => {
    offerService.findById.mockResolvedValue({
      _id: new Types.ObjectId(offerId),
      offerType: OfferType.DIRECT_HARVEST,
      investor: new Types.ObjectId(investorId),
      description: 'Offer description',
      harvestBaseDetails: {
        projectTitle: 'Rice Project',
        cropType: 'Rice',
        totalBudget: 1000,
        companyName: 'Agro Inc',
        deliveryLocation: 'Colombo',
      },
      expectedROI: 15,
    });

    contractModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    const createdContract = {
      _id: contractId,
      investor: new Types.ObjectId(investorId),
      farmer: new Types.ObjectId(farmerId),
      payments: [],
      updatedBy: 'system',
    } as any;

    contractModel.create.mockResolvedValue(createdContract);

    const paymentId = new Types.ObjectId();
    paymentsService.createMany.mockResolvedValue([{ _id: paymentId }]);

    const updatedContract = {
      ...createdContract,
      payments: [paymentId],
    };

    contractModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(updatedContract),
    });

    const result = await service.create(
      {
        type: 'investor-harvest-base',
        offer: offerId,
        farmer: farmerId,
        milestones: [
          {
            title: 'Phase 1',
            description: 'Preparation',
            startDate: '2026-01-01',
            endDate: '2026-02-01',
            payment: 500,
          },
        ],
        financialBreakdown: [{ category: 'Seeds', amount: 500 }],
      } as any,
      investorId,
    );

    expect(contractModel.create).toHaveBeenCalled();
    expect(paymentsService.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          contract: contractId,
          amount: 500,
          status: PaymentStatus.PENDING,
        }),
      ]),
    );
    expect(contractModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(result).toEqual(updatedContract);
  });

  it('updates existing contract and does not create a new one', async () => {
    offerService.findById.mockResolvedValue({
      _id: new Types.ObjectId(offerId),
      offerType: OfferType.DIRECT_HARVEST,
      investor: new Types.ObjectId(investorId),
      harvestBaseDetails: { totalBudget: 1000 },
    });

    const existingContract = {
      _id: contractId,
      investor: new Types.ObjectId(investorId),
      farmer: new Types.ObjectId(farmerId),
      landowner: undefined,
      investorConfirmed: false,
      farmerConfirmed: false,
      landownerConfirmed: false,
      updatedBy: 'system',
      payments: [new Types.ObjectId()],
    };

    contractModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingContract),
    });

    const updatedContract = {
      ...existingContract,
      investorConfirmed: true,
      isFullyConfirmed: false,
    };

    contractModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(updatedContract),
    });

    const result = await service.create(
      {
        type: 'investor-harvest-base',
        offer: offerId,
        farmer: farmerId,
        milestones: [
          {
            title: 'Phase 1',
            description: 'Preparation',
            startDate: '2026-01-01',
            endDate: '2026-02-01',
            payment: 500,
          },
        ],
        financialBreakdown: [{ category: 'Seeds', amount: 500 }],
      } as any,
      investorId,
    );

    expect(contractModel.create).not.toHaveBeenCalled();
    expect(paymentsService.createMany).not.toHaveBeenCalled();
    expect(result).toEqual(updatedContract);
  });

  it('throws when land-owner-ad contract is missing landAd', async () => {
    offerService.findById.mockResolvedValue({
      _id: new Types.ObjectId(offerId),
      offerType: OfferType.DIRECT_HARVEST,
      investor: new Types.ObjectId(investorId),
    });

    await expect(
      service.create({
        type: 'land-owner-ad',
        offer: offerId,
      } as any),
    ).rejects.toThrow(
      new BadRequestException(
        'Valid landAd is required for land-owner-ad contracts',
      ),
    );
  });
});
