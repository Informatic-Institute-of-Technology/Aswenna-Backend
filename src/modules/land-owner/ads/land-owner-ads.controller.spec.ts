import { Test, TestingModule } from '@nestjs/testing';
import { LandOwnerAdsController } from './land-owner-ads.controller';
import { LandOwnerAdsService } from './land-owner-ads.service';
import { AuthorizationGuard } from 'src/core/guards/authorization.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

describe('LandOwnerAdsController', () => {
  let controller: LandOwnerAdsController;
  let landOwnerAdsService: {
    findAllByOwner: jest.Mock;
    findByIdForOwner: jest.Mock;
    create: jest.Mock;
    updateForOwner: jest.Mock;
    deleteForOwner: jest.Mock;
    uploadLandImages: jest.Mock;
    deleteLandImage: jest.Mock;
  };

  const adId = '67d3e18216f3ec23296ef7a1';
  const user = { user: '67d3e18216f3ec23296ef7a0' };

  beforeEach(async () => {
    landOwnerAdsService = {
      findAllByOwner: jest.fn(),
      findByIdForOwner: jest.fn(),
      create: jest.fn(),
      updateForOwner: jest.fn(),
      deleteForOwner: jest.fn(),
      uploadLandImages: jest.fn(),
      deleteLandImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LandOwnerAdsController],
      providers: [
        {
          provide: LandOwnerAdsService,
          useValue: landOwnerAdsService,
        },
        {
          provide: AuthorizationGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn().mockReturnValue(true) },
        },
      ],
    }).compile();

    controller = module.get<LandOwnerAdsController>(LandOwnerAdsController);
  });

  it('findAll delegates to service', async () => {
    const query = { page: 1, limit: 10, search: '', sort: '-createdAt' };
    const response = { data: [], pagination: { totalDocs: 0, totalPages: 0 } };
    landOwnerAdsService.findAllByOwner.mockResolvedValue(response);

    const result = await controller.findAll(user as any, query as any);

    expect(landOwnerAdsService.findAllByOwner).toHaveBeenCalledWith(user, query);
    expect(result).toEqual(response);
  });

  it('findById delegates to service', async () => {
    const response = { _id: adId };
    landOwnerAdsService.findByIdForOwner.mockResolvedValue(response);

    const result = await controller.findById(user as any, { ad: adId } as any);

    expect(landOwnerAdsService.findByIdForOwner).toHaveBeenCalledWith(adId, user);
    expect(result).toEqual(response);
  });

  it('create delegates to service', async () => {
    const dto = { title: 'Land ad' };
    const response = { _id: adId, ...dto };
    landOwnerAdsService.create.mockResolvedValue(response);

    const result = await controller.create(user as any, dto as any);

    expect(landOwnerAdsService.create).toHaveBeenCalledWith(user, dto);
    expect(result).toEqual(response);
  });

  it('update delegates to service', async () => {
    const dto = { title: 'Updated ad' };
    const response = { _id: adId, ...dto };
    landOwnerAdsService.updateForOwner.mockResolvedValue(response);

    const result = await controller.update(
      user as any,
      { ad: adId } as any,
      dto as any,
    );

    expect(landOwnerAdsService.updateForOwner).toHaveBeenCalledWith(adId, user, dto);
    expect(result).toEqual(response);
  });

  it('remove delegates to service', async () => {
    const response = { statusCode: 200, message: 'Land owner ad deleted successfully' };
    landOwnerAdsService.deleteForOwner.mockResolvedValue(response);

    const result = await controller.remove(user as any, { ad: adId } as any);

    expect(landOwnerAdsService.deleteForOwner).toHaveBeenCalledWith(adId, user);
    expect(result).toEqual(response);
  });

  it('uploadImages delegates to service', async () => {
    const files = [{ originalname: 'a.png' }];
    const response = { _id: adId, images: [{ filename: 'land-owner-ads/a.png' }] };
    landOwnerAdsService.uploadLandImages.mockResolvedValue(response);

    const result = await controller.uploadImages(
      user as any,
      { ad: adId } as any,
      files,
    );

    expect(landOwnerAdsService.uploadLandImages).toHaveBeenCalledWith(adId, user, files);
    expect(result).toEqual(response);
  });

  it('deleteImage delegates to service', async () => {
    const response = { _id: adId, images: [] };
    landOwnerAdsService.deleteLandImage.mockResolvedValue(response);

    const result = await controller.deleteImage(
      user as any,
      { ad: adId } as any,
      { filename: 'land-owner-ads/a.png' } as any,
    );

    expect(landOwnerAdsService.deleteLandImage).toHaveBeenCalledWith(
      adId,
      user,
      'land-owner-ads/a.png',
    );
    expect(result).toEqual(response);
  });
});
