import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutSession } from './entities/checkout-session.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderEvent } from './entities/order-event.entity';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { OrgsModule } from '../orgs/orgs.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckoutSession, Order, OrderItem, OrderEvent]),
    OrgsModule,
    CatalogModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService, TypeOrmModule],
})
export class CheckoutModule {}
