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
import { User } from '../../identity/entities/user.entity';

export enum DisputeStatus {
  OPEN = 'open',
  EVIDENCE_SUBMITTED = 'evidence_submitted',
  UNDER_REVIEW = 'under_review',
  RESOLVED_REFUND = 'resolved_refund',
  RESOLVED_NO_REFUND = 'resolved_no_refund',
  CLOSED = 'closed',
}

export enum DisputeReason {
  ITEM_NOT_RECEIVED = 'item_not_received',
  WRONG_ITEM = 'wrong_item',
  DAMAGED_ITEM = 'damaged_item',
  SELLER_FRAUD = 'seller_fraud',
  OTHER = 'other',
}

@Entity('disputes')
@Index(['orderId'])
@Index(['status'])
export class Dispute extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid', unique: true })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'opened_by', type: 'uuid' })
  openedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'opened_by' })
  openedByUser: User;

  @Column({ type: 'text', enum: DisputeStatus, default: DisputeStatus.OPEN })
  status: DisputeStatus;

  @Column({ type: 'text', enum: DisputeReason })
  reason: DisputeReason;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy: string | null;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string | null;

  @Column({ name: 'refund_amount_minor', type: 'bigint', nullable: true })
  refundAmountMinor: number | null;

  @OneToMany(() => DisputeEvidence, (e) => e.dispute)
  evidence: DisputeEvidence[];
}

@Entity('dispute_evidence')
@Index(['disputeId'])
export class DisputeEvidence extends BaseEntity {
  @Column({ name: 'dispute_id', type: 'uuid' })
  disputeId: string;

  @ManyToOne(() => Dispute, (d) => d.evidence)
  @JoinColumn({ name: 'dispute_id' })
  dispute: Dispute;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string;

  @Column({ name: 'object_key', type: 'text' })
  objectKey: string;

  @Column({ name: 'mime_type', type: 'text' })
  mimeType: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
