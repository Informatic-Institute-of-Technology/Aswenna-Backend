import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LandAdd } from './schemas/land-adds.schema';
import { CreateAddDto } from './dto/create-add.dto';
import { UpdateAddDto } from './dto/update-add.dto';
import { NotificationService } from 'src/common/notification/notification.service';
import { UserService } from '../user/user.service';

@Injectable()
export class CreateAddsService {
  constructor(
    @InjectModel(LandAdd.name)
    private readonly landAdModel: Model<LandAdd>,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService
  ) {}

    async createAdd(dto: CreateAddDto, userId: string) {
  const ad = await this.landAdModel.create({
    ...dto,
    landOwnerId: userId,
  });


 await this.notificationService.sendEmail(
    'test@mailtrap.io',
    'Ad Created',
    'Create Add email is send successfully',
  );


  return ad;
}


 
  async updateAdd(adId: string, dto: UpdateAddDto) {
    const ad = await this.landAdModel.findById(adId);
    if (!ad) throw new NotFoundException('Ad not found');

    return this.landAdModel.findByIdAndUpdate(adId, dto, { new: true });
  }

 
  async deleteAdd(adId: string) {
    const ad = await this.landAdModel.findById(adId);
    if (!ad) throw new NotFoundException('Ad not found');

    return this.landAdModel.findByIdAndDelete(adId);
  }

  
  async getAllAds() {
    return this.landAdModel.find();
  }
}
