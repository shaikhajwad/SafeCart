import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('escrow_holds')
export class EscrowHold {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', unique: true })
  orderId: string;

  @Column({ name: 'org_id' })
  orgId: string;

  /** Amount held in paisa */
  @Column({ name: 'held_paisa', type: 'bigint' })
  heldPaisa: number;

  @Column({ default: 'held' })
  status: string; // held | released | refunded | dispute_frozen

  /** Window before auto-release (ISO duration or timestamp) */
  @Column({ nullable: true, name: 'release_after' })
  releaseAfter: Date;

  @Column({ nullable: true, name: 'released_at' })
  releasedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
