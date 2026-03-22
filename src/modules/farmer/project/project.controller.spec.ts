import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectStatus, ProjectType } from './project.types';
import { AuthorizationGuard } from 'src/core/guards/authorization.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

describe('ProjectController', () => {
  let controller: ProjectController;
  let projectService: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    updateById: jest.Mock;
    updateStatus: jest.Mock;
    deleteById: jest.Mock;
  };

  const projectId = '67d3e18216f3ec23296ef771';

  beforeEach(async () => {
    projectService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      updateStatus: jest.fn(),
      deleteById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: projectService,
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

    controller = module.get<ProjectController>(ProjectController);
  });

  it('findAll delegates to service', async () => {
    const query = {
      page: 1,
      limit: 10,
      search: 'rice',
      sort: '-createdAt',
      projectType: ProjectType.HARVEST,
    };
    const user = { user: '67d3e18216f3ec23296ef772' };
    const response = { data: [], pagination: { totalDocs: 0, totalPages: 0 } };
    projectService.findAll.mockResolvedValue(response);

    const result = await controller.findAll(query as any, user as any);

    expect(projectService.findAll).toHaveBeenCalledWith(
      1,
      10,
      'rice',
      '-createdAt',
      user,
      ProjectType.HARVEST,
    );
    expect(result).toEqual(response);
  });

  it('findById delegates to service', async () => {
    const response = { _id: projectId, projectName: 'P1' };
    projectService.findById.mockResolvedValue(response);

    const result = await controller.findById({ project: projectId } as any);

    expect(projectService.findById).toHaveBeenCalledWith(projectId);
    expect(result).toEqual(response);
  });

  it('create delegates to service', async () => {
    const dto = { projectName: 'New Project' };
    const response = { _id: projectId, ...dto };
    projectService.create.mockResolvedValue(response);

    const result = await controller.create(dto as any);

    expect(projectService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(response);
  });

  it('update delegates to service', async () => {
    const dto = { projectName: 'Updated Project' };
    const response = { _id: projectId, ...dto };
    projectService.updateById.mockResolvedValue(response);

    const result = await controller.update(
      { project: projectId } as any,
      dto as any,
    );

    expect(projectService.updateById).toHaveBeenCalledWith(projectId, dto);
    expect(result).toEqual(response);
  });

  it('updateStatus delegates to service', async () => {
    const dto = { status: ProjectStatus.PUBLISHED };
    const response = { _id: projectId, status: ProjectStatus.PUBLISHED };
    projectService.updateStatus.mockResolvedValue(response);

    const result = await controller.updateStatus(
      { project: projectId } as any,
      dto,
    );

    expect(projectService.updateStatus).toHaveBeenCalledWith(projectId, dto);
    expect(result).toEqual(response);
  });

  it('delete delegates to service', async () => {
    const response = { statusCode: 200, message: 'Project deleted successfully' };
    projectService.deleteById.mockResolvedValue(response);

    const result = await controller.delete({ project: projectId } as any);

    expect(projectService.deleteById).toHaveBeenCalledWith(projectId);
    expect(result).toEqual(response);
  });
});
