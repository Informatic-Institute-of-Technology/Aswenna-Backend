import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Role } from './schemas/role.schema';
import { RoleCreateI, RoleUpdateI } from './role.types';
import {
  PaginatedResponseType,
  ResponseType,
} from 'src/common/interfaces/response.types';

const T = {
  roleNotFoundById: (id: string) => `Role with ID ${id} not found`,
  duplicateRole: 'Role with this name already exists',
};

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
  ) {}

  async findAll(
    page: number,
    limit: number,
    search: string,
    sort: string,
  ): Promise<PaginatedResponseType<Role[]>> {
    const sortOptions: Record<string, 'asc' | 'desc'> = {};
    if (sort)
      sort.split(',').forEach((field) => {
        const isDesc = field.startsWith('-');
        const cleanField = field.replace(/^[+-]/, '').trim();
        sortOptions[cleanField] = isDesc ? 'desc' : 'asc';
      });

    const filter: FilterQuery<Role> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, totalDocs] = await Promise.all([
      this.roleModel
        .find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.roleModel.countDocuments(filter).exec(),
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

  async findById(target: string): Promise<Role> {
    const role = await this.roleModel.findById(target).exec();
    if (!role) throw new BadRequestException(T.roleNotFoundById(target));
    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return await this.roleModel.findOne({ name }).exec();
  }

  async create(role: RoleCreateI): Promise<Role> {
    const existingCheck = await this.findByName(role.name);
    if (existingCheck) throw new BadRequestException(T.duplicateRole);

    return await this.roleModel.create(role);
  }

  async updateById(target: string, role: RoleUpdateI): Promise<Role | null> {
    await this.findById(target);

    return await this.roleModel
      .findByIdAndUpdate(target, role, { new: true })
      .exec();
  }

  async deleteById(target: string): Promise<ResponseType> {
    const role = await this.findById(target);
    await this.roleModel.deleteOne({ _id: role._id }).exec();

    return {
      message: 'Role deleted successfully',
      statusCode: 200,
    };
  }
}
