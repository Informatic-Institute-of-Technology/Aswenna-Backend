import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Body,
  Param,
} from '@nestjs/common';
import { CreateAddsService } from './create-adds.service';
import { CreateAddDto } from './dto/create-add.dto';
import { UpdateAddDto } from './dto/update-add.dto';

@Controller({
  path: 'landowner/ads',
  version: '1',
})
export class CreateAddsController {
  constructor(private readonly service: CreateAddsService) {}

  @Post()
  create(@Body() dto: CreateAddDto) {
    return this.service.createAdd(dto);
  }

  @Patch(':id')
  update(
    @Param('id') adId: string,
    @Body() dto: UpdateAddDto,
  ) {
    return this.service.updateAdd(adId, dto);
  }

  @Delete(':id')
  remove(@Param('id') adId: string) {
    return this.service.deleteAdd(adId);
  }

  @Get()
  getAll() {
    return this.service.getAllAds();
  }
}
