import {
  Entity,
  Column,
  Index,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { OrgMember } from './org-member.entity';
import { OrgComplianceProfile } from './org-compliance-profile.entity';

export enum OrgStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum OrgVerifiedStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('orgs')
export class Org extends BaseEntity {
  @Column({ type: 'text' })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'text', unique: true })
  slug: string;

  @Column({ type: 'text', enum: OrgStatus, default: OrgStatus.ACTIVE })
  status: OrgStatus;

  @Column({
    name: 'verified_status',
    type: 'text',
    enum: OrgVerifiedStatus,
    default: OrgVerifiedStatus.UNVERIFIED,
  })
  verifiedStatus: OrgVerifiedStatus;

  @Column({ name: 'support_phone', type: 'text', nullable: true })
  supportPhone: string | null;

  @Column({ name: 'support_email', type: 'text', nullable: true })
  supportEmail: string | null;

  @Column({ name: 'return_policy', type: 'text', nullable: true })
  returnPolicy: string | null;

  @OneToMany(() => OrgMember, (member) => member.org)
  members: OrgMember[];

  @OneToOne(() => OrgComplianceProfile, (profile) => profile.org)
  complianceProfile: OrgComplianceProfile;
}
