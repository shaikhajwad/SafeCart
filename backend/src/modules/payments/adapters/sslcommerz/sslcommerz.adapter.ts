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
    this.isSandbox = configService.get<string>('NODE_ENV') !== 'production';
  }

  private get baseUrl(): string {
    return this.isSandbox
      ? 'https://sandbox.sslcommerz.com'
      : 'https://securepay.sslcommerz.com';
  }

  async createPaymentSession(order: Order, callbackBaseUrl: string): Promise<string> {
    const payload = {
      store_id: this.storeId,
      store_passwd: this.storePassword,
      total_amount: (Number(order.totalPaisa) / 100).toFixed(2),
      currency: 'BDT',
      tran_id: order.id,
      success_url: `${callbackBaseUrl}/api/webhooks/payments/sslcommerz/ipn`,
      fail_url: `${callbackBaseUrl}/api/webhooks/payments/sslcommerz/ipn`,
      cancel_url: `${callbackBaseUrl}/api/webhooks/payments/sslcommerz/ipn`,
      ipn_url: `${callbackBaseUrl}/api/webhooks/payments/sslcommerz/ipn`,
      cus_name: order.buyerName,
      cus_phone: order.buyerPhone,
      cus_email: 'buyer@safecart.com',
      cus_add1: order.addressLine1,
      cus_city: order.district,
      cus_country: 'Bangladesh',
      shipping_method: 'Courier',
      product_name: `Order ${order.orderRef}`,
      product_category: 'General',
      product_profile: 'general',
    };

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
