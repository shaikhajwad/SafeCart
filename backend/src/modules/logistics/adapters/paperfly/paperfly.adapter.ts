import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Order } from '../../../orders/entities/order.entity';

@Injectable()
export class PaperflyAdapter {
  private readonly logger = new Logger(PaperflyAdapter.name);
  private readonly baseUrl = 'https://api.paperfly.com.bd/api/v1';
  private readonly apiKey: string;
  private readonly merchantId: string;

  constructor(private configService: ConfigService) {
    this.apiKey = configService.get<string>('PAPERFLY_API_KEY') ?? '';
    this.merchantId = configService.get<string>('PAPERFLY_MERCHANT_ID') ?? '';
  }

  async createShipment(order: Order): Promise<{ trackingNumber: string }> {
    const response = await axios.post<{ data: { tracking_number: string } }>(
      `${this.baseUrl}/shipment/create`,
      {
        merchant_id: this.merchantId,
        order_id: order.orderRef,
        customer_name: order.buyerName,
        customer_phone: order.buyerPhone,
        customer_address: order.addressLine1,
        district: order.district,
        thana: order.thana,
        weight: 0.5,
        cod_amount: Number(order.totalPaisa) / 100,
      },
      { headers: { 'X-Api-Key': this.apiKey } },
    );
    return { trackingNumber: response.data.data.tracking_number };
  }
}
