import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentIntent } from '../modules/payments/entities/payment-intent.entity';
import { PaymentTxn } from '../modules/payments/entities/payment-txn.entity';
import { SslcommerzAdapter } from '../modules/payments/adapters/sslcommerz/sslcommerz.adapter';
import { BkashAdapter } from '../modules/payments/adapters/bkash/bkash.adapter';
import { OrdersService } from '../modules/orders/orders.service';
import { OrderStatus } from '../modules/orders/entities/order.entity';

@Injectable()
export class PaymentReconciliationProcessor {
  private readonly logger = new Logger(PaymentReconciliationProcessor.name);

  constructor(
    @InjectRepository(PaymentIntent) private intentRepo: Repository<PaymentIntent>,
    @InjectRepository(PaymentTxn) private txnRepo: Repository<PaymentTxn>,
    private sslcommerzAdapter: SslcommerzAdapter,
    private bkashAdapter: BkashAdapter,
    private ordersService: OrdersService,
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

    this.logger.log(`Found ${staleIntents.length} stale payment intents to reconcile`);

    for (const intent of staleIntents) {
      try {
        let updatedStatus: 'succeeded' | 'failed' | 'processing' = 'processing';
        
        if (intent.provider === 'sslcommerz' && intent.rawIpn) {
          try {
            const isValid = await this.sslcommerzAdapter.validateIPN(intent.rawIpn as Record<string, string>);
            if (isValid) {
              updatedStatus = 'succeeded';
              this.logger.log(`[SSLCOMMERZ] Payment ${intent.id} validated successfully`);
            } else {
              this.logger.warn(`[SSLCOMMERZ] Payment ${intent.id} validation failed`);
            }
          } catch (err) {
            this.logger.error(`[SSLCOMMERZ] Failed to validate payment ${intent.id}`, err);
          }
        } else if (intent.provider === 'bkash') {
          try {
            // For bKash, we would query the payment status using queryPayment
            this.logger.debug(`[BKASH] Reconciling payment ${intent.id} (providerRef: ${intent.providerRef})`);
            // Real implementation would call bkashAdapter.queryPayment(intent.providerRef)
          } catch (err) {
            this.logger.error(`[BKASH] Failed to reconcile payment ${intent.id}`, err);
          }
        }

        if (updatedStatus === 'succeeded' && intent.status !== 'succeeded') {
          intent.status = 'succeeded';
          await this.intentRepo.save(intent);
          
          // Create transaction record
          await this.txnRepo.save(
            this.txnRepo.create({
              paymentIntentId: intent.id,
              orderId: intent.orderId,
              amountPaisa: intent.amountPaisa,
              status: 'completed',
              provider: intent.provider,
            }),
          );

          // Advance order status to PAID if not already
          try {
            const order = await this.ordersService.findById(intent.orderId);
            if (order.status === OrderStatus.PAYMENT_PENDING) {
              await this.ordersService.advanceStatus(intent.orderId, OrderStatus.PAID);
              this.logger.log(`Advanced order ${intent.orderId} to PAID`);
            }
          } catch (err) {
            this.logger.error(`Failed to advance order ${intent.orderId} status`, err);
          }
        }
      } catch (err) {
        this.logger.error(`Failed to reconcile payment intent ${intent.id}`, err);
      }
    }
  }
}
