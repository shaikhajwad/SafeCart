import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Org } from '../../orgs/entities/org.entity';
import { User } from '../../identity/entities/user.entity';
import { VerificationDocument } from './verification-document.entity';

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('verification_cases')
@Index(['orgId', 'status'])
export class VerificationCase extends BaseEntity {
  @Column({ name: 'org_id', type: 'uuid' })
  orgId: string;

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'org_id' })
  org: Org;

  @Column({ type: 'text', enum: VerificationStatus, default: VerificationStatus.PENDING })
  status: VerificationStatus;

  @Column({ name: 'submitted_by', type: 'uuid' })
  submittedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submitted_by' })
  submittedByUser: User;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes: string | null;

  @OneToMany(() => VerificationDocument, (doc) => doc.verificationCase)
  documents: VerificationDocument[];
}
