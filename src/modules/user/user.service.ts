import {
  BadRequestException,
  Injectable,
  forwardRef,
  Inject,
} from '@nestjs/common';
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
import { FarmerService } from '../farmer/farmer.service';
import { InvestorService } from '../investor/investor.service';

const T = {
  duplicateUserFoundByEmail: 'User with this email already exists',
  userNotFoundById: (id: string) => `User with ID ${id} not found`,
  roleAlreadyAssigned: 'Role already assigned to user',
  roleNotAssigned: 'Role not assigned to user',
  roleNotFound: (role: string) => `Role ${role} not found`,
};

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly roleService: RoleService,
    @Inject(forwardRef(() => FarmerService))
    private readonly farmerService: FarmerService,
    @Inject(forwardRef(() => InvestorService))
    private readonly investorService: InvestorService,
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

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const role = await this.roleService.findByName(user.role);
    if (!role) throw new BadRequestException(T.roleNotFound(user.role));

    const createdUser = await this.userModel.create({
      ...user,
      password: hashedPassword,
      personalInfo: {
        ...user.personalInfo,
        birthday: user.personalInfo.birthday
          ? new Date(user.personalInfo.birthday)
          : null,
      },
      role: new Types.ObjectId(role._id),
    });

    if (role.name.toLowerCase() === 'farmer' && user.farmerDetails)
      await this.farmerService.create({
        user: createdUser._id.toString(),
        ...user.farmerDetails,
      });

    if (role.name.toLowerCase() === 'investor' && user.investorDetails)
      await this.investorService.create({
        user: createdUser._id.toString(),
        ...user.investorDetails,
      });

    return createdUser;
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

    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $unset: { role: new Types.ObjectId(role) } },
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
