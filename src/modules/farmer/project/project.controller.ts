import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Delete,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectCreateDto } from './dtos/project.create.dto';
import {
  ProjectStatusUpdateDto,
  ProjectUpdateDto,
} from './dtos/project.update.dto';
import { ProjectParamsDto, ProjectQueryDto } from './dtos/project.query.dto';

@Controller({ path: 'farmer-project', version: '1' })
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async findAll(@Query() query: ProjectQueryDto) {
    return this.projectService.findAll(
      query.page,
      query.limit,
      query.search,
      query.sort,
    );
  }

  @Get(':project')
  async findById(@Param() params: ProjectParamsDto) {
    return this.projectService.findById(params.project);
  }

  @Post()
  async create(@Body() createProjectDto: ProjectCreateDto) {
    return this.projectService.create(createProjectDto);
  }

  @Patch(':project')
  async update(
    @Param() params: ProjectParamsDto,
    @Body() updateProjectDto: ProjectUpdateDto,
  ) {
    return this.projectService.updateById(params.project, updateProjectDto);
  }

  @Patch(':project/status')
  async updateStatus(
    @Param() params: ProjectParamsDto,
    @Body() updateProjectStatusDto: ProjectStatusUpdateDto,
  ) {
    return this.projectService.updateStatus(
      params.project,
      updateProjectStatusDto,
    );
  }

  @Delete(':project')
  async delete(@Param() params: ProjectParamsDto) {
    return this.projectService.deleteById(params.project);
  }
}
