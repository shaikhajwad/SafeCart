import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Order, OrderStatus } from '../modules/orders/entities/order.entity';
import { NotificationsService } from '../modules/notifications/notifications.service';

/** 48-hour courier handover SLA enforcer */
@Injectable()
export class SlaEnforcerProcessor {
  private readonly logger = new Logger(SlaEnforcerProcessor.name);
  private readonly SLA_HOURS = 48;

  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private notificationsService: NotificationsService,
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
        const message = `Order ${order.orderRef} has been in PAID status for ${hours}+ hours without shipment booking`;

        // Send alert to seller
        try {
          await this.notificationsService.sendAlert(order.orgId, {
            type: 'SLA_BREACH',
            title: 'Shipment SLA Breach',
            message,
            orderId: order.id,
            orderRef: order.orderRef,
          });
          this.logger.log(`Sent SLA breach alert for order ${order.orderRef} to seller`);
        } catch (err) {
          this.logger.error(`Failed to send SLA breach alert for order ${order.orderRef}`, err);
        }

        // Log for admin review
        this.logger.warn(`SLA BREACH: ${message}`);
      } catch (err) {
        this.logger.error(`Error processing SLA breach for order ${order.id}`, err);
      }
    }
  }
}
