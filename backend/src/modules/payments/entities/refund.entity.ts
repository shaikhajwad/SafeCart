import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'payment_intent_id' })
  paymentIntentId: string;

  @Column({ name: 'amount_paisa', type: 'bigint' })
  amountPaisa: number;

  @Column()
  reason: string;

  @Column({ default: 'pending' })
  status: string; // pending | processing | completed | failed

  @Column({ nullable: true, name: 'provider_refund_id' })
  providerRefundId: string;

  @Column({ nullable: true, name: 'initiated_by_user_id' })
  initiatedByUserId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
