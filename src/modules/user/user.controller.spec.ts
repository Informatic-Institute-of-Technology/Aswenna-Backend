import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: {
    findAll: jest.Mock;
    findById: jest.Mock;
    findByEmail: jest.Mock;
    create: jest.Mock;
    createUploadRequests: jest.Mock;
    completeUpload: jest.Mock;
    assignRole: jest.Mock;
    unassignRole: jest.Mock;
    updateById: jest.Mock;
    deleteById: jest.Mock;
    uploadMultipleFilesByFieldName: jest.Mock;
  };

  const userId = '67d3e18216f3ec23296ef77a';

  beforeEach(async () => {
    userService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      createUploadRequests: jest.fn(),
      completeUpload: jest.fn(),
      assignRole: jest.fn(),
      unassignRole: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      uploadMultipleFilesByFieldName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('getAll delegates to service', async () => {
    const query = { page: 1, limit: 10, search: '', sort: '-createdAt' };
    const response = { data: [], pagination: { totalDocs: 0, totalPages: 0 } };
    userService.findAll.mockResolvedValue(response);

    const result = await controller.getAll(query as any);

    expect(userService.findAll).toHaveBeenCalledWith(1, 10, '', '-createdAt');
    expect(result).toEqual(response);
  });

  it('getById delegates to service', async () => {
    const response = { _id: userId };
    userService.findById.mockResolvedValue(response);

    const result = await controller.getById({ user: userId } as any);

    expect(userService.findById).toHaveBeenCalledWith(userId);
    expect(result).toEqual(response);
  });

  it('getByEmail returns exists true when user found', async () => {
    userService.findByEmail.mockResolvedValue({ _id: userId });

    const result = await controller.getByEmail({
      email: 'john@example.com',
    } as any);

    expect(userService.findByEmail).toHaveBeenCalledWith('john@example.com');
    expect(result).toEqual({ exists: true });
  });

  it('create delegates to service', async () => {
    const dto = { fullName: 'John' };
    const response = { _id: userId, ...dto };
    userService.create.mockResolvedValue(response);

    const result = await controller.create(dto as any);

    expect(userService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(response);
  });

  it('assignRole delegates to service', async () => {
    const response = { _id: userId, role: { _id: 'role1' } };
    userService.assignRole.mockResolvedValue(response);

    const result = await controller.assignRole({
      user: userId,
      role: 'role1',
    } as any);

    expect(userService.assignRole).toHaveBeenCalledWith(userId, 'role1');
    expect(result).toEqual(response);
  });

  it('deleteById delegates to service', async () => {
    const response = { message: 'User deleted successfully', statusCode: 200 };
    userService.deleteById.mockResolvedValue(response);

    const result = await controller.deleteById({ user: userId } as any);

    expect(userService.deleteById).toHaveBeenCalledWith(userId);
    expect(result).toEqual(response);
  });
});
