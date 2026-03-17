import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from '../../checkout/entities/order.entity';

export enum EscrowStatus {
  HELD = 'held',
  RELEASABLE = 'releasable',
  RELEASED = 'released',
  FROZEN = 'frozen',
  REFUNDED = 'refunded',
}

@Entity('escrow_holds')
export class EscrowHold extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid', unique: true })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'text', enum: EscrowStatus, default: EscrowStatus.HELD })
  status: EscrowStatus;

  @Column({ name: 'release_eligible_at', type: 'timestamptz', nullable: true })
  releaseEligibleAt: Date | null;

  @Column({ name: 'released_at', type: 'timestamptz', nullable: true })
  releasedAt: Date | null;

  @Column({ name: 'policy_snapshot', type: 'jsonb' })
  policySnapshot: Record<string, unknown>;
}
