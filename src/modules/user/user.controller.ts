import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserCreateDto } from './dtos/user.create.dto';
import { UserParamsDto } from './dtos/user.query.dto';
import { RoleParamsDto } from '../role/dtos/role.query.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { UserUpdateDto } from './dtos/user.update.dto';
@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAll(@Query() query: PaginationDto) {
    return this.userService.findAll(
      query.page,
      query.limit,
      query.search,
      query.sort,
    );
  }

  @Get(':user')
  async getById(@Param() params: UserParamsDto) {
    return this.userService.findById(params.user);
  }

  @Post()
  async create(@Body() createUserDto: UserCreateDto) {
    return this.userService.create(createUserDto);
  }

  @Post(':user/role/:role')
  async assignRole(@Param() params: UserParamsDto & RoleParamsDto) {
    return this.userService.assignRole(params.user, params.role);
  }

  @Delete(':user/role/:role')
  async unassignRole(@Param() params: UserParamsDto & RoleParamsDto) {
    return this.userService.unassignRole(params.user, params.role);
  }

  @Patch(':user')
  async updateById(
    @Param() params: UserParamsDto,
    @Body() user: UserUpdateDto,
  ) {
    return this.userService.updateById(params.user, user);
  }

  @Delete(':user')
  async deleteById(@Param() params: UserParamsDto) {
    return this.userService.deleteById(params.user);
  }
}
