import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Auth } from '../decorators/auth.decorator';
import { Public } from '../decorators/public.decorator';

@Controller({ path: 'health' })
@Auth()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  async check() {
    return this.healthService.check();
  }
}
