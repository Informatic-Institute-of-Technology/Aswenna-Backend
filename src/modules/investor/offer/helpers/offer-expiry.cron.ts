import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { CronJob } from 'cron';
import { OfferService } from '../offer.service';

@Injectable()
export class OfferExpiryCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OfferExpiryCron.name);
  private job: CronJob;

  constructor(private readonly offerService: OfferService) {}

  onModuleInit(): void {
    this.job = new CronJob('*/1 * * * *', async () => {
      const expiredCount = await this.offerService.expireOffers();

      if (expiredCount > 0) {
        this.logger.log(`Auto-expired ${expiredCount} offer(s)`);
      }
    });

    this.job.start();
    this.logger.log('Offer expiry cron started');
  }

  onModuleDestroy(): void {
    if (this.job) {
      void this.job.stop();
    }
  }
}
