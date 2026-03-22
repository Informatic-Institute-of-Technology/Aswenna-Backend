import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ProjectService } from './project.service';
import { FarmerProject } from '../schemas/farmer-project.schema';
import { UserService } from 'src/modules/user/user.service';
import { ProjectStatus, ProjectType } from './project.types';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
  };
  let userService: {
    findById: jest.Mock;
  };

  const projectId = '67d3e18216f3ec23296ef771';
  const farmerId = '67d3e18216f3ec23296ef772';

  const baseProject = {
    _id: projectId,
    farmer: farmerId,
    offerType: ProjectType.HARVEST,
    projectName: 'Rice Harvest',
    description: 'Project description',
    status: ProjectStatus.DRAFT,
    harvestBasedDetails: { expectedLandArea: 5 },
  };

  const createDto = {
    farmer: farmerId,
    offerType: ProjectType.HARVEST,
    landAvailability: 'with_land' as any,
    projectName: 'Rice Harvest',
    description: 'Project description',
    cropType: 'Rice',
    cropIcon: 'icon.png',
    backgroundImage: 'bg.png',
    location: 'Kurunegala',
    farmingMethods: 'Organic',
    preferredRegions: ['North'],
    costBreakdown: [
      {
        category: 'Seeds',
        description: 'Seed cost',
        estimatedCost: 1000,
      },
    ],
    milestoneBreakdown: [
      {
        milestone: 'Phase 1',
        description: 'Soil prep',
        estimatedAmount: 500,
      },
    ],
    totalInvestmentRequired: 5000,
    effectiveDateFrom: new Date('2026-01-01'),
    effectiveDateTo: new Date('2026-12-31'),
    harvestBasedDetails: { expectedLandArea: 5 },
  };

  const createFindChain = (resolvedData: unknown) => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(resolvedData),
    };

    return chain;
  };

  beforeEach(async () => {
    projectModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    userService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getModelToken(FarmerProject.name),
          useValue: projectModel,
        },
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  describe('findAll', () => {
    it('returns paginated data and populates farmer for harvest type', async () => {
      const findChain = createFindChain([baseProject]);
      projectModel.find.mockReturnValue(findChain);
      projectModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });
      userService.findById.mockResolvedValue({ role: { name: 'farmer' } });

      const result = await service.findAll(
        1,
        10,
        '',
        '-createdAt',
        { user: farmerId },
        ProjectType.HARVEST,
      );

      expect(projectModel.find).toHaveBeenCalled();
      expect(findChain.populate).toHaveBeenCalledWith({
        path: 'farmer',
        select: 'fullName email',
      });
      expect(result.data).toEqual([baseProject]);
      expect(result.pagination.totalDocs).toBe(1);
    });

    it('selects commission projection for commission type', async () => {
      const findChain = createFindChain([baseProject]);
      projectModel.find.mockReturnValue(findChain);
      projectModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });
      userService.findById.mockResolvedValue({ role: { name: 'admin' } });

      await service.findAll(
        1,
        10,
        '',
        '-createdAt',
        { user: farmerId },
        ProjectType.COMMISSION,
      );

      expect(findChain.select).toHaveBeenCalled();
      expect(findChain.populate).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('returns project when found', async () => {
      projectModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(baseProject),
        }),
      });

      const result = await service.findById(projectId);

      expect(result).toEqual(baseProject);
    });

    it('throws when project does not exist', async () => {
      projectModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findById(projectId)).rejects.toThrow(
        new BadRequestException(`Project with ID ${projectId} not found`),
      );
    });
  });

  describe('create', () => {
    it('creates project with draft status and default visibility', async () => {
      userService.findById.mockResolvedValue({ _id: farmerId });
      projectModel.create.mockResolvedValue(baseProject);

      const result = await service.create(createDto as any);

      expect(projectModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          offerType: ProjectType.HARVEST,
          status: ProjectStatus.DRAFT,
          visibility: true,
          farmer: expect.any(Types.ObjectId),
        }),
      );
      expect(result).toEqual(baseProject);
    });
  });

  describe('updateById', () => {
    it('updates project when status is DRAFT', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(baseProject as any);

      projectModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...baseProject, projectName: 'Updated' }),
      });

      const result = await service.updateById(projectId, {
        projectName: 'Updated',
      } as any);

      expect(projectModel.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        expect.any(Object),
        { new: true },
      );
      expect(result.projectName).toBe('Updated');
    });

    it('throws when status is not editable', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({
        ...baseProject,
        status: ProjectStatus.PUBLISHED,
      } as any);

      await expect(
        service.updateById(projectId, { projectName: 'Updated' } as any),
      ).rejects.toThrow(
        new BadRequestException(
          'Project can only be updated in DRAFT or IN REVIEW status',
        ),
      );
    });
  });

  describe('updateStatus', () => {
    it('updates status when transition is valid', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({
        ...baseProject,
        status: ProjectStatus.DRAFT,
      } as any);

      projectModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...baseProject,
          status: ProjectStatus.PUBLISHED,
        }),
      });

      const result = await service.updateStatus(projectId, {
        status: ProjectStatus.PUBLISHED,
      });

      expect(result.status).toBe(ProjectStatus.PUBLISHED);
    });

    it('throws when transition is invalid', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({
        ...baseProject,
        status: ProjectStatus.DRAFT,
      } as any);

      await expect(
        service.updateStatus(projectId, { status: ProjectStatus.APPROVED }),
      ).rejects.toThrow(
        new BadRequestException('Cannot transition from DRAFT to APPROVED'),
      );
    });
  });

  describe('deleteById', () => {
    it('deletes project when status is DRAFT', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({
        ...baseProject,
        status: ProjectStatus.DRAFT,
      } as any);

      projectModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const result = await service.deleteById(projectId);

      expect(projectModel.findByIdAndDelete).toHaveBeenCalledWith(
        expect.any(Types.ObjectId),
      );
      expect(result).toEqual({
        statusCode: 200,
        message: 'Project deleted successfully',
      });
    });

    it('throws when trying to delete non-DRAFT project', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({
        ...baseProject,
        status: ProjectStatus.PUBLISHED,
      } as any);

      await expect(service.deleteById(projectId)).rejects.toThrow(
        new BadRequestException('Only DRAFT projects can be deleted'),
      );
    });
  });
});
