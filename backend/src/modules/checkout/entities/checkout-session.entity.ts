import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Org } from '../../orgs/entities/org.entity';
import { User } from '../../identity/entities/user.entity';
import { Order } from './order.entity';

export enum CheckoutSessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CONVERTED = 'converted',
}

@Entity('checkout_sessions')
@Index(['orgId', 'status'])
@Index(['expiresAt'])
export class CheckoutSession extends BaseEntity {
  @Column({ name: 'org_id', type: 'uuid' })
  orgId: string;

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'org_id' })
  org: Org;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @Index({ unique: true })
  @Column({ name: 'session_token', type: 'text', unique: true })
  sessionToken: string;

  @Column({ type: 'text', enum: CheckoutSessionStatus, default: CheckoutSessionStatus.ACTIVE })
  status: CheckoutSessionStatus;

  @Column({ name: 'cart_snapshot', type: 'jsonb' })
  cartSnapshot: Record<string, unknown>;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @OneToOne(() => Order, (order) => order.checkoutSession)
  order: Order;
}
