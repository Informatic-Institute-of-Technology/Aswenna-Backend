import { Controller, Post, Body } from '@nestjs/common';
import { FarmerService } from './farmer.service';
import { Public } from 'src/core/decorators/public.decorator';
import { FarmerCreateDto } from './dtos/create-farmer.dto';

@Controller({ path: 'farmer', version: '1' })
export class FarmerController {
  constructor(private readonly farmerService: FarmerService) {}

  @Post()
  @Public()
  create(@Body() farmer: FarmerCreateDto) {
    return this.farmerService.create(farmer);
  }
}
