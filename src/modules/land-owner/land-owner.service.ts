import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LandOwner } from './schemas/land-owner.schema';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import { LandOwnerCreateI } from './land-owner.types';

@Injectable()
export class LandOwnerService {
  constructor(
    @InjectModel(LandOwner.name)
    private readonly landOwnerModel: Model<LandOwner>,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  async create(landOwner: LandOwnerCreateI): Promise<LandOwner> {
    const selectedRole = await this.roleService.findById(landOwner.role);
    if (selectedRole.name.toLowerCase() !== 'landowner')
      throw new BadRequestException(
        'Role must be land owner to create land owner profile',
      );

    const createdUser = await this.userService.create(landOwner);

    return await this.landOwnerModel.create({
      ...landOwner,
      user: new Types.ObjectId(createdUser._id),
    });
  }
}
