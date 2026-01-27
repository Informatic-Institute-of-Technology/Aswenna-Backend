import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { FarmerService } from './farmer.service';
import { Public } from 'src/core/decorators/public.decorator';
import { FarmerCreateDto } from './dtos/farmer.create.dto';
import { FarmerUpdateDto } from './dtos/farmer.update.dto';
import { FarmerParamsDto, FarmerQueryDto } from './dtos/farmer.query.dto';

@Controller({ path: 'farmer', version: '1' })
export class FarmerController {
  constructor(private readonly farmerService: FarmerService) {}

  @Get()
  async getAll(@Query() query: FarmerQueryDto) {
    return this.farmerService.findAll(
      query.page,
      query.limit,
      query.search,
      query.sort,
    );
  }

  @Get(':farmer')
  async findById(@Param() params: FarmerParamsDto) {
    return this.farmerService.findById(params.farmer);
  }

  @Post()
  @Public()
  create(@Body() farmer: FarmerCreateDto) {
    return this.farmerService.create(farmer);
  }

  @Patch(':farmer')
  async update(
    @Param() params: FarmerParamsDto,
    @Body() updateFarmerDto: FarmerUpdateDto,
  ) {
    return this.farmerService.updateById(params.farmer, updateFarmerDto);
  }

  @Delete(':farmer')
  async delete(@Param() params: FarmerParamsDto) {
    return this.farmerService.deleteById(params.farmer);
  }
}
