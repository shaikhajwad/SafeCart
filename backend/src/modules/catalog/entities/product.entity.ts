import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  /** Base price in paisa (minor units). Variants may override. */
  @Column({ name: 'base_price_paisa', type: 'bigint' })
  basePricePaisa: number;

  @Column({ nullable: true })
  sku: string;

  @Column({ default: 'active' })
  status: string; // active | archived | draft

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true, name: 'weight_grams', type: 'int' })
  weightGrams: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('ProductVariant', (v: { product: Product }) => v.product)
  variants: import('./product-variant.entity').ProductVariant[];

  @OneToMany('ProductImage', (i: { product: Product }) => i.product)
  images: import('./product-image.entity').ProductImage[];
}
