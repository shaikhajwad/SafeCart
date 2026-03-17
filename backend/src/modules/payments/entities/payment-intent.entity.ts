import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from '../../checkout/entities/order.entity';

export enum PaymentProvider {
  SSLCOMMERZ = 'sslcommerz',
  BKASH = 'bkash',
  PORTWALLET = 'portwallet',
}

export enum PaymentIntentStatus {
  CREATED = 'created',
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  RISK_HOLD = 'risk_hold',
}

@Entity('payment_intents')
@Index(['orderId'])
@Index(['status'])
export class PaymentIntent extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'text', enum: PaymentProvider })
  provider: PaymentProvider;

  @Column({ name: 'provider_ref', type: 'text', nullable: true })
  providerRef: string | null;

  @Column({ type: 'text', enum: PaymentIntentStatus, default: PaymentIntentStatus.CREATED })
  status: PaymentIntentStatus;

  @Column({ name: 'amount_minor', type: 'bigint' })
  amountMinor: number;

  @Column({ type: 'char', length: 3, default: 'BDT' })
  currency: string;

  @Column({ name: 'pay_url', type: 'text', nullable: true })
  payUrl: string | null;

  @Column({ name: 'idempotency_key', type: 'text', unique: true })
  idempotencyKey: string;
}
