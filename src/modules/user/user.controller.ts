import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { Auth } from 'src/core/decorators/auth.decorator';
import { Permission } from 'src/core/decorators/permission.decorator';

@Controller('v1/user')
@Auth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Permission('read:users')
  async getAll() {
    await this.userService.findAll();
  }

  @Get(':user')
  @Permission('read:user')
  async getById() {
    await this.userService.findById('');
  }

  @Post()
  @Permission('create:user')
  async create() {
    await this.userService.create({});
  }

  @Patch(':user')
  @Permission('update:user')
  async updateById() {
    await this.userService.updateById('', {});
  }

  @Delete(':user')
  @Permission('delete:user')
  async deleteById() {
    await this.userService.deleteById('');
  }
}
