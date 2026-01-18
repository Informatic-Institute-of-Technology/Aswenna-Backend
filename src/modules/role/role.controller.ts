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
import { RoleService } from './role.service';
import { RoleCreateDto } from './dtos/role.create.dto';
import { RoleUpdateDto } from './dtos/role.update.dto';
import { RoleParamsDto, RoleQueryDto } from './dtos/role.query.dto';

@Controller({ path: 'role', version: '1' })
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async getAll(@Query() query: RoleQueryDto) {
    return this.roleService.findAll(
      query.page,
      query.limit,
      query.search,
      query.sort,
    );
  }

  @Get(':role')
  async getById(@Param() params: RoleParamsDto) {
    return this.roleService.findById(params.role);
  }

  @Post()
  async create(@Body() role: RoleCreateDto) {
    return this.roleService.create(role);
  }

  @Patch(':role')
  async updateById(
    @Param() params: RoleParamsDto,
    @Body() role: RoleUpdateDto,
  ) {
    return this.roleService.updateById(params.role, role);
  }

  @Delete(':role')
  async deleteById(@Param() params: RoleParamsDto) {
    return this.roleService.deleteById(params.role);
  }
}
