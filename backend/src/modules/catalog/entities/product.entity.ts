import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Org } from '../../orgs/entities/org.entity';
import { ProductVariant } from './product-variant.entity';

export enum ProductStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Entity('products')
@Index(['orgId', 'status'])
export class Product extends BaseEntity {
  @Column({ name: 'org_id', type: 'uuid' })
  orgId: string;

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'org_id' })
  org: Org;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];
}
