import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  private withPriceAlias(product: Product): Product & { pricePaisa: number } {
    const pricePaisa = Number(product.basePricePaisa ?? 0);
    return Object.assign(product, { pricePaisa });
  }

  async create(orgId: string, dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create({
      orgId,
      name: dto.name,
      description: dto.description,
      basePricePaisa: dto.basePricePaisa ?? dto.pricePaisa,
      sku: dto.sku,
      category: dto.category,
      weightGrams: dto.weightGrams,
    });
    const saved = await this.productRepo.save(product);
    return this.withPriceAlias(saved);
  }

  async findByOrg(orgId: string): Promise<Product[]> {
    const products = await this.productRepo.find({
      where: { orgId, status: 'active' },
      relations: ['images', 'variants'],
      order: { createdAt: 'DESC' },
    });
    return products.map((product) => this.withPriceAlias(product));
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['images', 'variants'],
    });
    if (!product) {
      throw new NotFoundException({ error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' } });
    }
    return this.withPriceAlias(product);
  }

  async update(id: string, dto: UpdateProductDto, orgId: string): Promise<Product> {
    const product = await this.findById(id);
    if (product.orgId !== orgId) {
      throw new ForbiddenException({ error: { code: 'FORBIDDEN', message: 'Product does not belong to this org' } });
    }
    Object.assign(product, {
      ...dto,
      basePricePaisa: dto.basePricePaisa ?? dto.pricePaisa,
    });
    const saved = await this.productRepo.save(product);
    return this.withPriceAlias(saved);
  }

  async archive(id: string, orgId: string): Promise<Product> {
    return this.update(id, { status: 'archived' }, orgId);
  }
}
