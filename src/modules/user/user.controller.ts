import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UserCreateDto } from './dtos/user.create.dto';
import { UserEmailParamsDto, UserParamsDto } from './dtos/user.query.dto';
import { RoleParamsDto } from '../role/dtos/role.query.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { UserUpdateDto } from './dtos/user.update.dto';
import {
  UserUploadCompleteDto,
  UserUploadRequestDto,
} from './dtos/user.upload.dto';
import { LEGACY_UPLOAD_MULTER_OPTIONS } from 'src/common/constants/upload.constants';
import { UploadLimitExceptionFilter } from 'src/common/filters/upload-limit-exception.filter';

@Controller({ path: 'user', version: '1' })
@UseFilters(UploadLimitExceptionFilter)
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

  @Get('email/:email/duplicate-check')
  async getByEmail(@Param() params: UserEmailParamsDto) {
    const user = await this.userService.findByEmail(params.email);
    return { exists: !!user };
  }

  @Post()
  async create(@Body() user: UserCreateDto) {
    return this.userService.create(user);
  }

  @Post(':user/upload-requests')
  async createUploadRequests(
    @Param() params: UserParamsDto,
    @Body() body: UserUploadRequestDto,
  ) {
    return this.userService.createUploadRequests(params.user, body);
  }

  @Post(':user/upload-complete')
  async completeUpload(
    @Param() params: UserParamsDto,
    @Body() body: UserUploadCompleteDto,
  ) {
    return this.userService.completeUpload(params.user, body);
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

  @Post(':user/upload')
  @UseInterceptors(AnyFilesInterceptor(LEGACY_UPLOAD_MULTER_OPTIONS))
  async uploadMultipleFiles(
    @Param() params: UserParamsDto,
    @UploadedFiles() files: any[],
  ) {
    return await this.userService.uploadMultipleFilesByFieldName(
      params.user,
      files,
    );
  }
}
