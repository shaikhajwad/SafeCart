import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { CheckoutSession } from './entities/checkout-session.entity';
import { CatalogModule } from '../catalog/catalog.module';
import { OrgMember } from '../orgs/entities/org-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckoutSession, OrgMember]), CatalogModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
