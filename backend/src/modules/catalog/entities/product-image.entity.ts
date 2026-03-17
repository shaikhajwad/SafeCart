import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (p) => p.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'file_key' })
  fileKey: string;

  @Column({ nullable: true, name: 'alt_text' })
  altText: string;

  @Column({ default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ default: false, name: 'is_primary' })
  isPrimary: boolean;
}
