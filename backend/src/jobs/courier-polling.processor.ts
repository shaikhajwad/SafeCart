import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Shipment } from '../modules/logistics/entities/shipment.entity';
import { LogisticsService } from '../modules/logistics/logistics.service';

@Injectable()
export class CourierPollingProcessor {
  private readonly logger = new Logger(CourierPollingProcessor.name);

  constructor(
    @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
    private logisticsService: LogisticsService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async pollShipments(): Promise<void> {
    this.logger.log('Polling courier tracking statuses...');
    const activeShipments = await this.shipmentRepo.find({
      where: { status: 'booked' },
    });

    for (const shipment of activeShipments) {
      try {
        // Provider-specific polling would go here
        this.logger.debug(`Polling status for shipment ${shipment.id} (${shipment.provider})`);
      } catch (err) {
        this.logger.error(`Failed to poll shipment ${shipment.id}`, err);
      }
    }
  }
}
