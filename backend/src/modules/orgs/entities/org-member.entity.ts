import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Org } from './org.entity';
import { User } from '../../identity/entities/user.entity';

export enum OrgMemberRole {
  OWNER = 'owner',
  STAFF = 'staff',
}

@Entity('org_members')
@Index(['userId'])
export class OrgMember {
  @PrimaryColumn({ name: 'org_id', type: 'uuid' })
  orgId: string;

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Org, (org) => org.members)
  @JoinColumn({ name: 'org_id' })
  org: Org;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', enum: OrgMemberRole, default: OrgMemberRole.OWNER })
  role: OrgMemberRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
