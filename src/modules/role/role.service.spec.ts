import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { RoleService } from './role.service';
import { Role } from './schemas/role.schema';

describe('RoleService', () => {
  let service: RoleService;
  let roleModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
    findById: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    deleteOne: jest.Mock;
  };

  const roleId = '67d3e18216f3ec23296ef77a';
  const roleDocument = {
    _id: roleId,
    name: 'FARMER',
    description: 'Farmer role',
  };

  beforeEach(async () => {
    roleModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getModelToken(Role.name),
          useValue: roleModel,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  describe('findAll', () => {
    it('returns paginated roles with parsed sort options', async () => {
      const page = 1;
      const limit = 10;
      const search = 'farm';
      const sort = '-createdAt,name';
      const totalDocs = 1;

      const execFind = jest.fn().mockResolvedValue([roleDocument]);
      const limitFind = jest.fn().mockReturnValue({ exec: execFind });
      const skipFind = jest.fn().mockReturnValue({ limit: limitFind });
      const sortFind = jest.fn().mockReturnValue({ skip: skipFind });

      roleModel.find.mockReturnValue({ sort: sortFind });
      roleModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(totalDocs),
      });

      const result = await service.findAll(page, limit, search, sort);

      expect(roleModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
      expect(sortFind).toHaveBeenCalledWith({ createdAt: 'desc', name: 'asc' });
      expect(skipFind).toHaveBeenCalledWith(0);
      expect(limitFind).toHaveBeenCalledWith(limit);
      expect(result.data).toEqual([roleDocument]);
      expect(result.pagination.totalDocs).toBe(totalDocs);
      expect(result.pagination.totalPages).toBe(1);
    });
  });

  describe('findById', () => {
    it('returns a role when found', async () => {
      roleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(roleDocument),
      });

      const result = await service.findById(roleId);

      expect(result).toEqual(roleDocument);
    });

    it('throws BadRequestException when role does not exist', async () => {
      roleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById(roleId)).rejects.toThrow(
        new BadRequestException(`Role with ID ${roleId} not found`),
      );
    });
  });

  describe('findByName', () => {
    it('finds role by case-insensitive name', async () => {
      roleModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(roleDocument),
      });

      const result = await service.findByName('farmer');

      expect(roleModel.findOne).toHaveBeenCalledWith({
        name: { $regex: 'farmer', $options: 'i' },
      });
      expect(result).toEqual(roleDocument);
    });
  });

  describe('create', () => {
    it('creates role when role name is not duplicated', async () => {
      const createDto = { name: 'INVESTOR', description: 'Investor role' };
      roleModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      roleModel.create.mockResolvedValue({ _id: '1', ...createDto });

      const result = await service.create(createDto);

      expect(roleModel.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({ _id: '1', ...createDto });
    });

    it('throws BadRequestException when role name already exists', async () => {
      const createDto = { name: 'FARMER', description: 'Farmer role' };
      roleModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(roleDocument),
      });

      await expect(service.create(createDto)).rejects.toThrow(
        new BadRequestException('Role with this name already exists'),
      );
      expect(roleModel.create).not.toHaveBeenCalled();
    });
  });

  describe('updateById', () => {
    it('updates and returns role when role exists', async () => {
      const updateDto = { description: 'Updated role' };
      roleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(roleDocument),
      });
      roleModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...roleDocument, ...updateDto }),
      });

      const result = await service.updateById(roleId, updateDto);

      expect(roleModel.findByIdAndUpdate).toHaveBeenCalledWith(
        roleId,
        updateDto,
        {
          new: true,
        },
      );
      expect(result).toEqual({ ...roleDocument, ...updateDto });
    });
  });

  describe('deleteById', () => {
    it('deletes role and returns success response', async () => {
      const deletedId = { _id: roleId };
      roleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deletedId),
      });
      roleModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const result = await service.deleteById(roleId);

      expect(roleModel.deleteOne).toHaveBeenCalledWith({ _id: roleId });
      expect(result).toEqual({
        message: 'Role deleted successfully',
        statusCode: 200,
      });
    });
  });
});
