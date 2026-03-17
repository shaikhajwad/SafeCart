import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Shipment } from './shipment.entity';

@Entity('shipment_events')
export class ShipmentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Shipment, (s) => s.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipment;

  @Column({ name: 'shipment_id' })
  shipmentId: string;

  @Column()
  status: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true, name: 'event_time' })
  eventTime: Date;

  @Column({ nullable: true, type: 'jsonb' })
  raw: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
