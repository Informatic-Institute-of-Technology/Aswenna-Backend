import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { FarmerProject } from '../schemas/farmer-project.schema';
import {
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
import { FarmerService } from '../farmer.service';

const T = {
  projectNotFoundById: (id: string) => `Project with ID ${id} not found`,
};

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(FarmerProject.name)
    private readonly projectModel: Model<FarmerProject>,
    private readonly farmerService: FarmerService,
  ) {}

  async findAll(
    page: number,
    limit: number,
    search: string,
    sort: string,
  ): Promise<PaginatedResponseType<FarmerProject[]>> {
    const sortOptions: Record<string, 'asc' | 'desc'> = {};
    if (sort)
      sort.split(',').forEach((field) => {
        const isDesc = field.startsWith('-');
        const cleanField = field.replace(/^[+-]/, '').trim();
        sortOptions[cleanField] = isDesc ? 'desc' : 'asc';
      });

    const filter: FilterQuery<FarmerProject> = {};
    if (search)
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
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
          select: 'user regions experience',
          populate: {
            path: 'user',
            select: 'fullName email',
          },
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
        select: 'user regions experience',
        populate: {
          path: 'user',
          select: 'fullName email',
        },
      })
      .exec();

    if (!project) throw new BadRequestException(T.projectNotFoundById(target));

    return project;
  }

  async create(project: ProjectCreateI): Promise<FarmerProject> {
    await this.farmerService.findById(project.farmer);

    if (project.type === ProjectType.HARVEST && !project.harvestDetails)
      throw new BadRequestException(
        'Harvest details are required for HARVEST type projects',
      );

    if (project.type === ProjectType.COMMISSION && !project.commissionDetails)
      throw new BadRequestException(
        'Commission details are required for COMMISSION type projects',
      );

    return await this.projectModel.create({
      ...project,
      farmer: new Types.ObjectId(project.farmer),
      status: ProjectStatus.DRAFT,
      visibility: project.visibility ?? true,
    });
  }

  async updateById(
    target: string,
    project: ProjectUpdateI,
  ): Promise<FarmerProject> {
    const selectedProject = await this.findById(target);

    if (
      (selectedProject.status as ProjectStatus) !== ProjectStatus.DRAFT &&
      (selectedProject.status as ProjectStatus) !== ProjectStatus.IN_REVIEW
    )
      throw new BadRequestException(
        'Project can only be updated in DRAFT or IN REVIEW status',
      );

    const updatedProject = await this.projectModel
      .findByIdAndUpdate(target, project, {
        new: true,
      })
      .exec();

    if (!updatedProject)
      throw new BadRequestException('T.projectNotFoundById(target)');

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
