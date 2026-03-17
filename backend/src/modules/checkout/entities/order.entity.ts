import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Org } from '../../orgs/entities/org.entity';
import { User } from '../../identity/entities/user.entity';
import { CheckoutSession } from './checkout-session.entity';
import { OrderItem } from './order-item.entity';
import { OrderEvent } from './order-event.entity';

export enum OrderStatus {
  LINK_CREATED = 'LINK_CREATED',
  CHECKOUT_STARTED = 'CHECKOUT_STARTED',
  ORDER_CREATED = 'ORDER_CREATED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  HANDOVER_PENDING = 'HANDOVER_PENDING',
  SHIPMENT_BOOKED = 'SHIPMENT_BOOKED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  DISPUTE_WINDOW = 'DISPUTE_WINDOW',
  DISPUTE_OPEN = 'DISPUTE_OPEN',
  RETURN_IN_TRANSIT = 'RETURN_IN_TRANSIT',
  REFUNDED = 'REFUNDED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Valid state transitions (order state machine)
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.LINK_CREATED]: [OrderStatus.CHECKOUT_STARTED],
  [OrderStatus.CHECKOUT_STARTED]: [OrderStatus.ORDER_CREATED],
  [OrderStatus.ORDER_CREATED]: [OrderStatus.PAYMENT_PENDING],
  [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED],
  [OrderStatus.PAID]: [OrderStatus.HANDOVER_PENDING],
  [OrderStatus.PAYMENT_FAILED]: [OrderStatus.CANCELLED, OrderStatus.PAYMENT_PENDING],
  [OrderStatus.HANDOVER_PENDING]: [OrderStatus.SHIPMENT_BOOKED],
  [OrderStatus.SHIPMENT_BOOKED]: [OrderStatus.IN_TRANSIT],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.DISPUTE_WINDOW],
  [OrderStatus.DISPUTE_WINDOW]: [OrderStatus.COMPLETED, OrderStatus.DISPUTE_OPEN],
  [OrderStatus.DISPUTE_OPEN]: [OrderStatus.RETURN_IN_TRANSIT, OrderStatus.REFUNDED, OrderStatus.COMPLETED],
  [OrderStatus.RETURN_IN_TRANSIT]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

@Entity('orders')
@Index(['orgId', 'createdAt'])
@Index(['status'])
@Index(['buyerPhone'])
export class Order extends BaseEntity {
  @Column({ name: 'org_id', type: 'uuid' })
  orgId: string;

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'org_id' })
  org: Org;

  @Column({ name: 'checkout_session_id', type: 'uuid', unique: true, nullable: true })
  checkoutSessionId: string | null;

  @OneToOne(() => CheckoutSession, (cs) => cs.order)
  @JoinColumn({ name: 'checkout_session_id' })
  checkoutSession: CheckoutSession | null;

  @Column({ name: 'buyer_user_id', type: 'uuid', nullable: true })
  buyerUserId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'buyer_user_id' })
  buyerUser: User | null;

  @Column({ name: 'buyer_phone', type: 'text' })
  buyerPhone: string;

  @Column({ name: 'buyer_name', type: 'text', nullable: true })
  buyerName: string | null;

  @Column({ name: 'buyer_access_code', type: 'text' })
  buyerAccessCode: string;

  @Column({ name: 'shipping_address', type: 'jsonb' })
  shippingAddress: Record<string, unknown>;

  @Column({ name: 'subtotal_minor', type: 'bigint' })
  subtotalMinor: number;

  @Column({ name: 'shipping_minor', type: 'bigint' })
  shippingMinor: number;

  @Column({ name: 'discount_minor', type: 'bigint', default: 0 })
  discountMinor: number;

  @Column({ name: 'total_minor', type: 'bigint' })
  totalMinor: number;

  @Column({ type: 'char', length: 3, default: 'BDT' })
  currency: string;

  @Column({ type: 'text', enum: OrderStatus, default: OrderStatus.ORDER_CREATED })
  status: OrderStatus;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'handover_due_at', type: 'timestamptz', nullable: true })
  handoverDueAt: Date | null;

  @Column({ name: 'delivery_due_at', type: 'timestamptz', nullable: true })
  deliveryDueAt: Date | null;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @OneToMany(() => OrderEvent, (event) => event.order)
  events: OrderEvent[];
}
