import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Order } from '../orders/entities/order.entity';
import { Dispute } from '../disputes/entities/dispute.entity';
import { Org } from '../orgs/entities/org.entity';
import { VerificationModule } from '../verification/verification.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { EscrowHold } from '../payments/entities/escrow-hold.entity';
import { DisputesModule } from '../disputes/disputes.module';
import { User } from '../identity/entities/user.entity';
import { Refund } from '../payments/entities/refund.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Dispute, Org, EscrowHold, User, Refund]),
    VerificationModule,
    OrdersModule,
    PaymentsModule,
    DisputesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
