import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Order } from '../../../orders/entities/order.entity';

@Injectable()
export class RedxAdapter {
  private readonly logger = new Logger(RedxAdapter.name);
  private readonly baseUrl = 'https://openapi.redx.com.bd/v1.0.0-beta';
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = configService.get<string>('REDX_API_KEY') ?? '';
  }

  async createParcel(order: Order): Promise<{ trackingId: string }> {
    const response = await axios.post<{ tracking_id: number }>(
      `${this.baseUrl}/parcel`,
      {
        name: order.buyerName,
        phone: order.buyerPhone,
        address: `${order.addressLine1}, ${order.thana}, ${order.district}`,
        merchant_invoice_id: order.orderRef,
        cash_collection_amount: Number(order.totalPaisa) / 100,
        value: Number(order.totalPaisa) / 100,
        parcel_weight: 500,
        delivery_area: order.district,
        delivery_area_id: 1,
      },
      { headers: { 'API-ACCESS-TOKEN': `Bearer ${this.apiKey}` } },
    );
    return { trackingId: String(response.data.tracking_id) };
  }
}
