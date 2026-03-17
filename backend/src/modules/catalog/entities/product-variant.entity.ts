import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';

@Entity('product_variants')
@Index(['productId'])
export class ProductVariant extends BaseEntity {
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.variants)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'text', nullable: true })
  sku: string | null;

  @Column({ name: 'variant_name', type: 'text' })
  variantName: string;

  @Column({ name: 'price_minor', type: 'bigint' })
  priceMinor: number;

  @Column({ type: 'char', length: 3, default: 'BDT' })
  currency: string;

  @Column({ name: 'stock_qty', type: 'int', nullable: true })
  stockQty: number | null;
}
