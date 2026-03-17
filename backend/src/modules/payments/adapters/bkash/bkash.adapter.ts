import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  PaymentProviderAdapter,
  CreatePaymentLinkParams,
  PaymentLinkResult,
  ValidatePaymentParams,
  PaymentValidationResult,
  RefundPaymentParams,
  RefundResult,
} from '../payment-provider.adapter';

/**
 * bKash Payment Adapter
 * 
 * Integration reference (from Technical Doc):
 * - Tokenized checkout flow: Grant Token → Create Payment → Execute Payment
 * - PaymentID expires after 24h
 * - Webhook notifications arrive as SNS-signed messages
 * - id_token must be cached and refreshed
 * 
 * Integration boundary: real credentials go in environment variables.
 * BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD, BKASH_BASE_URL
 */
@Injectable()
export class BkashAdapter extends PaymentProviderAdapter {
  readonly provider = 'bkash';
  private readonly logger = new Logger(BkashAdapter.name);
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly username: string;
  private readonly password: string;
  private readonly baseUrl: string;

  // Token cache
  private idToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    super();
    this.appKey = config.get<string>('BKASH_APP_KEY', '');
    this.appSecret = config.get<string>('BKASH_APP_SECRET', '');
    this.username = config.get<string>('BKASH_USERNAME', '');
    this.password = config.get<string>('BKASH_PASSWORD', '');
    // sandbox: https://tokenized.sandbox.bka.sh, prod: https://tokenized.pay.bka.sh
    this.baseUrl = config.get<string>('BKASH_BASE_URL', 'https://tokenized.sandbox.bka.sh/v1.2.0-beta');
  }

  private async grantToken(): Promise<void> {
    if (!this.appKey || !this.appSecret) {
      this.logger.warn('bKash credentials not configured');
      return;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<Record<string, string>>(`${this.baseUrl}/tokenized/checkout/token/grant`, {
          app_key: this.appKey,
          app_secret: this.appSecret,
        }, {
          headers: {
            username: this.username,
            password: this.password,
          },
        }),
      );

      this.idToken = response.data['id_token'] ?? null;
      this.refreshToken = response.data['refresh_token'] ?? null;
      // id_token typically expires in 3600s
      this.tokenExpiresAt = new Date(Date.now() + 3500 * 1000);
    } catch (err) {
      this.logger.error('bKash grantToken failed', err);
      throw new Error('bkash_auth_failed');
    }
  }

  private async ensureToken(): Promise<string> {
    if (!this.idToken || !this.tokenExpiresAt || this.tokenExpiresAt < new Date()) {
      await this.grantToken();
    }
    return this.idToken!;
  }

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResult> {
    if (!this.appKey || !this.appSecret) {
      this.logger.warn('bKash credentials not configured - using stub');
      return {
        providerRef: `bkash_stub_${params.idempotencyKey}`,
        payUrl: `http://localhost:3000/stub-bkash?invoice=${params.idempotencyKey}`,
      };
    }

    const token = await this.ensureToken();
    const amountBDT = (params.amountMinor / 100).toFixed(2);

    try {
      const response = await firstValueFrom(
        this.httpService.post<Record<string, string>>(`${this.baseUrl}/tokenized/checkout/create`, {
          mode: '0011', // Checkout URL mode
          payerReference: params.buyerPhone,
          callbackURL: params.successUrl,
          amount: amountBDT,
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: params.idempotencyKey,
        }, {
          headers: {
            Authorization: token,
            'X-App-Key': this.appKey,
          },
        }),
      );

      return {
        providerRef: response.data['paymentID'] ?? '',
        payUrl: response.data['bkashURL'] ?? '',
      };
    } catch (err) {
      this.logger.error('bKash createPaymentLink failed', err);
      throw new Error('provider_unavailable');
    }
  }

  async validatePayment(params: ValidatePaymentParams): Promise<PaymentValidationResult> {
    if (!this.appKey) {
      return { status: 'VALID', amountMinor: 0, currency: 'BDT', rawPayload: {} };
    }

    const token = await this.ensureToken();

    try {
      const response = await firstValueFrom(
        this.httpService.post<Record<string, string>>(`${this.baseUrl}/tokenized/checkout/execute`, {
          paymentID: params.providerRef,
        }, {
          headers: {
            Authorization: token,
            'X-App-Key': this.appKey,
          },
        }),
      );

      const data = response.data;
      if (data['statusCode'] === '0000' && data['transactionStatus'] === 'Completed') {
        return {
          status: 'VALID',
          amountMinor: Math.round(parseFloat(data['amount'] || '0') * 100),
          currency: 'BDT',
          rawPayload: data as unknown as Record<string, unknown>,
        };
      }

      return { status: 'FAILED', amountMinor: 0, currency: 'BDT', rawPayload: data as unknown as Record<string, unknown> };
    } catch (err) {
      this.logger.error('bKash validatePayment failed', err);
      throw new Error('provider_unavailable');
    }
  }

  async refund(params: RefundPaymentParams): Promise<RefundResult> {
    this.logger.warn(`[bKash REFUND STUB] refund for ${params.providerRef}`);
    // Integration boundary: bKash refund requires specific API call
    return { providerRef: `bkash_refund_stub`, status: 'manual_required' };
  }

  async queryPaymentStatus(providerRef: string): Promise<PaymentValidationResult> {
    if (!this.appKey) {
      return { status: 'FAILED', amountMinor: 0, currency: 'BDT', rawPayload: {} };
    }

    const token = await this.ensureToken();

    try {
      const response = await firstValueFrom(
        this.httpService.post<Record<string, string>>(`${this.baseUrl}/tokenized/checkout/payment/status`, {
          paymentID: providerRef,
        }, {
          headers: {
            Authorization: token,
            'X-App-Key': this.appKey,
          },
        }),
      );

      const data = response.data;
      if (data['transactionStatus'] === 'Completed') {
        return {
          status: 'VALID',
          amountMinor: Math.round(parseFloat(data['amount'] || '0') * 100),
          currency: 'BDT',
          rawPayload: data as unknown as Record<string, unknown>,
        };
      }

      return { status: 'FAILED', amountMinor: 0, currency: 'BDT', rawPayload: data };
    } catch (err) {
      this.logger.error('bKash queryPaymentStatus failed', err);
      return { status: 'FAILED', amountMinor: 0, currency: 'BDT', rawPayload: {} };
    }
  }
}
