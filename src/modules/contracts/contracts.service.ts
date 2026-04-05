import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginatedResponseType } from 'src/common/interfaces/response.types';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { Contract } from './schemas/contract.schema';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<Contract>,
  ) {}

  async createFromRequest(payload: {
    requestId: string;
    investorOfferId: string;
    farmerId: string;
    investorId: string;
  }): Promise<void> {
    const exists = await this.contractModel
      .exists({ request: new Types.ObjectId(payload.requestId) })
      .lean();

    if (exists) return;

    await this.contractModel.create({
      request: new Types.ObjectId(payload.requestId),
      investorOffer: new Types.ObjectId(payload.investorOfferId),
      farmer: new Types.ObjectId(payload.farmerId),
      investor: new Types.ObjectId(payload.investorId),
    });
  }

  async findAll(
    userId: string,
    query: PaginationDto,
  ): Promise<PaginatedResponseType<Contract[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const filter: FilterQuery<Contract> = {
      $or: [
        { farmer: new Types.ObjectId(userId) },
        { investor: new Types.ObjectId(userId) },
      ],
    };

    const [data, totalDocs] = await Promise.all([
      this.contractModel
        .find(filter)
        .populate('request')
        .populate('investorOffer')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.contractModel.countDocuments(filter),
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
}
