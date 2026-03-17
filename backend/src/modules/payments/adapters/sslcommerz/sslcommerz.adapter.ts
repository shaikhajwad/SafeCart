import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as _crypto from 'crypto';
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
 * SSLCOMMERZ Payment Adapter
 * 
 * Integration reference:
 * - IPN + Order Validation API mandatory
 * - risk_level=1 must be held for admin review
 * - tran_id and amount MUST be validated against internal order totals
 * 
 * Integration boundary: real credentials go in environment variables.
 * SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASS, SSLCOMMERZ_BASE_URL
 */
@Injectable()
export class SslCommerzAdapter extends PaymentProviderAdapter {
  readonly provider = 'sslcommerz';
  private readonly logger = new Logger(SslCommerzAdapter.name);
  private readonly storeId: string;
  private readonly storePass: string;
  private readonly baseUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    super();
    this.storeId = config.get<string>('SSLCOMMERZ_STORE_ID', '');
    this.storePass = config.get<string>('SSLCOMMERZ_STORE_PASS', '');
    // sandbox: https://sandbox.sslcommerz.com, prod: https://securepay.sslcommerz.com
    this.baseUrl = config.get<string>('SSLCOMMERZ_BASE_URL', 'https://sandbox.sslcommerz.com');
  }

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResult> {
    if (!this.storeId || !this.storePass) {
      this.logger.warn('SSLCOMMERZ credentials not configured - using stub');
      return {
        providerRef: `stub_${params.idempotencyKey}`,
        payUrl: `http://localhost:3000/stub-payment?tran_id=${params.idempotencyKey}`,
      };
    }

    const amountBDT = (params.amountMinor / 100).toFixed(2);

    const payload = {
      store_id: this.storeId,
      store_passwd: this.storePass,
      total_amount: amountBDT,
      currency: params.currency,
      tran_id: params.idempotencyKey,
      success_url: params.successUrl,
      fail_url: params.failUrl,
      cancel_url: params.cancelUrl,
      ipn_url: params.ipnUrl,
      cus_phone: params.buyerPhone,
      cus_name: params.buyerName || 'Customer',
      shipping_method: 'Courier',
      product_name: `SafeCart Order ${params.orderId}`,
      product_category: 'General',
      product_profile: 'general',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<Record<string, unknown>>(`${this.baseUrl}/gwprocess/v4/api.php`, payload),
      );

      const data = response.data;
      if (data['status'] !== 'SUCCESS') {
        throw new Error(`SSLCOMMERZ init failed: ${String(data['failedreason'] ?? 'unknown')}`);
      }

      return {
        providerRef: payload.tran_id,
        payUrl: String(data['GatewayPageURL'] ?? ''),
      };
    } catch (err) {
      this.logger.error('SSLCOMMERZ createPaymentLink failed', err);
      throw new Error('provider_unavailable');
    }
  }

  async validatePayment(params: ValidatePaymentParams): Promise<PaymentValidationResult> {
    if (!this.storeId || !this.storePass) {
      this.logger.warn('SSLCOMMERZ credentials not configured - returning stub VALID');
      return {
        status: 'VALID',
        amountMinor: 0,
        currency: 'BDT',
        riskLevel: 0,
        rawPayload: {},
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<Record<string, string>>(`${this.baseUrl}/validator/api/validationserverAPI.php`, {
          params: {
            val_id: params.valId,
            store_id: this.storeId,
            store_passwd: this.storePass,
            format: 'json',
          },
        }),
      );

      const data = response.data;
      const riskLevel = parseInt(data['risk_level'] || '0', 10);

      if (data['status'] === 'VALID' || data['status'] === 'VALIDATED') {
        return {
          status: riskLevel === 1 ? 'RISK_HOLD' : 'VALID',
          amountMinor: Math.round(parseFloat(data['amount'] || '0') * 100),
          currency: data['currency_type'] || 'BDT',
          riskLevel,
          rawPayload: data as unknown as Record<string, unknown>,
        };
      }

      return {
        status: data['status'] === 'CANCELLED' ? 'CANCELLED' : 'FAILED',
        amountMinor: 0,
        currency: 'BDT',
        riskLevel,
        rawPayload: data as unknown as Record<string, unknown>,
      };
    } catch (err) {
      this.logger.error('SSLCOMMERZ validatePayment failed', err);
      throw new Error('provider_unavailable');
    }
  }

  async refund(params: RefundPaymentParams): Promise<RefundResult> {
    this.logger.warn(`[SSLCOMMERZ REFUND STUB] refund for ${params.providerRef}`);
    // Integration boundary: SSLCOMMERZ refund API needs to be implemented with actual credentials
    // TRACK.md: SSLCOMMERZ does not have a simple self-service refund API; refunds may need to be manual
    return {
      providerRef: `refund_stub_${params.idempotencyKey}`,
      status: 'manual_required',
    };
  }

  async queryPaymentStatus(providerRef: string): Promise<PaymentValidationResult> {
    if (!this.storeId || !this.storePass) {
      this.logger.warn('SSLCOMMERZ credentials not configured - returning stub');
      return { status: 'FAILED', amountMinor: 0, currency: 'BDT', rawPayload: {} };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<Record<string, unknown>>(`${this.baseUrl}/validator/api/merchantTransIDvalidationAPI.php`, {
          params: {
            merchant_trans_id: providerRef,
            store_id: this.storeId,
            store_passwd: this.storePass,
            format: 'json',
          },
        }),
      );

      const data = response.data;
      // Handle response - may have multiple transactions; take most recent
      if (data['status'] === 'VALID' && data['element']) {
        const element = data['element'];
        const txn = Array.isArray(element) ? (element[0] as Record<string, string>) : (element as Record<string, string>);
        return {
          status: 'VALID',
          amountMinor: Math.round(parseFloat(txn['amount'] || '0') * 100),
          currency: txn['currency_type'] || 'BDT',
          rawPayload: data,
        };
      }

      return { status: 'FAILED', amountMinor: 0, currency: 'BDT', rawPayload: data };
    } catch (err) {
      this.logger.error('SSLCOMMERZ queryPaymentStatus failed', err);
      return { status: 'FAILED', amountMinor: 0, currency: 'BDT', rawPayload: {} };
    }
  }
}
