import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Investor } from './schemas/investor.schema';
import { InvestorCreateI } from './investor.types';

@Injectable()
export class InvestorService {
  constructor(
    @InjectModel(Investor.name) private readonly investorModel: Model<Investor>,
  ) {}

  async create(investor: InvestorCreateI): Promise<Investor> {
    return this.investorModel.create({
      ...investor,
      user: new Types.ObjectId(investor.user),
    });
  }

  async findByUserId(userId: string): Promise<Investor | null> {
    return this.investorModel
      .findOne({ user: new Types.ObjectId(userId) })
      .exec();
  }
}
