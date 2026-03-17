import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('payment_txns')
export class PaymentTxn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_intent_id' })
  paymentIntentId: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column()
  provider: string;

  /** Provider transaction ID */
  @Column({ nullable: true, name: 'provider_txn_id' })
  providerTxnId: string;

  @Column({ name: 'amount_paisa', type: 'bigint' })
  amountPaisa: number;

  @Column()
  status: string; // success | failed | refunded

  @Column({ nullable: true, type: 'jsonb' })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
