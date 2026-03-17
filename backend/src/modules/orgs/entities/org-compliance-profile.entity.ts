import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Org } from './org.entity';

@Entity('org_compliance_profiles')
export class OrgComplianceProfile {
  @PrimaryColumn({ name: 'org_id', type: 'uuid' })
  orgId: string;

  @OneToOne(() => Org, (org) => org.complianceProfile)
  @JoinColumn({ name: 'org_id' })
  org: Org;

  @Column({ name: 'trade_license_no', type: 'text', nullable: true })
  tradeLicenseNo: string | null;

  @Column({ name: 'vat_reg_no', type: 'text', nullable: true })
  vatRegNo: string | null;

  @Column({ name: 'tin_no', type: 'text', nullable: true })
  tinNo: string | null;

  @Column({ type: 'text', nullable: true })
  ubid: string | null;

  @Column({ name: 'pra_no', type: 'text', nullable: true })
  praNo: string | null;

  @Column({ name: 'business_address', type: 'text', nullable: true })
  businessAddress: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
