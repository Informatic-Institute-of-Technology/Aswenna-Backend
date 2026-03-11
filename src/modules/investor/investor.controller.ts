import { Controller } from '@nestjs/common';
import { InvestorService } from './investor.service';

@Controller({ path: 'investor', version: '1' })
export class InvestorController {
  constructor(private readonly investorService: InvestorService) {}
}
