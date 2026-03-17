import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { OrgsService } from '../orgs/orgs.service';

export interface CreateProductDto {
  title: string;
  description: string;
  variants: Array<{
    variant_name: string;
    price_minor: number;
    currency?: string;
    stock_qty?: number | null;
    sku?: string;
  }>;
}

export interface UpdateProductDto {
  title?: string;
  description?: string;
  status?: ProductStatus;
}

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    private readonly orgsService: OrgsService,
    private readonly dataSource: DataSource,
  ) {}

  async createProduct(
    orgId: string,
    userId: string,
    dto: CreateProductDto,
  ): Promise<{ product_id: string }> {
    await this.orgsService.assertMember(orgId, userId);

    return await this.dataSource.transaction(async (manager) => {
      const product = manager.create(Product, {
        orgId,
        title: dto.title,
        description: dto.description,
        status: ProductStatus.ACTIVE,
      });
      await manager.save(product);

      const variants = dto.variants.map((v) =>
        manager.create(ProductVariant, {
          productId: product.id,
          variantName: v.variant_name,
          priceMinor: v.price_minor,
          currency: v.currency || 'BDT',
          stockQty: v.stock_qty ?? null,
          sku: v.sku || null,
        }),
      );
      await manager.save(variants);

      return { product_id: product.id };
    });
  }

  async listProducts(
    orgId: string,
    userId: string,
    cursor?: string,
    limit = 20,
  ): Promise<{ items: Product[]; next_cursor: string | null }> {
    await this.orgsService.assertMember(orgId, userId);

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.variants', 'v')
      .where('p.org_id = :orgId', { orgId })
      .andWhere('p.status = :status', { status: ProductStatus.ACTIVE })
      .orderBy('p.created_at', 'DESC')
      .take(limit + 1);

    if (cursor) {
      qb.andWhere('p.created_at < (SELECT created_at FROM products WHERE id = :cursor)', { cursor });
    }

    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    return {
      items,
      next_cursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  }

  async updateProduct(
    orgId: string,
    productId: string,
    userId: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    await this.orgsService.assertMember(orgId, userId);

    const product = await this.productRepo.findOne({ where: { id: productId, orgId } });
    if (!product) {
      throw new NotFoundException({ error: { code: 'not_found', message: 'Product not found' } });
    }

    if (dto.title !== undefined) product.title = dto.title;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.status !== undefined) product.status = dto.status;

    return this.productRepo.save(product);
  }

  async getProduct(productId: string): Promise<Product | null> {
    return this.productRepo.findOne({
      where: { id: productId },
      relations: ['variants'],
    });
  }
}
