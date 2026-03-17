import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Order } from '../../../orders/entities/order.entity';

@Injectable()
export class PathaoAdapter {
  private readonly logger = new Logger(PathaoAdapter.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private configService: ConfigService) {
    const isSandbox = configService.get<string>('NODE_ENV') !== 'production';
    this.baseUrl = isSandbox
      ? 'https://hermes-sandbox.pathao.com'
      : 'https://api-hermes.pathao.com';
    this.clientId = configService.get<string>('PATHAO_CLIENT_ID') ?? '';
    this.clientSecret = configService.get<string>('PATHAO_CLIENT_SECRET') ?? '';
  }

  private async getAccessToken(): Promise<string> {
    const response = await axios.post<{ access_token: string }>(
      `${this.baseUrl}/aladdin/api/v1/issue-token`,
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: this.configService.get<string>('PATHAO_USERNAME'),
        password: this.configService.get<string>('PATHAO_PASSWORD'),
        grant_type: 'password',
      },
    );
    return response.data.access_token;
  }

  async createOrder(order: Order): Promise<{ consignmentId: string }> {
    const token = await this.getAccessToken();
    const response = await axios.post<{ data: { consignment_id: string } }>(
      `${this.baseUrl}/aladdin/api/v1/orders`,
      {
        store_id: this.configService.get<string>('PATHAO_STORE_ID'),
        merchant_order_id: order.orderRef,
        recipient_name: order.buyerName,
        recipient_phone: order.buyerPhone,
        recipient_address: `${order.addressLine1}, ${order.thana}, ${order.district}`,
        recipient_city: order.district,
        recipient_zone: order.thana,
        delivery_type: 48, // regular
        item_type: 2, // parcel
        item_quantity: order.quantity,
        item_weight: 0.5,
        amount_to_collect: Number(order.totalPaisa) / 100,
        item_description: `Order ${order.orderRef}`,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return { consignmentId: response.data.data.consignment_id };
  }

  async getShipmentStatus(consignmentId: string): Promise<string> {
    const token = await this.getAccessToken();
    const response = await axios.get<{ data: { order_status: string } }>(
      `${this.baseUrl}/aladdin/api/v1/orders/summary`,
      {
        params: { consignment_id: consignmentId },
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data.data.order_status;
  }
}
