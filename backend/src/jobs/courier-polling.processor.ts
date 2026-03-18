import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from '../modules/logistics/entities/shipment.entity';
import { ShipmentEvent } from '../modules/logistics/entities/shipment-event.entity';
import { LogisticsService } from '../modules/logistics/logistics.service';
import { PathaoAdapter } from '../modules/logistics/adapters/pathao/pathao.adapter';
import { PaperflyAdapter } from '../modules/logistics/adapters/paperfly/paperfly.adapter';
import { RedxAdapter } from '../modules/logistics/adapters/redx/redx.adapter';
import { EcourierAdapter } from '../modules/logistics/adapters/ecourier/ecourier.adapter';

@Injectable()
export class CourierPollingProcessor {
  private readonly logger = new Logger(CourierPollingProcessor.name);

  constructor(
    @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
    @InjectRepository(ShipmentEvent) private eventRepo: Repository<ShipmentEvent>,
    private logisticsService: LogisticsService,
    private pathaoAdapter: PathaoAdapter,
    private paperflyAdapter: PaperflyAdapter,
    private redxAdapter: RedxAdapter,
    private ecourierAdapter: EcourierAdapter,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async pollShipments(): Promise<void> {
    this.logger.log('Polling courier tracking statuses...');
    
    const activeShipments = await this.shipmentRepo.find({
      where: { status: 'booked' },
      relations: ['events'],
    });

    this.logger.log(`Found ${activeShipments.length} active shipments to poll`);

    for (const shipment of activeShipments) {
      try {
        let trackingData: { status: string; events: any[] } | null = null;

        if (shipment.provider === 'pathao' && shipment.consignmentId) {
          try {
            trackingData = await this.pathaoAdapter.trackConsignment(shipment.consignmentId);
            this.logger.debug(`[PATHAO] Polled shipment ${shipment.id}: status=${trackingData?.status}`);
          } catch (err) {
            this.logger.error(`[PATHAO] Failed to poll shipment ${shipment.id}`, err);
          }
        } else if (shipment.provider === 'paperfly' && shipment.trackingNumber) {
          try {
            trackingData = await this.paperflyAdapter.trackShipment(shipment.trackingNumber);
            this.logger.debug(`[PAPERFLY] Polled shipment ${shipment.id}: status=${trackingData?.status}`);
          } catch (err) {
            this.logger.error(`[PAPERFLY] Failed to poll shipment ${shipment.id}`, err);
          }
        } else if (shipment.provider === 'redx' && shipment.trackingNumber) {
          try {
            trackingData = await this.redxAdapter.trackParcel(shipment.trackingNumber);
            this.logger.debug(`[REDX] Polled shipment ${shipment.id}: status=${trackingData?.status}`);
          } catch (err) {
            this.logger.error(`[REDX] Failed to poll shipment ${shipment.id}`, err);
          }
        } else if (shipment.provider === 'ecourier' && shipment.trackingNumber) {
          try {
            trackingData = await this.ecourierAdapter.trackParcel(shipment.trackingNumber);
            this.logger.debug(`[ECOURIER] Polled shipment ${shipment.id}: status=${trackingData?.status}`);
          } catch (err) {
            this.logger.error(`[ECOURIER] Failed to poll shipment ${shipment.id}`, err);
          }
        }

        // Update shipment and create events if tracking data was received
        if (trackingData) {
          shipment.status = trackingData.status?.toLowerCase() || shipment.status;
          await this.shipmentRepo.save(shipment);

          // Create event records if new events are available
          if (trackingData.events && Array.isArray(trackingData.events)) {
            for (const event of trackingData.events) {
              const existingEvent = await this.eventRepo.findOne({
                where: {
                  shipmentId: shipment.id,
                  status: event.status,
                  eventTime: event.eventTime,
                },
              });

              if (!existingEvent) {
                await this.eventRepo.save(
                  this.eventRepo.create({
                    shipmentId: shipment.id,
                    status: event.status,
                    description: event.description,
                    location: event.location,
                    eventTime: new Date(event.eventTime),
                  }),
                );
                this.logger.log(`Created tracking event for shipment ${shipment.id}: ${event.status}`);
              }
            }
          }
        }
      } catch (err) {
        this.logger.error(`Failed to poll shipment ${shipment.id}`, err);
      }
    }
  }
}
