import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EscrowService } from '../modules/payments/escrow.service';

@Injectable()
export class EscrowReleaseProcessor {
  private readonly logger = new Logger(EscrowReleaseProcessor.name);

  constructor(private escrowService: EscrowService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async releaseEligibleEscrows(): Promise<void> {
    this.logger.log('Running escrow auto-release job...');
    const dueHolds = await this.escrowService.findDueForRelease();

    for (const hold of dueHolds) {
      try {
        await this.escrowService.releaseHold(hold.orderId);
        this.logger.log(`Released escrow for order ${hold.orderId}`);
      } catch (err) {
        this.logger.error(`Failed to release escrow for order ${hold.orderId}`, err);
      }
    }
  }
}
