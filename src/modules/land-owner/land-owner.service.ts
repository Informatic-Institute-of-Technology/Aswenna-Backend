import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LandOwner } from './schemas/land-owner.schema';
import { LandOwnerCreateI } from './land-owner.types';

@Injectable()
export class LandOwnerService {
  constructor(
    @InjectModel(LandOwner.name)
    private readonly landOwnerModel: Model<LandOwner>,
  ) {}

  async create(landOwner: LandOwnerCreateI): Promise<LandOwner> {
    return this.landOwnerModel.create({
      ...landOwner,
      user: new Types.ObjectId(landOwner.user),
    });
  }
}
