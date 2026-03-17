import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Order } from '../../../orders/entities/order.entity';

interface BkashTokenResponse {
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

interface BkashPaymentCreateResponse {
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  successCallbackURL: string;
  failureCallbackURL: string;
  cancelledCallbackURL: string;
  amount: string;
  intent: string;
  currency: string;
  paymentCreateTime: string;
  transactionStatus: string;
  merchantInvoiceNumber: string;
}

interface BkashPaymentExecuteResponse {
  paymentID: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  merchantInvoiceNumber: string;
}

@Injectable()
export class BkashAdapter {
  private readonly logger = new Logger(BkashAdapter.name);
  private readonly baseUrl: string;
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly username: string;
  private readonly password: string;

  constructor(private configService: ConfigService) {
    const isSandbox = configService.get<string>('NODE_ENV') !== 'production';
    this.baseUrl = isSandbox
      ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
      : 'https://tokenized.pay.bka.sh/v1.2.0-beta';
    this.appKey = configService.get<string>('BKASH_APP_KEY') ?? '';
    this.appSecret = configService.get<string>('BKASH_APP_SECRET') ?? '';
    this.username = configService.get<string>('BKASH_USERNAME') ?? '';
    this.password = configService.get<string>('BKASH_PASSWORD') ?? '';
  }

  async grantToken(): Promise<string> {
    const response = await axios.post<BkashTokenResponse>(
      `${this.baseUrl}/tokenized/checkout/token/grant`,
      { app_key: this.appKey, app_secret: this.appSecret },
      {
        headers: {
          'Content-Type': 'application/json',
          username: this.username,
          password: this.password,
        },
      },
    );
    return response.data.id_token;
  }

  async createPayment(order: Order, callbackBaseUrl: string): Promise<{ paymentId: string; bkashUrl: string }> {
    const token = await this.grantToken();
    const response = await axios.post<BkashPaymentCreateResponse>(
      `${this.baseUrl}/tokenized/checkout/create`,
      {
        mode: '0011',
        payerReference: order.buyerPhone,
        callbackURL: `${callbackBaseUrl}/api/webhooks/payments/bkash`,
        amount: (Number(order.totalPaisa) / 100).toFixed(2),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: order.orderRef,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
          'X-App-Key': this.appKey,
        },
      },
    );

    return {
      paymentId: response.data.paymentID,
      bkashUrl: response.data.bkashURL,
    };
  }

  async executePayment(paymentId: string): Promise<BkashPaymentExecuteResponse> {
    const token = await this.grantToken();
    const response = await axios.post<BkashPaymentExecuteResponse>(
      `${this.baseUrl}/tokenized/checkout/execute`,
      { paymentID: paymentId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
          'X-App-Key': this.appKey,
        },
      },
    );
    return response.data;
  }

  async queryPayment(paymentId: string): Promise<{ status: string; trxId?: string }> {
    const token = await this.grantToken();
    const response = await axios.post<{ transactionStatus: string; trxID?: string }>(
      `${this.baseUrl}/tokenized/checkout/payment/status`,
      { paymentID: paymentId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
          'X-App-Key': this.appKey,
        },
      },
    );
    return { status: response.data.transactionStatus, trxId: response.data.trxID };
  }
}
