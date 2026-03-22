import { Controller, Post, Body } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dtos/create-contract.dto';
import { Auth } from 'src/core/decorators/auth.decorator';
import { UserReal } from 'src/core/decorators/user.decorators';

@Controller({ path: 'contracts', version: '1' })
@Auth()
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  async create(
    @Body() createContractDto: CreateContractDto,
    @UserReal('user') userId: string,
  ) {
    return this.contractsService.create(createContractDto, userId);
  }
}
