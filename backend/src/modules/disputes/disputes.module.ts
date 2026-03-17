import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispute, DisputeEvidence } from './entities/dispute.entity';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { CheckoutModule } from '../checkout/checkout.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dispute, DisputeEvidence]),
    CheckoutModule,
    PaymentsModule,
  ],
  controllers: [DisputesController],
  providers: [DisputesService],
  exports: [DisputesService, TypeOrmModule],
})
export class DisputesModule {}
