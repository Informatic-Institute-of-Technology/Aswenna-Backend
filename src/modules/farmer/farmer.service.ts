import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Farmer } from './schemas/farmer.schema';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import { FarmerCreateI } from './farmer.types';

@Injectable()
export class FarmerService {
  constructor(
    @InjectModel(Farmer.name) private readonly farmerModel: Model<Farmer>,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  async create(farmer: FarmerCreateI): Promise<Farmer> {
    const selectedRole = await this.roleService.findById(farmer.role);
    if (selectedRole.name.toLowerCase() !== 'farmer') {
      throw new BadRequestException(
        'Role must be farmer to create farmer profile',
      );
    }

    const createdUser = await this.userService.create({
      fullName: farmer.fullName,
      address: farmer.address,
      nicNumber: farmer.nicNumber,
      email: farmer.email,
      phoneNumber: farmer.phoneNumber,
      password: farmer.password,
      role: farmer.role,
    });

    return await this.farmerModel.create({
      ...farmer,
      user: new Types.ObjectId(createdUser._id),
    });
  }
}
