import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PaymentIntent } from './payment-intent.entity';

export enum RefundStatus {
  REQUESTED = 'requested',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  MANUAL_REQUIRED = 'manual_required',
}

@Entity('refunds')
@Index(['paymentIntentId', 'status'])
export class Refund extends BaseEntity {
  @Column({ name: 'payment_intent_id', type: 'uuid' })
  paymentIntentId: string;

  @ManyToOne(() => PaymentIntent)
  @JoinColumn({ name: 'payment_intent_id' })
  paymentIntent: PaymentIntent;

  @Column({ name: 'amount_minor', type: 'bigint' })
  amountMinor: number;

  @Column({ type: 'text', enum: RefundStatus, default: RefundStatus.REQUESTED })
  status: RefundStatus;

  @Column({ name: 'provider_ref', type: 'text', nullable: true })
  providerRef: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;
}
