import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Shipment, ShipmentEvent, ShipmentStatus, CourierProvider } from './entities/shipment.entity';
import { Order, OrderStatus } from '../checkout/entities/order.entity';
import { CheckoutService } from '../checkout/checkout.service';
import { PathaoAdapter } from './adapters/pathao/pathao.adapter';
import { PaperflyAdapter } from './adapters/paperfly/paperfly.adapter';
import { EcourierAdapter } from './adapters/ecourier/ecourier.adapter';
import { RedxAdapter } from './adapters/redx/redx.adapter';
import { CourierProviderAdapter, CourierQuoteParams } from './adapters/courier-provider.adapter';

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(ShipmentEvent)
    private readonly shipmentEventRepo: Repository<ShipmentEvent>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly checkoutService: CheckoutService,
    private readonly pathaoAdapter: PathaoAdapter,
    private readonly paperflyAdapter: PaperflyAdapter,
    private readonly ecourierAdapter: EcourierAdapter,
    private readonly redxAdapter: RedxAdapter,
    private readonly dataSource: DataSource,
  ) {}

  private getAdapter(provider: CourierProvider): CourierProviderAdapter {
    switch (provider) {
      case CourierProvider.PATHAO:
        return this.pathaoAdapter;
      case CourierProvider.PAPERFLY:
        return this.paperflyAdapter;
      case CourierProvider.ECOURIER:
        return this.ecourierAdapter;
      case CourierProvider.REDX:
        return this.redxAdapter;
      default:
        throw new BadRequestException({ error: { code: 'provider_unavailable', message: `Courier ${provider} not supported` } });
    }
  }

  async getQuotes(orderId: string): Promise<{ quotes: Array<{ provider: string; fee_minor: number; estimated_days: number }> }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException({ error: { code: 'not_found', message: 'Order not found' } });
    }

    const shippingAddress = order.shippingAddress as { city?: string; district?: string };
    const quoteParams: CourierQuoteParams = {
      orderId,
      originCity: 'Dhaka',
      destinationCity: shippingAddress.city || shippingAddress.district || 'Dhaka',
      weightGrams: 500, // Default weight - seller should specify
      isCod: false, // SafeCart uses prepaid via payment gateway
      codAmountMinor: 0,
    };

    const adapters = [this.pathaoAdapter, this.paperflyAdapter, this.ecourierAdapter];
    const quotes = await Promise.all(
      adapters.map(async (adapter) => {
        try {
          const quote = await adapter.getQuote(quoteParams);
          return quote;
        } catch {
          return null;
        }
      }),
    );

    return {
      quotes: quotes
        .filter(Boolean)
        .map((q) => ({
          provider: q!.provider,
          fee_minor: q!.feeMinor + q!.codFeeMinor,
          estimated_days: q!.estimatedDays,
        })),
    };
  }

  async bookShipment(
    orderId: string,
    userId: string,
    provider: CourierProvider,
    idempotencyKey: string,
  ): Promise<{ shipment_id: string; tracking_id: string; status: string }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['org'],
    });

    if (!order || order.status !== OrderStatus.HANDOVER_PENDING) {
      throw new BadRequestException({ error: { code: 'invalid_state', message: 'Order is not in HANDOVER_PENDING state' } });
    }

    // Idempotency check
    const existing = await this.shipmentRepo.findOne({ where: { idempotencyKey } });
    if (existing) {
      return { shipment_id: existing.id, tracking_id: existing.trackingId || '', status: existing.status };
    }

    const adapter = this.getAdapter(provider);
    const shippingAddress = order.shippingAddress as {
      line1?: string;
      city?: string;
      district?: string;
      postcode?: string;
    };

    const result = await adapter.bookShipment({
      orderId,
      recipientName: order.buyerName || 'Customer',
      recipientPhone: order.buyerPhone,
      recipientAddress: shippingAddress.line1 || '',
      recipientCity: shippingAddress.city || shippingAddress.district || '',
      recipientPostcode: shippingAddress.postcode,
      weightGrams: 500,
      codAmountMinor: 0,
      idempotencyKey,
    });

    const shipment = await this.dataSource.transaction(async (manager) => {
      const s = manager.create(Shipment, {
        orderId,
        provider,
        status: ShipmentStatus.BOOKED,
        trackingId: result.trackingId,
        providerRef: result.providerRef,
        codAmountMinor: 0,
        idempotencyKey,
      });
      await manager.save(s);

      const event = manager.create(ShipmentEvent, {
        shipmentId: s.id,
        eventType: 'SHIPMENT_BOOKED',
        payload: { provider, trackingId: result.trackingId },
      });
      await manager.save(event);

      // Transition order to SHIPMENT_BOOKED
      await this.checkoutService.transitionOrder(orderId, OrderStatus.SHIPMENT_BOOKED, {
        courier_provider: provider,
        tracking_id: result.trackingId,
      });

      return s;
    });

    return {
      shipment_id: shipment.id,
      tracking_id: shipment.trackingId || '',
      status: shipment.status,
    };
  }

  async updateShipmentStatus(
    shipmentId: string,
    status: ShipmentStatus,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    const shipment = await this.shipmentRepo.findOne({ where: { id: shipmentId } });
    if (!shipment) return;

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Shipment, { id: shipmentId }, { status });

      const event = manager.create(ShipmentEvent, {
        shipmentId,
        eventType: `SHIPMENT_${status.toUpperCase()}`,
        payload,
      });
      await manager.save(event);

      // Sync order status
      if (status === ShipmentStatus.IN_TRANSIT) {
        await this.checkoutService.transitionOrder(shipment.orderId, OrderStatus.IN_TRANSIT, payload);
      } else if (status === ShipmentStatus.DELIVERED) {
        await this.checkoutService.transitionOrder(shipment.orderId, OrderStatus.DELIVERED, payload);
        await this.checkoutService.transitionOrder(shipment.orderId, OrderStatus.DISPUTE_WINDOW, payload);
      }
    });
  }

  async trackShipment(shipmentId: string): Promise<Record<string, unknown>> {
    const shipment = await this.shipmentRepo.findOne({ where: { id: shipmentId } });
    if (!shipment || !shipment.trackingId) {
      throw new NotFoundException({ error: { code: 'not_found', message: 'Shipment not found' } });
    }

    const adapter = this.getAdapter(shipment.provider);
    return adapter.trackShipment(shipment.trackingId);
  }

  // SLA enforcement: 48h handover job
  @Cron(CronExpression.EVERY_HOUR)
  async enforceSla(): Promise<void> {
    const overdue = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.status = :status', { status: OrderStatus.HANDOVER_PENDING })
      .andWhere('o.handover_due_at < :now', { now: new Date() })
      .getMany();

    for (const order of overdue) {
      this.logger.warn(`SLA breach: order ${order.id} overdue for handover`);
      // TODO: send notification to seller + admin
    }
  }
}
