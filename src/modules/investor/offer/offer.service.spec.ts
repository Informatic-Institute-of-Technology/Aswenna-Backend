import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OfferService } from './offer.service';
import { Offer, OfferStatus, OfferType } from './schemas/offer.schema';

describe('OfferService', () => {
  let service: OfferService;
  let offerModel: {
    updateMany: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
  };

  const offerId = '67d3e18216f3ec23296ef790';
  const investorId = '67d3e18216f3ec23296ef791';

  const createDto = {
    offerType: OfferType.DIRECT_HARVEST,
    investor: investorId,
    description: 'Harvest offer',
    cropIcon: 'crop.png',
    backgroundImage: 'bg.png',
    expectedROI: 15,
    currency: 'LKR',
    expiredDate: '2026-12-31T00:00:00.000Z',
    projectTitle: 'Rice 2026',
    cropType: 'Rice',
    cropVariety: 'Nadu',
    requiredQuantity: 1000,
    quantityUnit: 'kg',
    pricePerUnit: 120,
    deliveryLocation: 'Kurunegala',
    totalBudget: 500000,
    companyName: 'Agri Co',
    preferredRegion: ['North'],
  };

  const baseOffer = {
    _id: offerId,
    offerType: OfferType.DIRECT_HARVEST,
    description: 'Harvest offer',
    status: OfferStatus.ACTIVE,
  };

  beforeEach(async () => {
    offerModel = {
      updateMany: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfferService,
        {
          provide: getModelToken(Offer.name),
          useValue: offerModel,
        },
      ],
    }).compile();

    service = module.get<OfferService>(OfferService);
  });

  describe('expireOffers', () => {
    it('returns modified count from updateMany', async () => {
      offerModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 3 }),
      });

      const result = await service.expireOffers();

      expect(result).toBe(3);
      expect(offerModel.updateMany).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated offers', async () => {
      offerModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      });

      const findChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([baseOffer]),
      };

      offerModel.find.mockReturnValue(findChain);
      offerModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(
        1,
        10,
        'rice',
        '-createdAt',
        OfferType.DIRECT_HARVEST,
      );

      expect(offerModel.find).toHaveBeenCalled();
      expect(result.data).toEqual([baseOffer]);
      expect(result.pagination.totalDocs).toBe(1);
    });
  });

  describe('findById', () => {
    it('returns offer by id', async () => {
      offerModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      });
      offerModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(baseOffer),
        }),
      });

      const result = await service.findById(offerId);

      expect(offerModel.findById).toHaveBeenCalledWith(offerId);
      expect(result).toEqual(baseOffer);
    });
  });

  describe('create', () => {
    it('creates offer with mapped schema payload', async () => {
      offerModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      });
      offerModel.create.mockResolvedValue(baseOffer);

      const result = await service.create(createDto as any);

      expect(offerModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          offerType: OfferType.DIRECT_HARVEST,
          description: createDto.description,
          harvestBaseDetails: expect.any(Object),
        }),
      );
      expect(result).toEqual(baseOffer);
    });
  });

  describe('update', () => {
    it('updates existing offer', async () => {
      offerModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      });
      offerModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(baseOffer),
      });
      offerModel.findByIdAndUpdate.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...baseOffer, description: 'Updated' }),
      });

      const result = await service.update(offerId, { description: 'Updated' });

      expect(offerModel.findByIdAndUpdate).toHaveBeenCalledWith(
        offerId,
        expect.any(Object),
        { new: true },
      );
      expect(result?.description).toBe('Updated');
    });

    it('throws when offer does not exist', async () => {
      offerModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      });
      offerModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update(offerId, { description: 'X' }),
      ).rejects.toThrow(
        new BadRequestException(`Offer with ID ${offerId} not found`),
      );
    });
  });

  describe('delete', () => {
    it('deletes offer by id', async () => {
      offerModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(baseOffer),
      });

      const result = await service.delete(offerId);

      expect(offerModel.findByIdAndDelete).toHaveBeenCalledWith(offerId);
      expect(result).toEqual(baseOffer);
    });
  });
});
