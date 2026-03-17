import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Order } from '../../../orders/entities/order.entity';

@Injectable()
export class EcourierAdapter {
  private readonly logger = new Logger(EcourierAdapter.name);
  private readonly baseUrl = 'https://ecourier.com.bd/api';
  private readonly apiKey: string;
  private readonly apiPassword: string;
  private readonly merchantCode: string;

  constructor(private configService: ConfigService) {
    this.apiKey = configService.get<string>('ECOURIER_API_KEY') ?? '';
    this.apiPassword = configService.get<string>('ECOURIER_API_PASSWORD') ?? '';
    this.merchantCode = configService.get<string>('ECOURIER_MERCHANT_CODE') ?? '';
  }

  async createParcel(order: Order): Promise<{ trackingCode: string }> {
    const response = await axios.post<{ Tracking: string }>(
      `${this.baseUrl}/order-add`,
      {
        API_KEY: this.apiKey,
        API_PASSWORD: this.apiPassword,
        MERCHANT_CODE: this.merchantCode,
        MERCHANT_ORDER_ID: order.orderRef,
        RECIPIENT_NAME: order.buyerName,
        RECIPIENT_MOBILE: order.buyerPhone,
        RECIPIENT_ADDRESS: order.addressLine1,
        RECIPIENT_CITY: order.district,
        RECIPIENT_THANA: order.thana,
        PRODUCT_PRICE: Number(order.totalPaisa) / 100,
        PAYMENT_METHOD: 'COD',
        PARCEL_TYPE: 'Box',
        QUANTITY: order.quantity,
        WEIGHT: 0.5,
        PRODUCT_TYPE: 'Goods',
      },
    );
    return { trackingCode: response.data.Tracking };
  }
}
