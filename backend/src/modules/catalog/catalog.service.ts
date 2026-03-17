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

  async create(orgId: string, dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create({ ...dto, orgId });
    return this.productRepo.save(product);
  }

  async findByOrg(orgId: string): Promise<Product[]> {
    return this.productRepo.find({
      where: { orgId, status: 'active' },
      relations: ['images', 'variants'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['images', 'variants'],
    });
    if (!product) {
      throw new NotFoundException({ error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' } });
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto, orgId: string): Promise<Product> {
    const product = await this.findById(id);
    if (product.orgId !== orgId) {
      throw new ForbiddenException({ error: { code: 'FORBIDDEN', message: 'Product does not belong to this org' } });
    }
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async archive(id: string, orgId: string): Promise<Product> {
    return this.update(id, { status: 'archived' }, orgId);
  }
}
