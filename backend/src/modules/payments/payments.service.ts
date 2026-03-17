import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PaymentIntent, PaymentIntentStatus, PaymentProvider } from './entities/payment-intent.entity';
import { PaymentTxn } from './entities/payment-txn.entity';
import { Refund, RefundStatus } from './entities/refund.entity';
import { EscrowHold, EscrowStatus } from './entities/escrow-hold.entity';
import { Order, OrderStatus } from '../checkout/entities/order.entity';
import { SslCommerzAdapter } from './adapters/sslcommerz/sslcommerz.adapter';
import { BkashAdapter } from './adapters/bkash/bkash.adapter';
import { CheckoutService } from '../checkout/checkout.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentIntent)
    private readonly intentRepo: Repository<PaymentIntent>,
    @InjectRepository(PaymentTxn)
    private readonly txnRepo: Repository<PaymentTxn>,
    @InjectRepository(Refund)
    private readonly refundRepo: Repository<Refund>,
    @InjectRepository(EscrowHold)
    private readonly escrowRepo: Repository<EscrowHold>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly sslcommerzAdapter: SslCommerzAdapter,
    private readonly bkashAdapter: BkashAdapter,
    private readonly checkoutService: CheckoutService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  private getAdapter(provider: PaymentProvider) {
    switch (provider) {
      case PaymentProvider.SSLCOMMERZ:
        return this.sslcommerzAdapter;
      case PaymentProvider.BKASH:
        return this.bkashAdapter;
      default:
        throw new BadRequestException({ error: { code: 'provider_unavailable', message: `Provider ${provider} not supported` } });
    }
  }

  async initiatePayment(
    orderId: string,
    provider: PaymentProvider,
    idempotencyKey: string,
    accessCode?: string,
  ): Promise<{ payment_intent_id: string; pay_url: string }> {
    const order = await this.orderRepo.findOneOrFail({ where: { id: orderId } });

    // Validate access (buyer via access code, or logged in)
    if (accessCode && order.buyerAccessCode !== accessCode) {
      throw new BadRequestException({ error: { code: 'forbidden', message: 'Invalid access code' } });
    }

    if (order.status !== OrderStatus.PAYMENT_PENDING) {
      throw new BadRequestException({ error: { code: 'invalid_state', message: 'Order is not in PAYMENT_PENDING state' } });
    }

    // Idempotency: check if intent already exists
    const existing = await this.intentRepo.findOne({ where: { idempotencyKey } });
    if (existing) {
      return { payment_intent_id: existing.id, pay_url: existing.payUrl || '' };
    }

    const adapter = this.getAdapter(provider);
    const baseUrl = this.config.get<string>('CHECKOUT_BASE_URL', 'http://localhost:3001');
    const apiUrl = this.config.get<string>('API_BASE_URL', 'http://localhost:3000');

    const result = await adapter.createPaymentLink({
      orderId,
      amountMinor: order.totalMinor,
      currency: order.currency,
      buyerPhone: order.buyerPhone,
      buyerName: order.buyerName || undefined,
      successUrl: `${baseUrl}/o/${orderId}/payment-success`,
      failUrl: `${baseUrl}/o/${orderId}/payment-failed`,
      cancelUrl: `${baseUrl}/o/${orderId}/payment-cancelled`,
      ipnUrl: `${apiUrl}/api/v1/webhooks/payments/${provider}/ipn`,
      idempotencyKey,
    });

    const intent = this.intentRepo.create({
      orderId,
      provider,
      providerRef: result.providerRef,
      status: PaymentIntentStatus.PENDING,
      amountMinor: order.totalMinor,
      currency: order.currency,
      payUrl: result.payUrl,
      idempotencyKey,
    });
    await this.intentRepo.save(intent);

    return { payment_intent_id: intent.id, pay_url: result.payUrl };
  }

  async getPaymentStatus(orderId: string, accessCode?: string): Promise<{ status: string }> {
    const order = await this.orderRepo.findOneOrFail({ where: { id: orderId } });

    if (accessCode && order.buyerAccessCode !== accessCode) {
      throw new BadRequestException({ error: { code: 'forbidden', message: 'Invalid access code' } });
    }

    const intent = await this.intentRepo.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });

    return { status: intent?.status || 'unknown' };
  }

  async handleSslCommerzIpn(rawPayload: Record<string, unknown>): Promise<void> {
    const tranId = rawPayload['tran_id'] as string;
    const valId = rawPayload['val_id'] as string;

    if (!tranId) {
      this.logger.warn('IPN received without tran_id');
      return;
    }

    // Find payment intent by idempotency key (which is the tran_id)
    const intent = await this.intentRepo.findOne({ where: { idempotencyKey: tranId } });
    if (!intent) {
      this.logger.warn(`IPN for unknown tran_id: ${tranId}`);
      return;
    }

    // Prevent duplicate processing
    const providerEventId = `ipn_${valId || tranId}`;
    const existingTxn = await this.txnRepo.findOne({
      where: { paymentIntentId: intent.id, providerEventId },
    });
    if (existingTxn) {
      this.logger.debug(`IPN already processed: ${providerEventId}`);
      return;
    }

    // Validate with SSLCOMMERZ order validation API (MANDATORY per docs)
    const validation = await this.sslcommerzAdapter.validatePayment({ providerRef: tranId, valId });

    // Validate amount matches order total
    const order = await this.orderRepo.findOne({ where: { id: intent.orderId } });
    if (order && validation.amountMinor > 0 && validation.amountMinor !== order.totalMinor) {
      this.logger.error(`SSLCOMMERZ IPN amount mismatch for order ${order.id}: expected ${order.totalMinor}, got ${validation.amountMinor}`);
      // Security: reject if amount doesn't match
      await this.recordTxn(intent.id, providerEventId, rawPayload, 'AMOUNT_MISMATCH');
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      await this.recordTxn(intent.id, providerEventId, rawPayload, validation.status, manager);

      if (validation.status === 'VALID') {
        await manager.update(PaymentIntent, { id: intent.id }, {
          status: PaymentIntentStatus.SUCCEEDED,
          providerRef: valId || tranId,
        });
        // Transition order to PAID via checkout service
        await this.checkoutService.transitionOrder(intent.orderId, OrderStatus.PAID, {
          provider: 'sslcommerz',
          tran_id: tranId,
          val_id: valId,
        });
        // Create escrow hold
        await this.createEscrowHold(intent.orderId, manager);
      } else if (validation.status === 'RISK_HOLD') {
        await manager.update(PaymentIntent, { id: intent.id }, { status: PaymentIntentStatus.RISK_HOLD });
      } else {
        await manager.update(PaymentIntent, { id: intent.id }, { status: PaymentIntentStatus.FAILED });
        await this.checkoutService.transitionOrder(intent.orderId, OrderStatus.PAYMENT_FAILED, {
          reason: validation.status,
        });
      }
    });
  }

  async initiateRefund(
    orderId: string,
    amountMinor: number,
    reason: string,
    idempotencyKey: string,
  ): Promise<{ refund_id: string; status: string }> {
    const intent = await this.intentRepo.findOne({
      where: { orderId, status: PaymentIntentStatus.SUCCEEDED },
    });

    if (!intent) {
      throw new BadRequestException({ error: { code: 'invalid_state', message: 'No succeeded payment intent for this order' } });
    }

    if (amountMinor > intent.amountMinor) {
      throw new BadRequestException({ error: { code: 'invalid_amount', message: 'Refund amount exceeds payment amount' } });
    }

    const adapter = this.getAdapter(intent.provider);
    const refundResult = await adapter.refund({
      paymentIntentId: intent.id,
      providerRef: intent.providerRef!,
      amountMinor,
      reason,
      idempotencyKey,
    });

    const refund = this.refundRepo.create({
      paymentIntentId: intent.id,
      amountMinor,
      status: refundResult.status === 'succeeded' ? RefundStatus.SUCCEEDED :
              refundResult.status === 'failed' ? RefundStatus.FAILED :
              RefundStatus.MANUAL_REQUIRED,
      providerRef: refundResult.providerRef,
      reason,
    });
    await this.refundRepo.save(refund);

    return { refund_id: refund.id, status: refund.status };
  }

  private async recordTxn(
    paymentIntentId: string,
    providerEventId: string,
    rawPayload: Record<string, unknown>,
    txnStatus: string,
    manager?: import('typeorm').EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(PaymentTxn) : this.txnRepo;
    try {
      await repo.save(
        repo.create({ paymentIntentId, providerEventId, rawPayload, txnStatus }),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Ignore duplicate key errors (idempotent)
      if (!msg.includes('duplicate') && !msg.includes('unique')) {
        throw err;
      }
    }
  }

  private async createEscrowHold(
    orderId: string,
    manager: import('typeorm').EntityManager,
  ): Promise<void> {
    const existing = await manager.findOne(EscrowHold, { where: { orderId } });
    if (existing) return;

    // Release eligible after dispute window (e.g., 72h after delivery - configurable)
    const escrow = manager.create(EscrowHold, {
      orderId,
      status: EscrowStatus.HELD,
      policySnapshot: {
        dispute_window_hours: 72,
        created_at: new Date().toISOString(),
      },
      releaseEligibleAt: null, // set after delivery
    });
    await manager.save(escrow);
  }
}
