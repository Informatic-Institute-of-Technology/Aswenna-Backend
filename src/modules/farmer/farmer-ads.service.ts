import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateFarmerAdDto } from './dtos/create-farmer-ad.dto';
import { UpdateFarmerAdDto } from './dtos/update-farmer-ad.dto';
import { FarmerAd } from './schemas/farmer-ad.schema';

@Injectable()
export class FarmerAdsService {
  constructor(
    @InjectModel(FarmerAd.name)
    private readonly farmerAdModel: Model<FarmerAd>,
  ) {}

 
  async createFarmerAd(dto: CreateFarmerAdDto, userId: string): Promise<FarmerAd> {
    const data = this.mapDtoToSchema(dto, userId);
    const ad = new this.farmerAdModel(data);
    return ad.save();
  }

  async findAll() {
    return this.farmerAdModel.find().sort({ createdAt: -1 }).exec();
  }

  
  async findByUserId(userId: string) {
    return this.farmerAdModel.find({ userId }).exec();
  }

 
  async findOne(id: string) {
    const ad = await this.farmerAdModel.findById(id).exec();
    if (!ad) {
      throw new NotFoundException(`Farmer Ad with ID ${id} not found`);
    }
    return ad;
  }

  async update(id: string, dto: UpdateFarmerAdDto) {
   
    const updateData = dto.offerType ? this.mapDtoToSchema(dto as any) : dto;
    
    const updatedAd = await this.farmerAdModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedAd) {
      throw new NotFoundException(`Update failed: Ad ${id} not found`);
    }
    return updatedAd;
  }

 
  async remove(id: string) {
    const result = await this.farmerAdModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Delete failed: Ad ${id} not found`);
    }
    return { deleted: true, id };
  }

  
  private mapDtoToSchema(dto: CreateFarmerAdDto, userId?: string) {
    const data: any = {
      ...(userId && { userId }),
      projectName: dto.projectName,
      description: dto.description,
      cropType: dto.cropType,
      location: dto.location,
      effectiveDateFrom: dto.effectiveDateFrom,
      effectiveDateTo: dto.effectiveDateTo,
      farmingMethods: dto.farmingMethods,
      agreementType: dto.agreementType,
      preferredRegions: dto.preferredRegions,
      offerType: dto.offerType,
    };

    if (dto.offerType === 'harvest') {
      data.expectedHarvest = dto.harvestBasedDetails?.expectedHarvest;
      data.expectedLandArea = dto.harvestBasedDetails?.expectedLandArea;
      
      data.commissionPercentage = null;
      data.investmentAmount = null;
    } else if (dto.offerType === 'commission') {
      data.commissionPercentage = dto.commissionBasedDetails?.commissionPercentage;
      data.investmentAmount = dto.commissionBasedDetails?.investmentAmount;
      data.noOfInstallments = dto.commissionBasedDetails?.noOfInstallments;
      
      data.expectedHarvest = null;
      data.expectedLandArea = null;
    }

    return data;
  }
}