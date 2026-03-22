import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';

describe('RoleController', () => {
  let controller: RoleController;
  let roleService: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    updateById: jest.Mock;
    deleteById: jest.Mock;
  };

  const roleId = '67d3e18216f3ec23296ef77a';
  const role = {
    _id: roleId,
    name: 'FARMER',
    description: 'Farmer role',
  };

  beforeEach(async () => {
    roleService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: roleService,
        },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
  });

  describe('getAll', () => {
    it('returns paginated roles', async () => {
      const query = { page: 1, limit: 10, search: 'farm', sort: '-createdAt' };
      const response = {
        data: [role],
        pagination: {
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10,
          nextPage: 2,
          page: 1,
          prevPage: 0,
          totalDocs: 1,
          totalPages: 1,
        },
      };

      roleService.findAll.mockResolvedValue(response);

      const result = await controller.getAll(query);

      expect(roleService.findAll).toHaveBeenCalledWith(
        1,
        10,
        'farm',
        '-createdAt',
      );
      expect(result).toEqual(response);
    });
  });

  describe('getById', () => {
    it('returns a role by id', async () => {
      roleService.findById.mockResolvedValue(role);

      const result = await controller.getById({ role: roleId });

      expect(roleService.findById).toHaveBeenCalledWith(roleId);
      expect(result).toEqual(role);
    });
  });

  describe('create', () => {
    it('creates and returns role', async () => {
      const createDto = {
        name: 'INVESTOR',
        description: 'Investor role',
      };
      const created = { _id: '1', ...createDto };

      roleService.create.mockResolvedValue(created);

      const result = await controller.create(createDto);

      expect(roleService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(created);
    });
  });

  describe('updateById', () => {
    it('updates and returns role', async () => {
      const updateDto = { description: 'Updated description' };
      const updated = { ...role, ...updateDto };

      roleService.updateById.mockResolvedValue(updated);

      const result = await controller.updateById({ role: roleId }, updateDto);

      expect(roleService.updateById).toHaveBeenCalledWith(roleId, updateDto);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteById', () => {
    it('deletes role and returns success response', async () => {
      const deleted = {
        message: 'Role deleted successfully',
        statusCode: 200,
      };

      roleService.deleteById.mockResolvedValue(deleted);

      const result = await controller.deleteById({ role: roleId });

      expect(roleService.deleteById).toHaveBeenCalledWith(roleId);
      expect(result).toEqual(deleted);
    });
  });
});
