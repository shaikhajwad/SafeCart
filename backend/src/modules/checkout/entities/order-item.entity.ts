import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from './order.entity';

@Entity('order_items')
@Index(['orderId'])
export class OrderItem extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId: string | null;

  @Column({ type: 'text' })
  title: string;

  @Column({ name: 'unit_price_minor', type: 'bigint' })
  unitPriceMinor: number;

  @Column({ type: 'int' })
  qty: number;

  @Column({ name: 'line_total_minor', type: 'bigint' })
  lineTotalMinor: number;
}
