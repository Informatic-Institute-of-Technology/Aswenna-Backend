import { Test, TestingModule } from '@nestjs/testing';
import { OfferController } from './offer.controller';
import { OfferService } from './offer.service';
import { OfferType } from './schemas/offer.schema';

describe('OfferController', () => {
  let controller: OfferController;
  let offerService: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const offerId = '67d3e18216f3ec23296ef790';

  beforeEach(async () => {
    offerService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OfferController],
      providers: [
        {
          provide: OfferService,
          useValue: offerService,
        },
      ],
    }).compile();

    controller = module.get<OfferController>(OfferController);
  });

  it('findAll delegates to service', async () => {
    const query = {
      page: 1,
      limit: 10,
      search: 'rice',
      sort: '-createdAt',
      type: OfferType.DIRECT_HARVEST,
    };
    const response = { data: [], pagination: { totalDocs: 0, totalPages: 0 } };
    offerService.findAll.mockResolvedValue(response);

    const result = await controller.findAll(query as any);

    expect(offerService.findAll).toHaveBeenCalledWith(
      1,
      10,
      'rice',
      '-createdAt',
      OfferType.DIRECT_HARVEST,
    );
    expect(result).toEqual(response);
  });

  it('findById delegates to service', async () => {
    const response = { _id: offerId };
    offerService.findById.mockResolvedValue(response);

    const result = await controller.findById({ offer: offerId } as any);

    expect(offerService.findById).toHaveBeenCalledWith(offerId);
    expect(result).toEqual(response);
  });

  it('create delegates to service', async () => {
    const dto = { description: 'New offer' };
    const response = { _id: offerId, ...dto };
    offerService.create.mockResolvedValue(response);

    const result = await controller.create(dto as any);

    expect(offerService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(response);
  });

  it('update delegates to service', async () => {
    const dto = { description: 'Updated offer' };
    const response = { _id: offerId, ...dto };
    offerService.update.mockResolvedValue(response);

    const result = await controller.update(
      { offer: offerId } as any,
      dto as any,
    );

    expect(offerService.update).toHaveBeenCalledWith(offerId, dto);
    expect(result).toEqual(response);
  });

  it('delete delegates to service', async () => {
    const response = { _id: offerId };
    offerService.delete.mockResolvedValue(response);

    const result = await controller.delete({ offer: offerId } as any);

    expect(offerService.delete).toHaveBeenCalledWith(offerId);
    expect(result).toEqual(response);
  });
});
