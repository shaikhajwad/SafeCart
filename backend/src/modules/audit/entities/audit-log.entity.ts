import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, name: 'actor_user_id' })
  actorUserId: string;

  @Column()
  action: string; // e.g., ORDER_STATUS_CHANGED, KYC_APPROVED, DISPUTE_OPENED

  @Column({ nullable: true, name: 'entity_type' })
  entityType: string; // e.g., Order, Dispute, Org

  @Column({ nullable: true, name: 'entity_id' })
  entityId: string;

  @Column({ nullable: true, name: 'org_id' })
  orgId: string;

  @Column({ nullable: true, type: 'jsonb' })
  before: Record<string, unknown>;

  @Column({ nullable: true, type: 'jsonb' })
  after: Record<string, unknown>;

  @Column({ nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ nullable: true, name: 'user_agent' })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
