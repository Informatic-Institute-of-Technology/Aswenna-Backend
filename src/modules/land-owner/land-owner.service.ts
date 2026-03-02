import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LandOwner } from './schemas/land-owner.schema';
import { LandOwnerCreateI } from './land-owner.types';
import { ResponseType } from 'src/common/interfaces/response.types';

const T = {
  landOwnerNotFoundById: (id: string) => `Land owner with ID ${id} not found`,
  landOwnerNotFoundByUserId: (id: string) =>
    `Land owner not found for user ID ${id}`,
};

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

  async findByUserId(userId: string): Promise<LandOwner> {
    const landOwner = await this.landOwnerModel
      .findOne({ user: new Types.ObjectId(userId) })
      .exec();

    if (!landOwner)
      throw new BadRequestException(T.landOwnerNotFoundByUserId(userId));

    return landOwner;
  }

  async updateById(
    landOwnerId: string,
    updateData: Record<string, any>,
  ): Promise<LandOwner> {
    const updatedLandOwner = await this.landOwnerModel
      .findByIdAndUpdate(landOwnerId, updateData, {
        new: true,
      })
      .exec();

    if (!updatedLandOwner)
      throw new BadRequestException(T.landOwnerNotFoundById(landOwnerId));

    return updatedLandOwner;
  }

  async deleteById(landOwnerId: string): Promise<ResponseType> {
    const deletedLandOwner = await this.landOwnerModel
      .findByIdAndDelete(landOwnerId)
      .exec();

    if (!deletedLandOwner)
      throw new BadRequestException(T.landOwnerNotFoundById(landOwnerId));

    return {
      statusCode: 200,
      message: 'Land owner deleted successfully',
    };
  }
}
