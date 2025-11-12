import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('v1/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    return this.healthService.check();
  }
}
