import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column()
  channel: string; // sms | email | push

  @Column()
  type: string; // otp | order_created | order_paid | shipment_booked | order_delivered | dispute_opened

  @Column({ nullable: true })
  recipient: string; // phone or email

  @Column({ nullable: true, type: 'text' })
  content: string;

  @Column({ default: 'pending' })
  status: string; // pending | sent | failed

  @Column({ nullable: true, name: 'provider_message_id' })
  providerMessageId: string;

  @Column({ nullable: true, name: 'error_message', type: 'text' })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
