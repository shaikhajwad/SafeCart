import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (p) => p.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column()
  name: string; // e.g., "Red / XL"

  @Column({ nullable: true })
  sku: string;

  /** Override price in paisa; null = use product base price */
  @Column({ nullable: true, name: 'price_paisa', type: 'bigint' })
  pricePaisa: number;

  @Column({ default: 0, name: 'stock_qty' })
  stockQty: number;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;
}
