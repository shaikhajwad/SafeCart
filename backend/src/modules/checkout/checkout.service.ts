import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { CheckoutSession } from './entities/checkout-session.entity';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CatalogService } from '../catalog/catalog.service';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(CheckoutSession)
    private sessionRepo: Repository<CheckoutSession>,
    private catalogService: CatalogService,
  ) {}

  async create(orgId: string, dto: CreateCheckoutSessionDto): Promise<CheckoutSession> {
    const product = await this.catalogService.findById(dto.productId);
    if (product.orgId !== orgId) {
      throw new BadRequestException({ error: { code: 'INVALID_PRODUCT', message: 'Product not found in org' } });
    }

    let lockedPricePaisa = Number(product.basePricePaisa);
    if (dto.variantId) {
      const variant = product.variants?.find((v) => v.id === dto.variantId);
      if (variant?.pricePaisa) lockedPricePaisa = Number(variant.pricePaisa);
    }

    const token = randomBytes(12).toString('base64url');
    const session = this.sessionRepo.create({
      token,
      orgId,
      productId: dto.productId,
      variantId: dto.variantId,
      quantity: dto.quantity ?? 1,
      lockedPricePaisa,
      customTitle: dto.customTitle,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
    return this.sessionRepo.save(session);
  }

  async findByToken(token: string): Promise<CheckoutSession> {
    const session = await this.sessionRepo.findOne({ where: { token } });
    if (!session) {
      throw new NotFoundException({ error: { code: 'SESSION_NOT_FOUND', message: 'Checkout session not found' } });
    }
    if (session.status !== 'active') {
      throw new BadRequestException({ error: { code: 'SESSION_INVALID', message: `Checkout session is ${session.status}` } });
    }
    if (session.expiresAt && new Date() > session.expiresAt) {
      throw new BadRequestException({ error: { code: 'SESSION_EXPIRED', message: 'Checkout session has expired' } });
    }
    return session;
  }
}
