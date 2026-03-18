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

    this.logger.log(`Found ${breachedOrders.length} orders with SLA breaches`);

    for (const order of breachedOrders) {
      try {
        const hours = Math.floor((Date.now() - new Date(order.updatedAt).getTime()) / 3600000);
        this.logger.warn(
          `SLA BREACH: Order ${order.orderRef} in PAID status for ${hours}+ hours without shipment booking`,
        );
        // TODO: Send alert to seller via notifications service
        // TODO: Potentially auto-escalate to admin or auto-hold payment
      } catch (err) {
        this.logger.error(`Error processing SLA breach for order ${order.id}`, err);
      }
    }
  }
}
