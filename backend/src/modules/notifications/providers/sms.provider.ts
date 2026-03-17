import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);

  constructor(private configService: ConfigService) {}

  async send(phone: string, message: string): Promise<{ messageId: string }> {
    const apiKey = this.configService.get<string>('SMS_API_KEY');
    const senderId = this.configService.get<string>('SMS_SENDER_ID') ?? 'SafeCart';

    if (!apiKey) {
      this.logger.warn(`SMS not configured. Would send to ${phone}: ${message}`);
      return { messageId: 'dev-mock-' + Date.now() };
    }

    // Example: SSL Wireless BD SMS gateway
    const response = await axios.get<{ status: string; smsid: string }>(
      'https://sms.sslwireless.com/pushapi/dynamic/server.php',
      {
        params: {
          api_token: apiKey,
          sid: senderId,
          sms: message,
          msisdn: phone,
          csmsid: `sc-${Date.now()}`,
        },
      },
    );

    this.logger.log(`SMS sent to ${phone}, status: ${response.data.status}`);
    return { messageId: response.data.smsid };
  }
}
