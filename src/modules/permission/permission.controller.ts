import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { Auth } from 'src/core/decorators/auth.decorator';
import { Permission } from 'src/core/decorators/permission.decorator';

@Controller('v1/permission')
@Auth()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @Permission('read:permissions')
  async getAll() {
    await this.permissionService.findAll();
  }

  @Get(':permission')
  @Permission('read:permission')
  async getById() {
    await this.permissionService.findById('');
  }

  @Post()
  @Permission('create:permission')
  async create() {
    await this.permissionService.create({});
  }

  @Patch(':permission')
  @Permission('update:permission')
  async updateById() {
    await this.permissionService.updateById('', {});
  }

  @Delete(':permission')
  @Permission('delete:permission')
  async deleteById() {
    await this.permissionService.deleteById('');
  }
}
