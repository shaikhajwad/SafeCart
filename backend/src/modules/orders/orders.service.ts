import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Order, OrderStatus, ORDER_TRANSITIONS } from './entities/order.entity';
import { CheckoutService } from '../checkout/checkout.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private checkoutService: CheckoutService,
  ) {}

  private generateOrderRef(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = randomBytes(3).toString('hex').toUpperCase();
    return `SC-${ts}-${rand}`;
  }

  async createFromCheckout(token: string, dto: CreateOrderDto, buyerUserId?: string): Promise<Order> {
    const session = await this.checkoutService.findByToken(token);

    const subtotalPaisa = Number(session.lockedPricePaisa) * session.quantity;
    const order = this.orderRepo.create({
      orderRef: this.generateOrderRef(),
      orgId: session.orgId,
      checkoutSessionId: session.id,
      buyerUserId,
      accessCode: randomBytes(4).toString('hex').toUpperCase(),
      status: OrderStatus.DRAFT,
      productId: session.productId,
      variantId: session.variantId,
      quantity: session.quantity,
      unitPricePaisa: Number(session.lockedPricePaisa),
      subtotalPaisa,
      shippingPaisa: 0,
      totalPaisa: subtotalPaisa,
      buyerName: dto.buyerName,
      buyerPhone: dto.buyerPhone,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      district: dto.district,
      thana: dto.thana,
      postalCode: dto.postalCode,
      specialInstructions: dto.specialInstructions,
    });
    return this.orderRepo.save(order);
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }
    return order;
  }

  async findByIdWithAccess(id: string, accessCode?: string, userId?: string): Promise<Order> {
    const order = await this.findById(id);
    if (userId && order.buyerUserId === userId) return order;
    if (accessCode && order.accessCode === accessCode) return order;
    throw new ForbiddenException({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
  }

  async advanceStatus(id: string, newStatus: OrderStatus): Promise<Order> {
    const order = await this.findById(id);
    const currentStatus = order.status as OrderStatus;
    const allowed = ORDER_TRANSITIONS[currentStatus] ?? [];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from ${currentStatus} to ${newStatus}`,
        },
      });
    }

    order.status = newStatus;
    return this.orderRepo.save(order);
  }

  async findByOrg(orgId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({ order: { createdAt: 'DESC' } });
  }

  async trackOrder(id: string, accessCode?: string): Promise<Partial<Order>> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }
    if (accessCode && order.accessCode !== accessCode) {
      throw new ForbiddenException({ error: { code: 'FORBIDDEN', message: 'Invalid access code' } });
    }
    // Return safe public fields
    return {
      id: order.id,
      orderRef: order.orderRef,
      status: order.status,
      buyerName: order.buyerName,
      district: order.district,
      thana: order.thana,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
