
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Permission } from './schemas/permission.schema';
import { CreatePermissionDto } from './dtos/permission.create.dto';
import { UpdatePermissionDto } from './dtos/permission.update.dto';

@Injectable()
export class PermissionService {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
  ) {}

  findAll() {
    return this.permissionModel.find().lean();
  }

  async findById(id: string) {
    const permission = await this.permissionModel.findById(id);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }

  create(dto: CreatePermissionDto) {
    return this.permissionModel.create(dto);
  }

  async updateById(id: string, dto: UpdatePermissionDto) {
    const permission = await this.permissionModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async deleteById(id: string) {
    const permission = await this.permissionModel.findByIdAndDelete(id);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return { message: 'Permission deleted successfully' };
  }
}
