import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EscrowService } from './escrow.service';
import { SslcommerzAdapter } from './adapters/sslcommerz/sslcommerz.adapter';
import { BkashAdapter } from './adapters/bkash/bkash.adapter';
import { PaymentIntent } from './entities/payment-intent.entity';
import { PaymentTxn } from './entities/payment-txn.entity';
import { EscrowHold } from './entities/escrow-hold.entity';
import { Refund } from './entities/refund.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentIntent, PaymentTxn, EscrowHold, Refund]),
    OrdersModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, EscrowService, SslcommerzAdapter, BkashAdapter],
  exports: [PaymentsService, EscrowService, SslcommerzAdapter, BkashAdapter],
})
export class PaymentsModule {}
