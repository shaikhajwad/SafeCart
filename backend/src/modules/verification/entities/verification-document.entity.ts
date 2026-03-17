import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { VerificationCase } from './verification-case.entity';

@Entity('verification_documents')
@Index(['caseId'])
export class VerificationDocument extends BaseEntity {
  @Column({ name: 'case_id', type: 'uuid' })
  caseId: string;

  @ManyToOne(() => VerificationCase, (vc) => vc.documents)
  @JoinColumn({ name: 'case_id' })
  verificationCase: VerificationCase;

  @Column({ name: 'doc_type', type: 'text' })
  docType: string;

  @Column({ name: 'object_key', type: 'text' })
  objectKey: string;

  @Column({ name: 'mime_type', type: 'text' })
  mimeType: string;

  @Column({ type: 'text' })
  sha256: string;
}
