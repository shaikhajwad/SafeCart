import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', unique: true })
  orderId: string;

  @Column()
  provider: string; // pathao | paperfly | redx | ecourier

  @Column({ nullable: true, name: 'consignment_id' })
  consignmentId: string;

  @Column({ nullable: true, name: 'tracking_number' })
  trackingNumber: string;

  @Column({ nullable: true, name: 'tracking_url', length: 1000 })
  trackingUrl: string;

  @Column({ default: 'pending' })
  status: string; // pending | booked | picked_up | in_transit | delivered | returned | failed

  @Column({ name: 'charge_paisa', type: 'bigint', default: 0 })
  chargePaisa: number;

  @Column({ nullable: true, name: 'estimated_delivery_at' })
  estimatedDeliveryAt: Date;

  @Column({ nullable: true, name: 'delivered_at' })
  deliveredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('ShipmentEvent', (e: { shipment: Shipment }) => e.shipment)
  events: import('./shipment-event.entity').ShipmentEvent[];
}
