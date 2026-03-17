import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PaymentIntent } from './entities/payment-intent.entity';
import { PaymentTxn } from './entities/payment-txn.entity';
import { Refund } from './entities/refund.entity';
import { EscrowHold } from './entities/escrow-hold.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SslCommerzAdapter } from './adapters/sslcommerz/sslcommerz.adapter';
import { BkashAdapter } from './adapters/bkash/bkash.adapter';
import { CheckoutModule } from '../checkout/checkout.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentIntent, PaymentTxn, Refund, EscrowHold]),
    HttpModule,
    CheckoutModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, SslCommerzAdapter, BkashAdapter],
  exports: [PaymentsService, TypeOrmModule],
})
export class PaymentsModule {}
