import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from '../../checkout/entities/order.entity';

export enum ShipmentStatus {
  QUOTED = 'quoted',
  BOOKED = 'booked',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

export enum CourierProvider {
  PATHAO = 'pathao',
  PAPERFLY = 'paperfly',
  ECOURIER = 'ecourier',
  REDX = 'redx',
}

@Entity('shipments')
@Index(['orderId'])
@Index(['status'])
export class Shipment extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid', unique: true })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'text', enum: CourierProvider })
  provider: CourierProvider;

  @Column({ type: 'text', enum: ShipmentStatus, default: ShipmentStatus.BOOKED })
  status: ShipmentStatus;

  @Column({ name: 'tracking_id', type: 'text', nullable: true })
  trackingId: string | null;

  @Column({ name: 'provider_ref', type: 'text', nullable: true })
  providerRef: string | null;

  @Column({ name: 'fee_minor', type: 'bigint', nullable: true })
  feeMinor: number | null;

  @Column({ name: 'cod_amount_minor', type: 'bigint', default: 0 })
  codAmountMinor: number;

  @Column({ name: 'idempotency_key', type: 'text', unique: true })
  idempotencyKey: string;

  @OneToMany(() => ShipmentEvent, (event) => event.shipment)
  events: ShipmentEvent[];
}

@Entity('shipment_events')
@Index(['shipmentId', 'createdAt'])
export class ShipmentEvent extends BaseEntity {
  @Column({ name: 'shipment_id', type: 'uuid' })
  shipmentId: string;

  @ManyToOne(() => Shipment, (s) => s.events)
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipment;

  @Column({ name: 'event_type', type: 'text' })
  eventType: string;

  @Column({ type: 'text', nullable: true })
  location: string | null;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;
}
