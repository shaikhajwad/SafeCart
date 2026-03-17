import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('verification_cases')
export class VerificationCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ name: 'submitted_by_user_id' })
  submittedByUserId: string;

  @Column({ default: 'pending' })
  status: string; // pending | under_review | approved | rejected | more_info_required

  @Column({ nullable: true, name: 'reviewer_user_id' })
  reviewerUserId: string;

  @Column({ nullable: true, name: 'reviewer_notes', type: 'text' })
  reviewerNotes: string;

  @Column({ nullable: true, name: 'rejection_reason', type: 'text' })
  rejectionReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('VerificationDocument', (d: { verificationCase: VerificationCase }) => d.verificationCase)
  documents: import('./verification-document.entity').VerificationDocument[];
}
