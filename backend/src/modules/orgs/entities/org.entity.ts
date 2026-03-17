import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';

@Entity('orgs')
export class Org {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Column({ nullable: true, name: 'website_url' })
  websiteUrl: string;

  @Column({ nullable: true, name: 'support_phone' })
  supportPhone: string;

  @Column({ nullable: true, name: 'support_email' })
  supportEmail: string;

  @Column({ default: 'pending_verification' })
  status: string; // pending_verification | active | suspended | closed

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('OrgMember', (m: { org: Org }) => m.org)
  members: import('./org-member.entity').OrgMember[];

  @OneToOne('OrgCompliance', (c: { org: Org }) => c.org)
  compliance: import('./org-compliance.entity').OrgCompliance;
}
