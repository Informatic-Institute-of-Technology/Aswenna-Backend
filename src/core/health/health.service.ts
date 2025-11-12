import { Injectable } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: MongooseHealthIndicator,
  ) {}

  @HealthCheck()
  check() {
    return this.health.check([
      async () => this.database.pingCheck('mongodb', { timeout: 1500 }),
    ]);
  }
}
