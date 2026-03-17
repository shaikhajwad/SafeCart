import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Org } from './org.entity';

@Entity('org_compliances')
export class OrgCompliance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Org, (o) => o.compliance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  org: Org;

  @Column({ name: 'org_id', unique: true })
  orgId: string;

  @Column({ nullable: true, name: 'trade_license_number' })
  tradeLicenseNumber: string;

  @Column({ nullable: true, name: 'tin_number' })
  tinNumber: string;

  @Column({ nullable: true, name: 'vat_number' })
  vatNumber: string;

  /** Unique Business Identification Number */
  @Column({ nullable: true })
  ubid: string;

  /** Payment Received Account */
  @Column({ nullable: true })
  pra: string;

  @Column({ nullable: true, name: 'bank_account_name' })
  bankAccountName: string;

  @Column({ nullable: true, name: 'bank_account_number' })
  bankAccountNumber: string;

  @Column({ nullable: true, name: 'bank_routing_number' })
  bankRoutingNumber: string;

  @Column({ nullable: true, name: 'bank_name' })
  bankName: string;

  @Column({ default: 'unverified' })
  status: string; // unverified | pending | verified | rejected

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
