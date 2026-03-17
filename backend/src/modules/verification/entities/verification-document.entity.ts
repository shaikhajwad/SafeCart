import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VerificationCase } from './verification-case.entity';

@Entity('verification_documents')
export class VerificationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => VerificationCase, (c) => c.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  verificationCase: VerificationCase;

  @Column({ name: 'case_id' })
  caseId: string;

  @Column({ name: 'document_type' })
  documentType: string; // trade_license | nid | passport | tin_certificate | vat_certificate

  @Column({ name: 'file_key' })
  fileKey: string; // S3/storage key

  @Column({ nullable: true, name: 'original_name' })
  originalName: string;

  @Column({ nullable: true, name: 'content_type' })
  contentType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
