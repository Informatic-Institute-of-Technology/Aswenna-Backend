import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { UserCreateI, UserUpdateI } from './user.types';
import {
  PaginatedResponseType,
  ResponseType,
} from 'src/common/interfaces/response.types';
import { RoleService } from '../role/role.service';

const T = {
  duplicateUserFoundByEmail: 'User with this email already exists',
  userNotFoundById: (id: string) => `User with ID ${id} not found`,
  roleAlreadyAssigned: 'Role already assigned to user',
  roleNotAssigned: 'Role not assigned to user',
};

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly roleService: RoleService,
  ) {}

  async findAll(
    page: number,
    limit: number,
    search: string,
    sort: string,
  ): Promise<PaginatedResponseType<User[]>> {
    const sortOptions: Record<string, 'asc' | 'desc'> = {};
    if (sort)
      sort.split(',').forEach((field) => {
        const isDesc = field.startsWith('-');
        const cleanField = field.replace(/^[+-]/, '').trim();
        sortOptions[cleanField] = isDesc ? 'desc' : 'asc';
      });

    const filter: FilterQuery<User> = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, totalDocs] = await Promise.all([
      this.userModel
        .find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
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

  async findById(target: string): Promise<User> {
    const selectedUser = await this.userModel.findById(target).exec();

    if (!selectedUser)
      throw new BadRequestException(T.userNotFoundById(target));

    return selectedUser;
  }

  async create(user: UserCreateI): Promise<User> {
    const existingUser = await this.userModel.findOne({
      email: user.email,
    });
    if (existingUser)
      throw new BadRequestException(T.duplicateUserFoundByEmail);

    const fullName = [user.firstName?.trim(), user.lastName?.trim()]
      .filter(Boolean)
      .join(' ');

    const hashedPassword = await bcrypt.hash(user.password, 10);

    if (user.role) await this.roleService.findById(user.role);

    return await this.userModel.create({
      ...user,
      fullName,
      password: hashedPassword,
      ...(user.role ? { role: new Types.ObjectId(user.role) } : {}),
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userModel
      .findOne({ email })
      .select('+password')
      .populate('role')
      .exec();
  }

  async assignRole(target: string, role: string): Promise<User | null> {
    const user = await this.findById(target);
    if (user.role) throw new BadRequestException(T.roleAlreadyAssigned);

    await this.roleService.findById(role);

    return this.userModel
      .findByIdAndUpdate(
        target,
        { role: new Types.ObjectId(role) },
        { new: true },
      )
      .exec();
  }

  async unassignRole(userId: string, role: string): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user.role || user.role._id.toString() !== role)
      throw new BadRequestException(T.roleNotAssigned);

    await this.roleService.findById(role);

    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { roles: new Types.ObjectId(role) } },
        { new: true },
      )
      .exec();
  }

  async updateById(target: string, user: UserUpdateI): Promise<User | null> {
    await this.findById(target);

    return await this.userModel
      .findByIdAndUpdate(target, user, {
        new: true,
      })
      .exec();
  }

  async deleteById(target: string): Promise<ResponseType> {
    await this.findById(target);

    await this.userModel.deleteOne({ _id: target }).exec();

    return {
      message: 'User deleted successfully',
      statusCode: 200,
    };
  }
}
