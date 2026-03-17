import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Order, OrderStatus } from '../modules/orders/entities/order.entity';

/** 48-hour courier handover SLA enforcer */
@Injectable()
export class SlaEnforcerProcessor {
  private readonly logger = new Logger(SlaEnforcerProcessor.name);
  private readonly SLA_HOURS = 48;

  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkSlaBreaches(): Promise<void> {
    this.logger.log('Checking SLA breaches...');

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - this.SLA_HOURS);

    const breachedOrders = await this.orderRepo.find({
      where: {
        status: OrderStatus.PAID,
        updatedAt: LessThan(cutoff),
      },
    });

    for (const order of breachedOrders) {
      this.logger.warn(
        `SLA BREACH: Order ${order.orderRef} has been in PAID status for >48h without shipment booking`,
      );
      // In production: send alert to seller, notify admin, potentially auto-escalate
    }
  }
}
