import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentIntent } from './payment-intent.entity';

@Entity('payment_txns')
@Unique(['paymentIntentId', 'providerEventId'])
export class PaymentTxn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_intent_id', type: 'uuid' })
  paymentIntentId: string;

  @ManyToOne(() => PaymentIntent)
  @JoinColumn({ name: 'payment_intent_id' })
  paymentIntent: PaymentIntent;

  @Column({ name: 'provider_event_id', type: 'text' })
  providerEventId: string;

  @Column({ name: 'raw_payload', type: 'jsonb' })
  rawPayload: Record<string, unknown>;

  @Column({ name: 'txn_status', type: 'text' })
  txnStatus: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
