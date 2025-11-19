import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { Auth } from 'src/core/decorators/auth.decorator';
import { RoleService } from './role.service';
import { Permission } from 'src/core/decorators/permission.decorator';

@Controller('v1/role')
@Auth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Permission('read:roles')
  async getAll() {
    await this.roleService.findAll();
  }

  @Get(':role')
  @Permission('read:role')
  async getById() {
    await this.roleService.findById('');
  }

  @Post()
  @Permission('create:role')
  async create() {
    await this.roleService.create({});
  }

  @Patch(':role')
  @Permission('update:role')
  async updateById() {
    await this.roleService.updateById('', {});
  }

  @Delete(':role')
  @Permission('delete:role')
  async deleteById() {
    await this.roleService.deleteById('');
  }
}
