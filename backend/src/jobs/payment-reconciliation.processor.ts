import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentIntent } from '../modules/payments/entities/payment-intent.entity';

@Injectable()
export class PaymentReconciliationProcessor {
  private readonly logger = new Logger(PaymentReconciliationProcessor.name);

  constructor(
    @InjectRepository(PaymentIntent) private intentRepo: Repository<PaymentIntent>,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async reconcilePendingPayments(): Promise<void> {
    this.logger.log('Running payment reconciliation...');

    const staleThreshold = new Date();
    staleThreshold.setHours(staleThreshold.getHours() - 1);

    const staleIntents = await this.intentRepo
      .createQueryBuilder('pi')
      .where('pi.status = :status', { status: 'processing' })
      .andWhere('pi.created_at < :threshold', { threshold: staleThreshold })
      .getMany();

    for (const intent of staleIntents) {
      this.logger.warn(`Stale payment intent ${intent.id} for order ${intent.orderId}`);
      // In production: re-query provider status, update accordingly
    }
  }
}
