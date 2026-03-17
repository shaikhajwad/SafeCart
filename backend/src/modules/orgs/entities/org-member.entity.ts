import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Org } from './org.entity';

@Entity('org_members')
@Unique(['orgId', 'userId'])
export class OrgMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Org, (o) => o.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  org: Org;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ default: 'seller_staff' })
  role: string; // seller_owner | seller_staff

  @Column({ default: 'active' })
  status: string; // active | invited | revoked

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
