import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { ShipmentEvent } from './entities/shipment-event.entity';
import { BookShipmentDto } from './dto/book-shipment.dto';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';
import { PathaoAdapter } from './adapters/pathao/pathao.adapter';
import { PaperflyAdapter } from './adapters/paperfly/paperfly.adapter';
import { RedxAdapter } from './adapters/redx/redx.adapter';
import { EcourierAdapter } from './adapters/ecourier/ecourier.adapter';

@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
    @InjectRepository(ShipmentEvent) private eventRepo: Repository<ShipmentEvent>,
    private ordersService: OrdersService,
    private pathaoAdapter: PathaoAdapter,
    private paperflyAdapter: PaperflyAdapter,
    private redxAdapter: RedxAdapter,
    private ecourierAdapter: EcourierAdapter,
  ) {}

  async getQuotes(orderId: string): Promise<{ provider: string; chargePaisa: number; estimatedDays: number }[]> {
    const order = await this.ordersService.findById(orderId);
    const quotes: { provider: string; chargePaisa: number; estimatedDays: number }[] = [];

    // Query each courier for live rates
    try {
      try {
        const pathaoQuote = await this.pathaoAdapter.getRate(order.district);
        quotes.push({
          provider: 'pathao',
          chargePaisa: pathaoQuote.chargePaisa,
          estimatedDays: pathaoQuote.estimatedDays,
        });
      } catch (err) {
        // Fallback to default rate
        quotes.push({ provider: 'pathao', chargePaisa: 8000, estimatedDays: 2 });
      }

      try {
        const paperflyQuote = await this.paperflyAdapter.getRate(order.district);
        quotes.push({
          provider: 'paperfly',
          chargePaisa: paperflyQuote.chargePaisa,
          estimatedDays: paperflyQuote.estimatedDays,
        });
      } catch (err) {
        quotes.push({ provider: 'paperfly', chargePaisa: 9000, estimatedDays: 3 });
      }

      try {
        const redxQuote = await this.redxAdapter.getRate(order.district);
        quotes.push({
          provider: 'redx',
          chargePaisa: redxQuote.chargePaisa,
          estimatedDays: redxQuote.estimatedDays,
        });
      } catch (err) {
        quotes.push({ provider: 'redx', chargePaisa: 7500, estimatedDays: 2 });
      }

      try {
        const ecourierQuote = await this.ecourierAdapter.getRate(order.district);
        quotes.push({
          provider: 'ecourier',
          chargePaisa: ecourierQuote.chargePaisa,
          estimatedDays: ecourierQuote.estimatedDays,
        });
      } catch (err) {
        quotes.push({ provider: 'ecourier', chargePaisa: 10000, estimatedDays: 3 });
      }
    } catch (err) {
      // If all queries fail, return fallback quotes
      return [
        { provider: 'pathao', chargePaisa: 8000, estimatedDays: 2 },
        { provider: 'paperfly', chargePaisa: 9000, estimatedDays: 3 },
        { provider: 'redx', chargePaisa: 7500, estimatedDays: 2 },
        { provider: 'ecourier', chargePaisa: 10000, estimatedDays: 3 },
      ];
    }

    return quotes;
  }

  async bookShipment(orderId: string, dto: BookShipmentDto): Promise<Shipment> {
    const order = await this.ordersService.findById(orderId);

    let consignmentId: string | undefined;
    let trackingNumber: string | undefined;

    try {
      if (dto.provider === 'pathao') {
        const result = await this.pathaoAdapter.createOrder(order);
        consignmentId = result.consignmentId;
      } else if (dto.provider === 'paperfly') {
        const result = await this.paperflyAdapter.createShipment(order);
        trackingNumber = result.trackingNumber;
      } else if (dto.provider === 'redx') {
        const result = await this.redxAdapter.createParcel(order);
        trackingNumber = result.trackingId;
      } else if (dto.provider === 'ecourier') {
        const result = await this.ecourierAdapter.createParcel(order);
        trackingNumber = result.trackingCode;
      } else {
        throw new BadRequestException({ error: { code: 'INVALID_PROVIDER', message: 'Unknown courier provider' } });
      }
    } catch (err) {
      // Log and rethrow; in production implement retry/fallback
      throw err;
    }

    const shipment = this.shipmentRepo.create({
      orderId,
      provider: dto.provider,
      consignmentId,
      trackingNumber,
      status: 'booked',
      chargePaisa: dto.chargePaisa ?? 0,
    });
    await this.shipmentRepo.save(shipment);

    await this.ordersService.advanceStatus(orderId, OrderStatus.SHIPMENT_BOOKED);

    return shipment;
  }

  async getShipment(orderId: string): Promise<Shipment | null> {
    return this.shipmentRepo.findOne({
      where: { orderId },
      relations: ['events'],
    });
  }

  async track(shipmentId: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
      relations: ['events'],
    });
    if (!shipment) {
      throw new NotFoundException({ error: { code: 'SHIPMENT_NOT_FOUND', message: 'Shipment not found' } });
    }
    return shipment;
  }

  async handlePathaoWebhook(payload: Record<string, unknown>): Promise<void> {
    const consignmentId = payload['consignment_id'] as string;
    const shipment = await this.shipmentRepo.findOne({ where: { consignmentId } });
    if (!shipment) return;

    const event = this.eventRepo.create({
      shipmentId: shipment.id,
      status: payload['order_status'] as string,
      description: payload['activity_hub'] as string,
      eventTime: new Date(payload['updated_at'] as string),
      raw: payload,
    });
    await this.eventRepo.save(event);

    if (payload['order_status'] === 'Delivered') {
      shipment.status = 'delivered';
      shipment.deliveredAt = new Date();
      await this.shipmentRepo.save(shipment);
      await this.ordersService.advanceStatus(shipment.orderId, OrderStatus.DELIVERED);
    }
  }
}
