import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LandOwnerAdsService } from './land-owner-ads.service';
import { LandOwnerAd, LandOwnerAdStatus } from './schemas/land-owner-ad.schema';
import { UserService } from 'src/modules/user/user.service';
import { AzureBlobStorageService } from 'src/config/azure/services/azure-blob-storage.service';

describe('LandOwnerAdsService', () => {
  let service: LandOwnerAdsService;
  let landOwnerAdModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
    findById: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    updateMany: jest.Mock;
  };
  let userService: {
    findById: jest.Mock;
  };
  let azureBlobStorageService: {
    uploadFile: jest.Mock;
    deleteFile: jest.Mock;
    getFileUrl: jest.Mock;
  };

  const userId = '67d3e18216f3ec23296ef7a0';
  const adId = '67d3e18216f3ec23296ef7a1';

  const landOwnerUser = {
    _id: userId,
    role: { name: 'landowner' },
    personalInfo: { profilePicture: { filename: 'profile.jpg' } },
    landOwner: {
      location: { latitude: 7.0, longitude: 80.0 },
      landAddress: {
        size: '2.5',
        landImages: [
          { filename: 'user-land.png', fileSize: '123', mimeType: 'image/png' },
        ],
      },
    },
  };

  const makeFindChain = (resolvedData: unknown) => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(resolvedData),
  });

  beforeEach(async () => {
    landOwnerAdModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      updateMany: jest.fn(),
    };

    userService = {
      findById: jest.fn(),
    };

    azureBlobStorageService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      getFileUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LandOwnerAdsService,
        {
          provide: getModelToken(LandOwnerAd.name),
          useValue: landOwnerAdModel,
        },
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: AzureBlobStorageService,
          useValue: azureBlobStorageService,
        },
      ],
    }).compile();

    service = module.get<LandOwnerAdsService>(LandOwnerAdsService);
  });

  describe('findAllByOwner', () => {
    it('returns paginated ads for land owner and enriches image URLs', async () => {
      userService.findById
        .mockResolvedValueOnce(landOwnerUser)
        .mockResolvedValueOnce(landOwnerUser);

      landOwnerAdModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const ad = {
        _id: adId,
        landowner: { _id: userId, fullName: 'Owner', email: 'owner@mail.com' },
        images: [{ filename: 'land-owner-ads/a.png' }],
      };

      landOwnerAdModel.find.mockReturnValue(makeFindChain([ad]));
      landOwnerAdModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });
      azureBlobStorageService.getFileUrl.mockResolvedValue('https://cdn/a.png');

      const result = await service.findAllByOwner({ user: userId }, {
        page: 1,
        limit: 10,
        sort: '-createdAt',
        search: '',
      } as any);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.totalDocs).toBe(1);
      expect(azureBlobStorageService.getFileUrl).toHaveBeenCalledWith(
        'land-owner-ads/a.png',
      );
    });
  });

  describe('create', () => {
    const createDto = {
      title: 'Land Ad',
      rentalAmount: 50000,
      availableFrom: '2026-12-01T00:00:00.000Z',
      availableTo: '2026-12-31T00:00:00.000Z',
      soilType: 'Loamy',
      landHistory: 'Good',
      additionalInfo: 'Near road',
      waterAvailability: 'High',
      images: [],
    };

    it('creates ad for valid land owner', async () => {
      userService.findById
        .mockResolvedValueOnce(landOwnerUser)
        .mockResolvedValueOnce(landOwnerUser);

      landOwnerAdModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });
      landOwnerAdModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      landOwnerAdModel.create.mockResolvedValue({
        _id: adId,
        images: [{ filename: 'user-land.png' }],
      });
      azureBlobStorageService.getFileUrl.mockResolvedValue(
        'https://cdn/user-land.png',
      );

      const result = await service.create({ user: userId }, createDto as any);

      expect(landOwnerAdModel.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws when requester is not a land owner', async () => {
      userService.findById.mockResolvedValue({
        _id: userId,
        role: { name: 'farmer' },
      });

      await expect(
        service.create({ user: userId }, createDto as any),
      ).rejects.toThrow(
        new ForbiddenException(
          'Only land owner users can manage land owner ads',
        ),
      );
    });

    it('throws when active ad already exists', async () => {
      userService.findById
        .mockResolvedValueOnce(landOwnerUser)
        .mockResolvedValueOnce(landOwnerUser);
      landOwnerAdModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });
      landOwnerAdModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'existing' }),
      });

      await expect(
        service.create({ user: userId }, createDto as any),
      ).rejects.toThrow(
        new BadRequestException('Only one active land ad is allowed per user'),
      );
    });
  });

  describe('updateForOwner', () => {
    it('throws when selected ad is expired', async () => {
      userService.findById.mockResolvedValue(landOwnerUser);
      jest.spyOn(service, 'findByIdForOwner').mockResolvedValue({
        _id: adId,
        status: LandOwnerAdStatus.EXPIRED,
        availableTo: new Date('2025-01-01'),
      } as any);

      await expect(
        service.updateForOwner(adId, { user: userId }, { title: 'X' } as any),
      ).rejects.toThrow(
        new BadRequestException('Expired land ad cannot be updated'),
      );
    });
  });

  describe('deleteForOwner', () => {
    it('deletes images from azure then removes ad', async () => {
      userService.findById.mockResolvedValue(landOwnerUser);
      jest.spyOn(service, 'findByIdForOwner').mockResolvedValue({
        _id: adId,
        images: [
          { filename: 'land-owner-ads/a.png' },
          { filename: 'other-folder/b.png' },
        ],
      } as any);

      landOwnerAdModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const result = await service.deleteForOwner(adId, { user: userId });

      expect(azureBlobStorageService.deleteFile).toHaveBeenCalledWith(
        'land-owner-ads/a.png',
      );
      expect(landOwnerAdModel.findByIdAndDelete).toHaveBeenCalledWith(adId);
      expect(result).toEqual({
        statusCode: 200,
        message: 'Land owner ad deleted successfully',
      });
    });
  });

  describe('uploadLandImages', () => {
    it('throws when no files provided', async () => {
      userService.findById.mockResolvedValue(landOwnerUser);

      await expect(
        service.uploadLandImages(adId, { user: userId }, []),
      ).rejects.toThrow(new BadRequestException('No image files provided'));
    });

    it('uploads files and updates ad images', async () => {
      userService.findById.mockResolvedValue(landOwnerUser);
      jest.spyOn(service, 'findByIdForOwner').mockResolvedValue({
        _id: adId,
        images: [{ filename: 'old.png', fileSize: '1', mimeType: 'image/png' }],
      } as any);

      azureBlobStorageService.uploadFile.mockResolvedValue({
        fileName: 'land-owner-ads/a1.png',
        size: 100,
        contentType: 'image/png',
        url: 'https://cdn/a1.png',
      });
      landOwnerAdModel.findByIdAndUpdate.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({
            _id: adId,
            images: [{ filename: 'land-owner-ads/a1.png' }],
          }),
      });
      azureBlobStorageService.getFileUrl.mockResolvedValue(
        'https://cdn/a1.png',
      );

      const result = await service.uploadLandImages(adId, { user: userId }, [
        { originalname: 'a.png' },
      ]);

      expect(azureBlobStorageService.uploadFile).toHaveBeenCalled();
      expect(landOwnerAdModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('deleteLandImage', () => {
    it('throws when filename is missing', async () => {
      userService.findById.mockResolvedValue(landOwnerUser);

      await expect(
        service.deleteLandImage(adId, { user: userId }, ''),
      ).rejects.toThrow(
        new BadRequestException('Image not found in this land ad'),
      );
    });

    it('deletes matching image and updates ad', async () => {
      userService.findById.mockResolvedValue(landOwnerUser);
      jest.spyOn(service, 'findByIdForOwner').mockResolvedValue({
        _id: adId,
        images: [
          {
            filename: 'land-owner-ads/x.png',
            fileSize: '1',
            mimeType: 'image/png',
          },
          {
            filename: 'land-owner-ads/y.png',
            fileSize: '1',
            mimeType: 'image/png',
          },
        ],
      } as any);

      landOwnerAdModel.findByIdAndUpdate.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({
            _id: adId,
            images: [{ filename: 'land-owner-ads/y.png' }],
          }),
      });
      azureBlobStorageService.getFileUrl.mockResolvedValue('https://cdn/y.png');

      const result = await service.deleteLandImage(
        adId,
        { user: userId },
        'land-owner-ads/x.png',
      );

      expect(azureBlobStorageService.deleteFile).toHaveBeenCalledWith(
        'land-owner-ads/x.png',
      );
      expect(landOwnerAdModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
