import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { PermissionType } from 'src/common/enums/permission.type.enum';

describe('PermissionController', () => {
  let controller: PermissionController;
  let permissionService: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    updateById: jest.Mock;
    deleteById: jest.Mock;
  };

  const permissionId = '67d3e18216f3ec23296ef77a';
  const createDto = {
    scope: 'create:permission',
    description: 'Create permission',
    type: PermissionType.API,
  };
  const updateDto = {
    description: 'Updated permission description',
  };
  const permission = {
    _id: permissionId,
    ...createDto,
  };

  beforeEach(async () => {
    permissionService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionController],
      providers: [
        {
          provide: PermissionService,
          useValue: permissionService,
        },
      ],
    }).compile();

    controller = module.get<PermissionController>(PermissionController);
  });

  describe('getAll', () => {
    it('returns all permissions', async () => {
      const permissions = [permission];
      permissionService.findAll.mockResolvedValue(permissions);

      const result = await controller.getAll();

      expect(permissionService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(permissions);
    });
  });

  describe('getById', () => {
    it('returns one permission by id', async () => {
      permissionService.findById.mockResolvedValue(permission);

      const result = await controller.getById(permissionId);

      expect(permissionService.findById).toHaveBeenCalledWith(permissionId);
      expect(result).toEqual(permission);
    });
  });

  describe('create', () => {
    it('creates and returns permission', async () => {
      permissionService.create.mockResolvedValue(permission);

      const result = await controller.create(createDto);

      expect(permissionService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(permission);
    });
  });

  describe('updateById', () => {
    it('updates and returns permission', async () => {
      const updatedPermission = {
        ...permission,
        ...updateDto,
      };
      permissionService.updateById.mockResolvedValue(updatedPermission);

      const result = await controller.updateById(permissionId, updateDto);

      expect(permissionService.updateById).toHaveBeenCalledWith(
        permissionId,
        updateDto,
      );
      expect(result).toEqual(updatedPermission);
    });
  });

  describe('deleteById', () => {
    it('deletes permission and returns success message', async () => {
      const deleteResponse = { message: 'Permission deleted successfully' };
      permissionService.deleteById.mockResolvedValue(deleteResponse);

      const result = await controller.deleteById(permissionId);

      expect(permissionService.deleteById).toHaveBeenCalledWith(permissionId);
      expect(result).toEqual(deleteResponse);
    });
  });
});
