import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { PaymentIntent } from './entities/payment-intent.entity';
import { PaymentTxn } from './entities/payment-txn.entity';
import { Refund } from './entities/refund.entity';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';
import { EscrowService } from './escrow.service';
import { SslcommerzAdapter } from './adapters/sslcommerz/sslcommerz.adapter';
import { BkashAdapter } from './adapters/bkash/bkash.adapter';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentIntent) private intentRepo: Repository<PaymentIntent>,
    @InjectRepository(PaymentTxn) private txnRepo: Repository<PaymentTxn>,
    @InjectRepository(Refund) private refundRepo: Repository<Refund>,
    @Inject('REDIS_CLIENT') private redis: Redis,
    private ordersService: OrdersService,
    private escrowService: EscrowService,
    private sslcommerzAdapter: SslcommerzAdapter,
    private bkashAdapter: BkashAdapter,
    private configService: ConfigService,
  ) {}

  async initiatePayment(
    orderId: string,
    provider: string,
    idempotencyKey?: string,
  ): Promise<{ payUrl: string; paymentIntentId: string }> {
    // Idempotency check
    if (idempotencyKey) {
      const cached = await this.redis.get(`payment_idempotency:${idempotencyKey}`);
      if (cached) return JSON.parse(cached) as { payUrl: string; paymentIntentId: string };
    }

    const order = await this.ordersService.findById(orderId);

    const intent = this.intentRepo.create({
      orderId,
      provider,
      status: 'pending',
      amountPaisa: Number(order.totalPaisa),
      idempotencyKey,
    });
    await this.intentRepo.save(intent);

    const appBaseUrl = this.configService.get<string>('APP_BASE_URL') ?? 'http://localhost:3000';
    const checkoutWebBaseUrl = this.configService.get<string>('CHECKOUT_WEB_BASE_URL') ?? 'http://localhost:3001';
    let payUrl: string;

    if (provider === 'sslcommerz') {
      const ipnUrl = `${appBaseUrl}/api/webhooks/payments/sslcommerz/ipn`;
      const frontendOrderUrl = `${checkoutWebBaseUrl}/orders/${orderId}`;
      payUrl = await this.sslcommerzAdapter.createPaymentSession(order, ipnUrl, frontendOrderUrl);
    } else if (provider === 'bkash') {
      const { bkashUrl, paymentId } = await this.bkashAdapter.createPayment(order, appBaseUrl);
      intent.providerRef = paymentId;
      payUrl = bkashUrl;
    } else {
      throw new BadRequestException({ error: { code: 'INVALID_PROVIDER', message: 'Unknown payment provider' } });
    }

    intent.payUrl = payUrl;
    intent.status = 'processing';
    await this.intentRepo.save(intent);

    const order = await this.ordersService.findById(orderId);
    if (order.status === OrderStatus.DRAFT) {
      await this.ordersService.advanceStatus(orderId, OrderStatus.CHECKOUT_STARTED);
    }
    await this.ordersService.advanceStatus(orderId, OrderStatus.PAYMENT_PENDING);

    const result = { payUrl, paymentIntentId: intent.id };
    if (idempotencyKey) {
      await this.redis.set(`payment_idempotency:${idempotencyKey}`, JSON.stringify(result), 'EX', 86400);
    }

    return result;
  }

  /** Public payment initiation for buyers who authenticate via access_code. */
  async initiateBuyerPayment(
    orderId: string,
    accessCode: string,
    provider: string,
    idempotencyKey?: string,
  ): Promise<{ payUrl: string; paymentIntentId: string }> {
    // Validate access_code before initiating — throws ForbiddenException if invalid
    await this.ordersService.findByIdWithAccess(orderId, accessCode);
    return this.initiatePayment(orderId, provider, idempotencyKey);
  }

  async handleSslcommerzIPN(payload: Record<string, string>): Promise<void> {
    const webhookKey = `webhook:sslcommerz:${payload['tran_id']}`;
    const alreadyProcessed = await this.redis.get(webhookKey);
    if (alreadyProcessed) return;

    const isValid = await this.sslcommerzAdapter.validateIPN(payload);
    if (!isValid) {
      this.logger.warn(`Invalid SSLCommerz IPN for tran_id=${payload['tran_id']}`);
      return;
    }

    const orderId = payload['tran_id'];
    const intent = await this.intentRepo.findOne({
      where: { orderId, provider: 'sslcommerz' },
    });

    if (!intent) return;

    intent.rawIpn = payload as unknown as Record<string, unknown>;

    if (payload['status'] === 'VALID' || payload['status'] === 'VALIDATED') {
      intent.status = 'succeeded';
      intent.providerRef = payload['val_id'];
      await this.intentRepo.save(intent);

      const txn = this.txnRepo.create({
        paymentIntentId: intent.id,
        orderId,
        provider: 'sslcommerz',
        providerTxnId: payload['bank_tran_id'],
        amountPaisa: Math.round(parseFloat(payload['amount'] ?? '0') * 100),
        status: 'success',
        metadata: payload as unknown as Record<string, unknown>,
      });
      await this.txnRepo.save(txn);

      await this.ordersService.advanceStatus(orderId, OrderStatus.PAID);
      const order = await this.ordersService.findById(orderId);
      await this.escrowService.createHold(orderId, order.orgId, Number(order.totalPaisa));
    } else {
      intent.status = 'failed';
      await this.intentRepo.save(intent);
    }

    await this.redis.set(webhookKey, '1', 'EX', 86400);
  }

  async handleBkashWebhook(payload: Record<string, unknown>): Promise<void> {
    const paymentId = payload['paymentID'] as string;
    const webhookKey = `webhook:bkash:${paymentId}`;
    const alreadyProcessed = await this.redis.get(webhookKey);
    if (alreadyProcessed) return;

    const intent = await this.intentRepo.findOne({
      where: { providerRef: paymentId, provider: 'bkash' },
    });
    if (!intent) return;

    const result = await this.bkashAdapter.queryPayment(paymentId);
    intent.rawIpn = payload;

    if (result.status === 'Completed') {
      intent.status = 'succeeded';
      await this.intentRepo.save(intent);

      const txn = this.txnRepo.create({
        paymentIntentId: intent.id,
        orderId: intent.orderId,
        provider: 'bkash',
        providerTxnId: result.trxId,
        amountPaisa: Number(intent.amountPaisa),
        status: 'success',
        metadata: payload,
      });
      await this.txnRepo.save(txn);

      await this.ordersService.advanceStatus(intent.orderId, OrderStatus.PAID);
      const order = await this.ordersService.findById(intent.orderId);
      await this.escrowService.createHold(intent.orderId, order.orgId, Number(order.totalPaisa));
    } else {
      intent.status = 'failed';
      await this.intentRepo.save(intent);
    }

    await this.redis.set(webhookKey, '1', 'EX', 86400);
  }

  async initiateRefund(orderId: string, reason: string, initiatedBy: string): Promise<Refund> {
    const intent = await this.intentRepo.findOne({
      where: { orderId, status: 'succeeded' },
    });
    if (!intent) {
      throw new NotFoundException({ error: { code: 'PAYMENT_NOT_FOUND', message: 'No successful payment found' } });
    }

    const refund = this.refundRepo.create({
      orderId,
      paymentIntentId: intent.id,
      amountPaisa: Number(intent.amountPaisa),
      reason,
      status: 'pending',
      initiatedByUserId: initiatedBy,
    });
    await this.refundRepo.save(refund);

    await this.escrowService.refundHold(orderId);
    return refund;
  }

  async listByOrder(orderId: string): Promise<PaymentIntent[]> {
    return this.intentRepo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
  }

  async getPaymentStatus(orderId: string, accessCode?: string, provider?: string) {
    const orderData = await this.ordersService.findByIdWithAccess(orderId, accessCode);
    
    const query = this.intentRepo.createQueryBuilder('intent').where('intent.orderId = :orderId', { orderId });
    if (provider) {
      query.andWhere('intent.provider = :provider', { provider });
    }
    
    const intents = await query.orderBy('intent.createdAt', 'DESC').getMany();
    
    return {
      orderId,
      orderStatus: orderData.status,
      paymentIntents: intents.map(intent => ({
        id: intent.id,
        provider: intent.provider,
        status: intent.status,
        amountPaisa: intent.amountPaisa,
        payUrl: intent.payUrl,
        createdAt: intent.createdAt,
        updatedAt: intent.updatedAt,
      })),
    };
  }
}
