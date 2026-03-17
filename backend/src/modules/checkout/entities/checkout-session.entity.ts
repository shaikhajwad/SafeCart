import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('checkout_sessions')
export class CheckoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Public-facing short token for the checkout URL */
  @Column({ unique: true })
  token: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ nullable: true, name: 'variant_id' })
  variantId: string;

  @Column({ default: 1 })
  quantity: number;

  /** Locked price in paisa at session creation time */
  @Column({ name: 'locked_price_paisa', type: 'bigint' })
  lockedPricePaisa: number;

  @Column({ nullable: true, name: 'custom_title' })
  customTitle: string;

  @Column({ nullable: true, name: 'success_url' })
  successUrl: string;

  @Column({ nullable: true, name: 'cancel_url' })
  cancelUrl: string;

  @Column({ nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @Column({ default: 'active' })
  status: string; // active | used | expired

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
