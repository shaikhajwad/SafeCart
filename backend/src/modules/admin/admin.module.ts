import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../identity/entities/user.entity';
import { Org } from '../orgs/entities/org.entity';
import { VerificationCase } from '../verification/entities/verification-case.entity';
import { Dispute } from '../disputes/entities/dispute.entity';
import { PaymentIntent } from '../payments/entities/payment-intent.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { VerificationModule } from '../verification/verification.module';
import { DisputesModule } from '../disputes/disputes.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Org, VerificationCase, Dispute, PaymentIntent]),
    VerificationModule,
    DisputesModule,
    AuditModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
