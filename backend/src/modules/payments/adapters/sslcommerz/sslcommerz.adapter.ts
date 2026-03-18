import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Order } from '../../../orders/entities/order.entity';

export interface SSLCommerzPaymentSession {
  status: string;
  sessionkey: string;
  GatewayPageURL: string;
}

@Injectable()
export class SslcommerzAdapter {
  private readonly logger = new Logger(SslcommerzAdapter.name);
  private readonly storeId: string;
  private readonly storePassword: string;
  private readonly isSandbox: boolean;

  constructor(private configService: ConfigService) {
    this.storeId = configService.get<string>('SSLCOMMERZ_STORE_ID') ?? '';
    this.storePassword = configService.get<string>('SSLCOMMERZ_STORE_PASSWORD') ?? '';
    // Explicit sandbox flag takes precedence; fall back to NODE_ENV check
    const sandboxFlag = configService.get<string>('SSLCOMMERZ_IS_SANDBOX');
    this.isSandbox = sandboxFlag !== undefined
      ? sandboxFlag !== 'false'
      : configService.get<string>('NODE_ENV') !== 'production';
  }

  private get baseUrl(): string {
    return this.isSandbox
      ? 'https://sandbox.sslcommerz.com'
      : 'https://securepay.sslcommerz.com';
  }

  /**
   * Create a payment session.
   * @param order         The order to pay for.
   * @param ipnUrl        Backend IPN / webhook URL (must be publicly reachable).
   * @param frontendOrderUrl  Frontend URL the buyer is redirected to after success/fail/cancel.
   */
  async createPaymentSession(order: Order, ipnUrl: string, frontendOrderUrl: string): Promise<string> {
    const payload = {
      store_id: this.storeId,
      store_passwd: this.storePassword,
      total_amount: (Number(order.totalPaisa) / 100).toFixed(2),
      currency: 'BDT',
      tran_id: order.id,
      success_url: `${frontendOrderUrl}?payment=success`,
      fail_url: `${frontendOrderUrl}?payment=failed`,
      cancel_url: `${frontendOrderUrl}?payment=cancelled`,
      ipn_url: ipnUrl,
      cus_name: order.buyerName,
      cus_phone: order.buyerPhone,
      cus_email: `buyer-${order.id.slice(0, 8)}@safecart.invalid`,
      cus_add1: order.addressLine1,
      cus_city: order.district,
      cus_country: 'Bangladesh',
      shipping_method: 'Courier',
      product_name: `Order ${order.orderRef}`,
      product_category: 'General',
      product_profile: 'general',
    };

    this.logger.debug(`SSLCommerz createPaymentSession sandbox=${this.isSandbox} tran_id=${order.id}`);

    const response = await axios.post<SSLCommerzPaymentSession>(
      `${this.baseUrl}/gwprocess/v4/api.php`,
      new URLSearchParams(payload as Record<string, string>).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    if (response.data.status !== 'SUCCESS') {
      throw new Error(`SSLCommerz session creation failed: ${JSON.stringify(response.data)}`);
    }

    return response.data.GatewayPageURL;
  }

  async validateIPN(payload: Record<string, string>): Promise<boolean> {
    const validationUrl = `${this.baseUrl}/validator/api/validationserverAPI.php?val_id=${payload['val_id']}&store_id=${this.storeId}&store_passwd=${this.storePassword}&format=json`;
    const response = await axios.get<{ status: string }>(validationUrl);
    return response.data.status === 'VALID' || response.data.status === 'VALIDATED';
  }
}
