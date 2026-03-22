import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { Permission } from './schemas/permission.schema';
import { PermissionType } from 'src/common/enums/permission.type.enum';

describe('PermissionService', () => {
  let service: PermissionService;
  let permissionModel: {
    find: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
  };

  const createDto = {
    scope: 'create:permission',
    description: 'Create permission',
    type: PermissionType.API,
  };

  const updateDto = {
    description: 'Updated permission description',
  };

  const permissionId = '67d3e18216f3ec23296ef77a';
  const permissionDocument = {
    _id: permissionId,
    ...createDto,
  };

  beforeEach(async () => {
    permissionModel = {
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: getModelToken(Permission.name),
          useValue: permissionModel,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  describe('findAll', () => {
    it('returns all permissions with lean documents', async () => {
      const permissions = [permissionDocument];
      const lean = jest.fn().mockResolvedValue(permissions);

      permissionModel.find.mockReturnValue({ lean });

      const result = await service.findAll();

      expect(permissionModel.find).toHaveBeenCalledTimes(1);
      expect(lean).toHaveBeenCalledTimes(1);
      expect(result).toEqual(permissions);
    });
  });

  describe('findById', () => {
    it('returns permission when found', async () => {
      permissionModel.findById.mockResolvedValue(permissionDocument);

      const result = await service.findById(permissionId);

      expect(permissionModel.findById).toHaveBeenCalledWith(permissionId);
      expect(result).toEqual(permissionDocument);
    });

    it('throws NotFoundException when permission does not exist', async () => {
      permissionModel.findById.mockResolvedValue(null);

      await expect(service.findById(permissionId)).rejects.toThrow(
        new NotFoundException('Permission not found'),
      );
      expect(permissionModel.findById).toHaveBeenCalledWith(permissionId);
    });
  });

  describe('create', () => {
    it('creates a permission and returns created document', async () => {
      permissionModel.create.mockResolvedValue(permissionDocument);

      const result = await service.create(createDto);

      expect(permissionModel.create).toHaveBeenCalledWith(createDto);
      expect(permissionModel.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(permissionDocument);
    });
  });

  describe('updateById', () => {
    it('updates and returns permission when found', async () => {
      const updatedPermission = {
        ...permissionDocument,
        ...updateDto,
      };

      permissionModel.findByIdAndUpdate.mockResolvedValue(updatedPermission);

      const result = await service.updateById(permissionId, updateDto);

      expect(permissionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        permissionId,
        updateDto,
        { new: true },
      );
      expect(result).toEqual(updatedPermission);
    });

    it('throws NotFoundException when update target does not exist', async () => {
      permissionModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.updateById(permissionId, updateDto)).rejects.toThrow(
        new NotFoundException('Permission not found'),
      );
      expect(permissionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        permissionId,
        updateDto,
        { new: true },
      );
    });
  });

  describe('deleteById', () => {
    it('deletes permission and returns success message', async () => {
      permissionModel.findByIdAndDelete.mockResolvedValue(permissionDocument);

      const result = await service.deleteById(permissionId);

      expect(permissionModel.findByIdAndDelete).toHaveBeenCalledWith(permissionId);
      expect(result).toEqual({ message: 'Permission deleted successfully' });
    });

    it('throws NotFoundException when delete target does not exist', async () => {
      permissionModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.deleteById(permissionId)).rejects.toThrow(
        new NotFoundException('Permission not found'),
      );
      expect(permissionModel.findByIdAndDelete).toHaveBeenCalledWith(permissionId);
    });
  });
});
