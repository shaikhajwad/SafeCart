import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true, name: 'phone_e164' })
  phoneE164: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true, name: 'full_name' })
  fullName: string;

  @Column({ default: 'active' })
  status: string; // active | blocked | deleted

  @Column({ default: 'buyer' })
  role: string; // buyer | seller_owner | seller_staff | support_agent | admin

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('Session', (s: { user: User }) => s.user)
  sessions: import('./session.entity').Session[];
}
