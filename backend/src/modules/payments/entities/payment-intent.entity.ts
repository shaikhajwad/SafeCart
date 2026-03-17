import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payment_intents')
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column()
  provider: string; // sslcommerz | bkash

  @Column({ default: 'pending' })
  status: string; // pending | processing | succeeded | failed | refunded

  /** Amount to charge in paisa */
  @Column({ name: 'amount_paisa', type: 'bigint' })
  amountPaisa: number;

  /** Provider's session/payment ID */
  @Column({ nullable: true, name: 'provider_ref' })
  providerRef: string;

  /** Provider payment URL returned to buyer */
  @Column({ nullable: true, name: 'pay_url', length: 1000 })
  payUrl: string;

  /** Raw IPN/webhook payload for audit */
  @Column({ nullable: true, name: 'raw_ipn', type: 'jsonb' })
  rawIpn: Record<string, unknown>;

  @Column({ nullable: true, name: 'idempotency_key' })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
