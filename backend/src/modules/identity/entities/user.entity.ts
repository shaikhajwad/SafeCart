import {
  Entity,
  Column,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Session } from './session.entity';

export enum UserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  DELETED = 'deleted',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ name: 'phone_e164', type: 'text', unique: true, nullable: true })
  phoneE164: string | null;

  @Column({ type: 'text', unique: true, nullable: true })
  email: string | null;

  @Column({ name: 'full_name', type: 'text', nullable: true })
  fullName: string | null;

  @Column({
    type: 'text',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];
}
