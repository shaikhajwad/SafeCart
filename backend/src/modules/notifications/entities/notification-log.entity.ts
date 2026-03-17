import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../identity/entities/user.entity';

export enum NotificationChannel {
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
}

export enum NotificationStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('notification_logs')
@Index(['userId', 'createdAt'])
@Index(['status'])
export class NotificationLog extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ type: 'text', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ type: 'text' })
  recipient: string;

  @Column({ name: 'template_key', type: 'text' })
  templateKey: string;

  @Column({ type: 'text', enum: NotificationStatus, default: NotificationStatus.QUEUED })
  status: NotificationStatus;

  @Column({ name: 'payload', type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;
}
