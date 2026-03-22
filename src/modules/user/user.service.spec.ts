import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { RoleService } from '../role/role.service';
import { FarmerService } from '../farmer/farmer.service';
import { InvestorService } from '../investor/investor.service';
import { LandOwnerService } from '../land-owner/land-owner.service';
import { AzureBlobStorageService } from '../../config/azure/services/azure-blob-storage.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let userModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
    findById: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    deleteOne: jest.Mock;
  };

  let roleService: {
    findByName: jest.Mock;
    findById: jest.Mock;
  };
  let farmerService: {
    create: jest.Mock;
    findByUserId: jest.Mock;
    updateById: jest.Mock;
  };
  let investorService: {
    create: jest.Mock;
    findByUserId: jest.Mock;
  };
  let landOwnerService: {
    create: jest.Mock;
    findByUserId: jest.Mock;
    updateById: jest.Mock;
  };
  let azureBlobStorageService: {
    getFileUrl: jest.Mock;
    deleteFile: jest.Mock;
    createBlobFileName: jest.Mock;
    generateUploadUrl: jest.Mock;
    uploadFile: jest.Mock;
    getFileDetails: jest.Mock;
  };

  const userId = '67d3e18216f3ec23296ef77a';
  const baseUser = {
    _id: { toString: () => userId },
    fullName: 'John Doe',
    email: 'john@example.com',
    role: { _id: '67d3e18216f3ec23296ef77b', name: 'admin' },
    personalInfo: {},
    toObject: function () {
      return {
        _id: this._id.toString(),
        fullName: this.fullName,
        email: this.email,
        role: this.role,
        personalInfo: this.personalInfo,
      };
    },
  };

  beforeEach(async () => {
    userModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
    };

    roleService = {
      findByName: jest.fn(),
      findById: jest.fn(),
    };

    farmerService = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      updateById: jest.fn(),
    };

    investorService = {
      create: jest.fn(),
      findByUserId: jest.fn(),
    };

    landOwnerService = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      updateById: jest.fn(),
    };

    azureBlobStorageService = {
      getFileUrl: jest.fn(),
      deleteFile: jest.fn(),
      createBlobFileName: jest.fn(),
      generateUploadUrl: jest.fn(),
      uploadFile: jest.fn(),
      getFileDetails: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: RoleService,
          useValue: roleService,
        },
        {
          provide: FarmerService,
          useValue: farmerService,
        },
        {
          provide: InvestorService,
          useValue: investorService,
        },
        {
          provide: LandOwnerService,
          useValue: landOwnerService,
        },
        {
          provide: AzureBlobStorageService,
          useValue: azureBlobStorageService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated users', async () => {
      const execFind = jest.fn().mockResolvedValue([baseUser]);
      const selectFind = jest.fn().mockReturnValue({ exec: execFind });
      const limitFind = jest.fn().mockReturnValue({ select: selectFind });
      const skipFind = jest.fn().mockReturnValue({ limit: limitFind });
      const sortFind = jest.fn().mockReturnValue({ skip: skipFind });

      userModel.find.mockReturnValue({ sort: sortFind });
      userModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll(1, 10, 'john', '-createdAt');

      expect(userModel.find).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.pagination.totalDocs).toBe(1);
    });
  });

  describe('findById', () => {
    it('returns enriched user when user exists', async () => {
      userModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(baseUser),
          }),
        }),
      });

      const result = await service.findById(userId);

      expect(result).toMatchObject({
        _id: userId,
        email: baseUser.email,
      });
    });

    it('throws when user does not exist', async () => {
      userModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(service.findById(userId)).rejects.toThrow(
        new BadRequestException(`User with ID ${userId} not found`),
      );
    });
  });

  describe('findByEmail', () => {
    it('returns user by email', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(baseUser),
      });

      const result = await service.findByEmail(baseUser.email);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: baseUser.email });
      expect(result).toEqual(baseUser);
    });
  });

  describe('create', () => {
    const createDto = {
      fullName: 'John Doe',
      email: 'john@example.com',
      emailVerified: false,
      phoneNumber: '0711111111',
      phoneNumberVerified: false,
      password: 'password123',
      personalInfo: {
        nicNumber: '123',
        gender: 'Male',
        birthday: '2000-01-01',
        age: 24,
        address: 'addr',
        postalCode: '10000',
        city: 'Colombo',
        province: 'Western',
        district: 'Colombo',
      },
      role: 'farmer',
      farmerDetails: {
        dsDivision: 'ds',
        gnDivision: 'gn',
        govijanaSevaId: 'id',
        crop: 'rice',
        experience: '5 years',
        regions: 'north',
        specificNeeds: 'none',
      },
    };

    it('creates user and related farmer details', async () => {
      userModel.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      roleService.findByName.mockResolvedValue({
        _id: '67d3e18216f3ec23296ef77c',
        name: 'farmer',
      });
      userModel.create.mockResolvedValue({
        _id: { toString: () => userId },
        ...createDto,
      });
      farmerService.create.mockResolvedValue({});

      const result = await service.create(createDto as any);

      expect(roleService.findByName).toHaveBeenCalledWith('farmer');
      expect(userModel.create).toHaveBeenCalled();
      expect(farmerService.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws when email already exists', async () => {
      userModel.findOne.mockResolvedValue(baseUser);

      await expect(service.create(createDto as any)).rejects.toThrow(
        new BadRequestException('User with this email already exists'),
      );
    });
  });

  describe('assignRole', () => {
    it('assigns role when user has no role', async () => {
      const userWithoutRole = { ...baseUser, role: null };

      userModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(userWithoutRole),
          }),
        }),
      });
      roleService.findById.mockResolvedValue({
        _id: '67d3e18216f3ec23296ef77d',
      });
      userModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...baseUser,
          role: { _id: '67d3e18216f3ec23296ef77d' },
        }),
      });

      const result = await service.assignRole(
        userId,
        '67d3e18216f3ec23296ef77d',
      );

      expect(roleService.findById).toHaveBeenCalledWith(
        '67d3e18216f3ec23296ef77d',
      );
      expect(result).toBeDefined();
    });
  });

  describe('updateById', () => {
    it('updates user and returns updated document', async () => {
      const updateDto = { fullName: 'Updated Name' };

      userModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(baseUser),
          }),
        }),
      });

      userModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...baseUser, ...updateDto }),
      });

      const result = await service.updateById(userId, updateDto as any);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        updateDto,
        {
          new: true,
        },
      );
      expect(result).toEqual({ ...baseUser, ...updateDto });
    });
  });

  describe('deleteById', () => {
    it('deletes user and returns success response', async () => {
      userModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(baseUser),
          }),
        }),
      });

      userModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const result = await service.deleteById(userId);

      expect(userModel.deleteOne).toHaveBeenCalledWith({ _id: userId });
      expect(result).toEqual({
        message: 'User deleted successfully',
        statusCode: 200,
      });
    });
  });
});
