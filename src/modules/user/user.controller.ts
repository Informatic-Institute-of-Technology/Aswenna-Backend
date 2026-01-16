import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserCreateDto } from './dtos/user.create.dto';
import { UserParamsDto } from './dtos/user.query.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
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

  @Delete(':user')
  async deleteById(@Param() params: UserParamsDto) {
    return this.userService.deleteById(params.user);
  }
}
