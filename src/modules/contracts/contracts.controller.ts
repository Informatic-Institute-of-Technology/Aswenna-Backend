import { Controller, Get, Query } from '@nestjs/common';
import { Auth } from 'src/core/decorators/auth.decorator';
import { UserReal } from 'src/core/decorators/user.decorators';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ContractsService } from './contracts.service';

@Controller({ path: 'contracts', version: '1' })
@Auth()
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  findAll(@UserReal() user: UserReal, @Query() query: PaginationDto) {
    return this.contractsService.findAll(user.user, query);
  }
}
