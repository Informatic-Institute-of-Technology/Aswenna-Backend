import { Controller, Post, Body } from '@nestjs/common';
import { LandOwnerService } from './land-owner.service';
import { LandOwnerCreateDto } from './dtos/land-owner.create.dto';

@Controller({ path: 'land-owner', version: '1' })
export class LandOwnerController {
  constructor(private readonly landOwnerService: LandOwnerService) {}

  @Post()
  create(@Body() landOwner: LandOwnerCreateDto) {
    // return this.landOwnerService.create(landOwner);
  }
}
