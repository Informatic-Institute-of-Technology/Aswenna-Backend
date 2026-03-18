import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery, UpdateQuery } from 'mongoose';
import { FarmerProject } from '../schemas/farmer-project.schema';
import {
  CommissionBasedDetailsI,
  HarvestBasedDetailsI,
  ProjectCreateI,
  ProjectUpdateI,
  ProjectStatus,
  ProjectStatusUpdateI,
  ProjectType,
} from './project.types';
import {
  PaginatedResponseType,
  ResponseType,
} from 'src/common/interfaces/response.types';
import { UserService } from 'src/modules/user/user.service';
import { UserReal } from 'src/core/decorators/user.decorators';

const T = {
  projectNotFoundById: (id: string) => `Project with ID ${id} not found`,
};

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(FarmerProject.name)
    private readonly projectModel: Model<FarmerProject>,
    private readonly userService: UserService,
  ) {}

  async findAll(
    page: number,
    limit: number,
    search: string,
    sort: string,
    user: UserReal,
  ): Promise<PaginatedResponseType<FarmerProject[]>> {
    const userId = user.user || user.userId || user.sub;
    const sortOptions: Record<string, 'asc' | 'desc'> = {};
    if (sort)
      sort.split(',').forEach((field) => {
        const isDesc = field.startsWith('-');
        const cleanField = field.replace(/^[+-]/, '').trim();
        sortOptions[cleanField] = isDesc ? 'desc' : 'asc';
      });

    const filter: FilterQuery<FarmerProject> = {};

    if (userId) {
      const selectedUser = await this.userService.findById(userId);
      const roleName = selectedUser?.role?.name?.toLowerCase?.();

      if (roleName === 'farmer') {
        Object.assign(filter, { farmer: new Types.ObjectId(userId) });
      }
    }

    if (search)
      filter.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cropType: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];

    const [data, totalDocs] = await Promise.all([
      this.projectModel
        .find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: 'farmer',
          select: 'fullName email',
        })
        .exec(),
      this.projectModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(totalDocs / limit);

    return {
      data,
      pagination: {
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
        nextPage: page + 1,
        page,
        prevPage: page - 1,
        totalDocs,
        totalPages,
      },
    };
  }

  async findById(target: string): Promise<FarmerProject> {
    const project = await this.projectModel
      .findById(target)
      .populate({
        path: 'farmer',
        select: 'fullName email',
      })
      .exec();

    if (!project) throw new BadRequestException(T.projectNotFoundById(target));

    return project;
  }

  async create(project: ProjectCreateI): Promise<FarmerProject> {
    await this.userService.findById(project.farmer);

    const offerType = project.offerType;
    const harvestBasedDetails = project.harvestBasedDetails;
    const commissionBasedDetails = project.commissionBasedDetails;

    if (offerType === ProjectType.HARVEST && !harvestBasedDetails)
      throw new BadRequestException(
        'Harvest based details are required for harvest offer type projects',
      );

    if (offerType === ProjectType.COMMISSION && !commissionBasedDetails)
      throw new BadRequestException(
        'Commission based details are required for commission offer type projects',
      );

    const payload: Omit<ProjectCreateI, 'farmer'> & {
      farmer: Types.ObjectId;
      status: ProjectStatus;
      visibility: boolean;
      harvestBasedDetails?: HarvestBasedDetailsI;
      commissionBasedDetails?: CommissionBasedDetailsI;
    } = {
      ...project,
      offerType,
      harvestBasedDetails,
      commissionBasedDetails,
      farmer: new Types.ObjectId(project.farmer),
      status: ProjectStatus.DRAFT,
      visibility: project.visibility ?? true,
    };

    if (offerType === ProjectType.HARVEST)
      delete payload.commissionBasedDetails;
    if (offerType === ProjectType.COMMISSION)
      delete payload.harvestBasedDetails;

    return await this.projectModel.create(payload);
  }

  async updateById(
    target: string,
    project: ProjectUpdateI,
  ): Promise<FarmerProject> {
    const selectedProject = await this.findById(target);
    const projectWithOwner = project as ProjectUpdateI & {
      farmer?: string;
      user?: string;
    };
    const farmerId = projectWithOwner.farmer ?? projectWithOwner.user;
    const projectWithoutOwner: Record<string, unknown> = {
      ...projectWithOwner,
    };

    delete (projectWithoutOwner as { farmer?: string }).farmer;
    delete (projectWithoutOwner as { user?: string }).user;

    if (farmerId) {
      await this.userService.findById(farmerId);
    }

    if (
      (selectedProject.status as ProjectStatus) !== ProjectStatus.DRAFT &&
      (selectedProject.status as ProjectStatus) !== ProjectStatus.IN_REVIEW
    )
      throw new BadRequestException(
        'Project can only be updated in DRAFT or IN REVIEW status',
      );

    const offerType = project.offerType ?? selectedProject.offerType;
    const harvestBasedDetails =
      project.harvestBasedDetails ?? selectedProject.harvestBasedDetails;
    const commissionBasedDetails =
      project.commissionBasedDetails ?? selectedProject.commissionBasedDetails;

    if (offerType === ProjectType.HARVEST && !harvestBasedDetails)
      throw new BadRequestException(
        'Harvest based details are required for harvest offer type projects',
      );

    if (offerType === ProjectType.COMMISSION && !commissionBasedDetails)
      throw new BadRequestException(
        'Commission based details are required for commission offer type projects',
      );

    const updatePayload: Record<string, unknown> = {
      ...projectWithoutOwner,
      offerType,
      harvestBasedDetails,
      commissionBasedDetails,
    };

    if (farmerId) {
      updatePayload.farmer = new Types.ObjectId(String(farmerId));
    }

    if (offerType === ProjectType.HARVEST)
      delete updatePayload.commissionBasedDetails;
    if (offerType === ProjectType.COMMISSION)
      delete updatePayload.harvestBasedDetails;

    const updatedProject = await this.projectModel
      .findByIdAndUpdate(target, updatePayload as UpdateQuery<FarmerProject>, {
        new: true,
      })
      .exec();

    if (!updatedProject)
      throw new BadRequestException(T.projectNotFoundById(target));

    return updatedProject;
  }

  async updateStatus(
    projectId: string,
    statusUpdate: ProjectStatusUpdateI,
  ): Promise<FarmerProject> {
    const project = await this.findById(projectId);
    const newStatus = statusUpdate.status;

    const validTransitions: Record<string, ProjectStatus[]> = {
      [ProjectStatus.DRAFT]: [ProjectStatus.PUBLISHED],
      [ProjectStatus.PUBLISHED]: [ProjectStatus.REQUESTED],
      [ProjectStatus.REQUESTED]: [ProjectStatus.IN_REVIEW],
      [ProjectStatus.IN_REVIEW]: [
        ProjectStatus.APPROVED,
        ProjectStatus.ARCHIVED,
      ],
      [ProjectStatus.APPROVED]: [ProjectStatus.ARCHIVED],
      [ProjectStatus.ARCHIVED]: [],
    };

    if (!validTransitions[project.status]?.includes(newStatus))
      throw new BadRequestException(
        `Cannot transition from ${project.status} to ${newStatus}`,
      );

    const updatedProject = await this.projectModel
      .findByIdAndUpdate(projectId, { status: newStatus }, { new: true })
      .exec();

    if (!updatedProject)
      throw new BadRequestException(T.projectNotFoundById(projectId));

    return updatedProject;
  }

  async deleteById(target: string): Promise<ResponseType> {
    const project = await this.findById(target);

    if ((project.status as ProjectStatus) !== ProjectStatus.DRAFT)
      throw new BadRequestException('Only DRAFT projects can be deleted');

    await this.projectModel
      .findByIdAndDelete(new Types.ObjectId(target))
      .exec();

    return {
      statusCode: 200,
      message: 'Project deleted successfully',
    };
  }
}
