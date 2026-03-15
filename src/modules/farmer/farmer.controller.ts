import {
  Controller,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { FarmerService } from './farmer.service';
import { FarmerUpdateDto } from './dtos/farmer.update.dto';
import { FarmerParamsDto, FarmerQueryDto } from './dtos/farmer.query.dto';
import { FarmerCreateI } from './farmer.types';

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

