import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  PaginatedResponseType,
  ResponseType,
} from 'src/common/interfaces/response.types';
import { UserService } from '../user/user.service';
import { FarmerCreateI, FarmerUpdateI } from './farmer.types';
import { Farmer } from './schemas/farmer.schema';

const T = {
  farmerNotFoundById: (id: string) => `Farmer with ID ${id} not found`,
  farmerNotFoundByUserId: (id: string) => `Farmer not found for user ID ${id}`,
};

@Injectable()
export class FarmerService {
  constructor(
    @InjectModel(Farmer.name) private readonly farmerModel: Model<Farmer>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async findAll(
    page: number,
    limit: number,
    search: string,
    sort: string,
  ): Promise<PaginatedResponseType<Farmer[]>> {
    const sortOptions: Record<string, 'asc' | 'desc'> = {};
    if (sort)
      sort.split(',').forEach((field) => {
        const isDesc = field.startsWith('-');
        const cleanField = field.replace(/^[+-]/, '').trim();
        sortOptions[cleanField] = isDesc ? 'desc' : 'asc';
      });

    const filter: FilterQuery<Farmer> = {};
    if (search) {
      filter.$or = [
        { crop: { $regex: search, $options: 'i' } },
        { regions: { $regex: search, $options: 'i' } },
        { experience: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, totalDocs] = await Promise.all([
      this.farmerModel
        .find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: 'user',
          select:
            'fullName email phoneNumber address role personalInfo.nicFrontImage personalInfo.nicBackImage personalInfo.profilePicture',
          populate: {
            path: 'role',
            select: 'name',
          },
        })
        .exec(),
      this.farmerModel.countDocuments(filter).exec(),
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

  async findById(target: string): Promise<Farmer> {
    const selectedFarmer = await this.farmerModel
      .findById(target)
      .populate({
        path: 'user',
        select:
          'fullName email phoneNumber address role personalInfo.nicFrontImage personalInfo.nicBackImage personalInfo.profilePicture',
        populate: {
          path: 'role',
          select: 'name',
        },
      })
      .exec();

    if (!selectedFarmer)
      throw new BadRequestException(T.farmerNotFoundById(target));

    return selectedFarmer;
  }

  async create(farmer: FarmerCreateI): Promise<Farmer> {
    return this.farmerModel.create({
      ...farmer,
      user: new Types.ObjectId(farmer.user),
    });
  }

  async updateById(target: string, farmer: FarmerUpdateI): Promise<Farmer> {
    const updatedFarmer = await this.farmerModel
      .findByIdAndUpdate(target, farmer, {
        new: true,
      })
      .exec();

    if (!updatedFarmer)
      throw new BadRequestException(T.farmerNotFoundById(target));

    return updatedFarmer;
  }

  async deleteById(target: string): Promise<ResponseType> {
    const deletedFarmer = await this.farmerModel
      .findByIdAndDelete(target)
      .exec();

    if (!deletedFarmer)
      throw new BadRequestException(T.farmerNotFoundById(target));

    if (deletedFarmer.user)
      await this.userService.deleteById(deletedFarmer.user._id.toString());

    return {
      statusCode: 200,
      message: 'Farmer deleted successfully',
    };
  }

  async findByUserId(userId: string): Promise<Farmer> {
    const farmer = await this.farmerModel
      .findOne({ user: new Types.ObjectId(userId) })
      .exec();

    if (!farmer)
      throw new BadRequestException(T.farmerNotFoundByUserId(userId));

    return farmer;
  }
}
