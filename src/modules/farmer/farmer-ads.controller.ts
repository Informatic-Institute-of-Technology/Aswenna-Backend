import { 
  Controller, 
  Post, 
  Body, 
  Query, 
  Get, 
  Param, 
  Patch, 
  Delete 
} from '@nestjs/common';
import { FarmerAdsService } from './farmer-ads.service';
import { CreateFarmerAdDto } from './dtos/create-farmer-ad.dto';
// Assuming you create an UpdateDto, otherwise use Partial<CreateFarmerAdDto>
import { UpdateFarmerAdDto } from './dtos/update-farmer-ad.dto'; 

@Controller({
  path: 'farmer/ads',
  version: '1',
})
export class FarmerAdsController {
  constructor(private readonly service: FarmerAdsService) {}

  
  @Post()
  createAd(
    @Body() dto: CreateFarmerAdDto,
    @Query('userId') userId: string,
  ) {
    return this.service.createFarmerAd(dto, userId);
  }


  @Get()
  getAllAds() {
    return this.service.findAll();
  }

  @Get('user')
  getAdsByUser(@Query('userId') userId: string) {
    return this.service.findByUserId(userId);
  }

  @Get(':id')
  getOneAd(@Param('id') id: string) {
    return this.service.findOne(id);
  }

 
  @Patch(':id')
  updateAd(
    @Param('id') id: string, 
    @Body() dto: UpdateFarmerAdDto
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  removeAd(@Param('id') id: string) {
    return this.service.remove(id);
  }
}