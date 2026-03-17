import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { CheckoutSession, CheckoutSessionStatus } from './entities/checkout-session.entity';
import { Order, OrderStatus, canTransition } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderEvent } from './entities/order-event.entity';
import { OrgsService } from '../orgs/orgs.service';
import { CatalogService } from '../catalog/catalog.service';

export interface CreateCheckoutSessionDto {
  org_id: string;
  items: Array<{ product_id: string; variant_id?: string; qty: number }>;
  expires_in_hours?: number;
}

export interface ConvertCheckoutDto {
  buyer_phone: string;
  buyer_name?: string;
  shipping_address: {
    line1: string;
    city: string;
    postcode?: string;
    district?: string;
  };
  consents: {
    personal_data: boolean;
    terms_accepted: boolean;
  };
}

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @InjectRepository(CheckoutSession)
    private readonly sessionRepo: Repository<CheckoutSession>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(OrderEvent)
    private readonly orderEventRepo: Repository<OrderEvent>,
    private readonly orgsService: OrgsService,
    private readonly catalogService: CatalogService,
    private readonly dataSource: DataSource,
  ) {}

  async createSession(
    userId: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<{ checkout_url: string; expires_at: Date }> {
    await this.orgsService.assertMember(dto.org_id, userId);

    // Build cart snapshot from product/variant data
    const cartItems = [];
    let subtotalMinor = 0;

    for (const item of dto.items) {
      if (item.qty < 1) {
        throw new BadRequestException({ error: { code: 'invalid_item', message: 'qty must be >= 1' } });
      }

      const product = await this.catalogService.getProduct(item.product_id);
      if (!product) {
        throw new BadRequestException({ error: { code: 'invalid_item', message: `Product ${item.product_id} not found` } });
      }

      const variant = item.variant_id
        ? product.variants.find((v) => v.id === item.variant_id)
        : product.variants[0];

      if (!variant) {
        throw new BadRequestException({ error: { code: 'invalid_item', message: 'Variant not found' } });
      }

      if (variant.stockQty !== null && variant.stockQty < item.qty) {
        throw new BadRequestException({ error: { code: 'out_of_stock', message: `Insufficient stock for ${product.title}` } });
      }

      const lineTotal = variant.priceMinor * item.qty;
      subtotalMinor += lineTotal;

      cartItems.push({
        product_id: product.id,
        variant_id: variant.id,
        title: `${product.title} - ${variant.variantName}`,
        unit_price_minor: variant.priceMinor,
        qty: item.qty,
        line_total_minor: lineTotal,
        currency: variant.currency,
      });
    }

    const expiresInHours = dto.expires_in_hours || 48;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const sessionToken = `cs_${randomBytes(24).toString('hex')}`;

    const session = this.sessionRepo.create({
      orgId: dto.org_id,
      createdBy: userId,
      sessionToken,
      status: CheckoutSessionStatus.ACTIVE,
      cartSnapshot: { items: cartItems, subtotal_minor: subtotalMinor },
      expiresAt,
    });
    await this.sessionRepo.save(session);

    // TODO: make checkout_base_url configurable
    const checkoutUrl = `${process.env.CHECKOUT_BASE_URL || 'http://localhost:3001'}/c/${sessionToken}`;

    return { checkout_url: checkoutUrl, expires_at: expiresAt };
  }

  async getSession(
    token: string,
  ): Promise<{ org: Record<string, unknown>; cart_snapshot: Record<string, unknown>; compliance: Record<string, unknown> }> {
    const session = await this.sessionRepo.findOne({
      where: { sessionToken: token },
      relations: ['org', 'org.complianceProfile'],
    });

    if (!session) {
      throw new NotFoundException({ error: { code: 'not_found', message: 'Checkout session not found' } });
    }

    if (session.status === CheckoutSessionStatus.EXPIRED || session.expiresAt < new Date()) {
      if (session.status === CheckoutSessionStatus.ACTIVE) {
        await this.sessionRepo.update({ id: session.id }, { status: CheckoutSessionStatus.EXPIRED });
      }
      throw new BadRequestException({ error: { code: 'expired', message: 'Checkout session has expired' } });
    }

    const org = session.org;
    const compliance = org.complianceProfile;

    return {
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        verified_status: org.verifiedStatus,
        support_phone: org.supportPhone,
        support_email: org.supportEmail,
        return_policy: org.returnPolicy,
      },
      cart_snapshot: session.cartSnapshot,
      compliance: compliance
        ? {
            trade_license_no: compliance.tradeLicenseNo,
            vat_reg_no: compliance.vatRegNo,
            tin_no: compliance.tinNo,
            ubid: compliance.ubid,
            pra_no: compliance.praNo,
            business_address: compliance.businessAddress,
          }
        : {},
    };
  }

  async convertSession(
    token: string,
    dto: ConvertCheckoutDto,
  ): Promise<{ order_id: string; status: string; buyer_access_code: string }> {
    if (!dto.consents.personal_data || !dto.consents.terms_accepted) {
      throw new BadRequestException({ error: { code: 'missing_consent', message: 'Buyer must consent to terms and personal data collection' } });
    }

    const session = await this.sessionRepo.findOne({
      where: { sessionToken: token },
      relations: ['org'],
    });

    if (!session) {
      throw new NotFoundException({ error: { code: 'not_found', message: 'Checkout session not found' } });
    }

    if (session.status !== CheckoutSessionStatus.ACTIVE || session.expiresAt < new Date()) {
      throw new BadRequestException({ error: { code: 'expired', message: 'Checkout session has expired or already converted' } });
    }

    const snapshot = session.cartSnapshot as {
      items: Array<{
        product_id: string;
        variant_id: string;
        title: string;
        unit_price_minor: number;
        qty: number;
        line_total_minor: number;
      }>;
      subtotal_minor: number;
    };

    const subtotalMinor = snapshot.subtotal_minor;
    const shippingMinor = 0; // TODO: compute from shipping rules
    const discountMinor = 0;
    const totalMinor = subtotalMinor + shippingMinor - discountMinor;

    const buyerAccessCode = randomBytes(16).toString('hex');

    return await this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        orgId: session.orgId,
        checkoutSessionId: session.id,
        buyerPhone: dto.buyer_phone,
        buyerName: dto.buyer_name || null,
        buyerAccessCode,
        shippingAddress: dto.shipping_address as unknown as Record<string, unknown>,
        subtotalMinor,
        shippingMinor,
        discountMinor,
        totalMinor,
        currency: 'BDT',
        status: OrderStatus.PAYMENT_PENDING,
      });
      await manager.save(order);

      // Create order items
      const items = snapshot.items.map((item) =>
        manager.create(OrderItem, {
          orderId: order.id,
          productId: item.product_id || null,
          variantId: item.variant_id || null,
          title: item.title,
          unitPriceMinor: item.unit_price_minor,
          qty: item.qty,
          lineTotalMinor: item.line_total_minor,
        }),
      );
      await manager.save(items);

      // Append audit event
      const event = manager.create(OrderEvent, {
        orderId: order.id,
        eventType: 'ORDER_CREATED',
        payload: {
          buyer_phone: dto.buyer_phone,
          consents: dto.consents,
          total_minor: totalMinor,
        },
      });
      await manager.save(event);

      // Mark session converted
      await manager.update(CheckoutSession, { id: session.id }, { status: CheckoutSessionStatus.CONVERTED });

      return {
        order_id: order.id,
        status: order.status,
        buyer_access_code: buyerAccessCode,
      };
    });
  }

  async getOrderPublic(
    orderId: string,
    accessCode: string,
  ): Promise<{
    order_id: string;
    status: string;
    timeline: Array<{ event_type: string; created_at: Date }>;
  }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['events'],
    });

    if (!order) {
      throw new NotFoundException({ error: { code: 'not_found', message: 'Order not found' } });
    }

    if (order.buyerAccessCode !== accessCode) {
      throw new BadRequestException({ error: { code: 'forbidden', message: 'Invalid access code' } });
    }

    return {
      order_id: order.id,
      status: order.status,
      timeline: (order.events || []).map((e) => ({
        event_type: e.eventType,
        created_at: e.createdAt,
      })),
    };
  }

  async listOrders(
    orgId: string,
    userId: string,
    status?: string,
    cursor?: string,
    limit = 20,
  ): Promise<{ items: Order[]; next_cursor: string | null }> {
    await this.orgsService.assertMember(orgId, userId);

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .where('o.org_id = :orgId', { orgId })
      .orderBy('o.created_at', 'DESC')
      .take(limit + 1);

    if (status) {
      qb.andWhere('o.status = :status', { status });
    }

    if (cursor) {
      qb.andWhere('o.created_at < (SELECT created_at FROM orders WHERE id = :cursor)', { cursor });
    }

    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    return {
      items,
      next_cursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  }

  async getOrderDetail(orgId: string, orderId: string, userId: string): Promise<Order> {
    await this.orgsService.assertMember(orgId, userId);

    const order = await this.orderRepo.findOne({
      where: { id: orderId, orgId },
      relations: ['items', 'events'],
    });

    if (!order) {
      throw new NotFoundException({ error: { code: 'not_found', message: 'Order not found' } });
    }

    return order;
  }

  async transitionOrder(
    orderId: string,
    toStatus: OrderStatus,
    eventPayload: Record<string, unknown> = {},
  ): Promise<Order> {
    const order = await this.orderRepo.findOneOrFail({ where: { id: orderId } });

    if (!canTransition(order.status, toStatus)) {
      throw new BadRequestException({
        error: {
          code: 'invalid_state',
          message: `Cannot transition from ${order.status} to ${toStatus}`,
        },
      });
    }

    return await this.dataSource.transaction(async (manager) => {
      const prevStatus = order.status;
      order.status = toStatus;

      // Set SLA timers on PAID
      if (toStatus === OrderStatus.PAID) {
        order.paidAt = new Date();
        order.handoverDueAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      }

      await manager.save(order);

      const event = manager.create(OrderEvent, {
        orderId: order.id,
        eventType: `STATUS_CHANGED`,
        payload: {
          from: prevStatus,
          to: toStatus,
          ...eventPayload,
        },
      });
      await manager.save(event);

      // Auto-transition PAID → HANDOVER_PENDING immediately
      if (toStatus === OrderStatus.PAID) {
        order.status = OrderStatus.HANDOVER_PENDING;
        await manager.save(order);
        const handoverEvent = manager.create(OrderEvent, {
          orderId: order.id,
          eventType: `STATUS_CHANGED`,
          payload: { from: OrderStatus.PAID, to: OrderStatus.HANDOVER_PENDING },
        });
        await manager.save(handoverEvent);
      }

      return order;
    });
  }
}
