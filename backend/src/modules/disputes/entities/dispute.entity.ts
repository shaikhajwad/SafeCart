import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('disputes')
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'raised_by_user_id' })
  raisedByUserId: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ default: 'open' })
  status: string; // open | under_review | resolved_seller | resolved_buyer | closed

  @Column({ nullable: true, name: 'resolution_notes', type: 'text' })
  resolutionNotes: string;

  @Column({ nullable: true, name: 'resolved_by_user_id' })
  resolvedByUserId: string;

  @Column({ nullable: true, name: 'resolved_at' })
  resolvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('DisputeEvidence', (e: { dispute: Dispute }) => e.dispute)
  evidence: import('./dispute-evidence.entity').DisputeEvidence[];
}
