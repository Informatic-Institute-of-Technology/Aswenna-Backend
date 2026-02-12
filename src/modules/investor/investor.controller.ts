import { Controller, Post, Body } from '@nestjs/common';
import { InvestorService } from './investor.service';
import { InvestorCreateDto } from './dtos/create-investor.dto';

@Controller('investors')
export class InvestorController {
  constructor(private readonly investorService: InvestorService) {}

  // @Post()
  // create(@Body() investor: InvestorCreateDto) {
  //   return this.investorService.create(investor);
  // }
}
