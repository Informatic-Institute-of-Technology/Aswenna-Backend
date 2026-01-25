
import {Controller,Delete,Get,Patch,Post,Param,Body,} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { Auth } from 'src/core/decorators/auth.decorator';
import { Permission } from 'src/core/decorators/permission.decorator';
import { CreatePermissionDto } from './dtos/permission.create.dto';
import { UpdatePermissionDto } from './dtos/permission.update.dto';

@Controller('v1/permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  getAll() {
    return this.permissionService.findAll();
  }

  @Get(':id')
  @Permission('read:permission')
  getById(@Param('id') id: string) {
    return this.permissionService.findById(id);
  }

  @Post()
  @Permission('create:permission')
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionService.create(dto);
  }

  @Patch(':id')
  @Permission('update:permission')
  updateById(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionService.updateById(id, dto);
  }

  @Delete(':id')
  @Permission('delete:permission')
  deleteById(@Param('id') id: string) {
    return this.permissionService.deleteById(id);
  }
}
