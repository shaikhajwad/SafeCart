import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './identity.service';

/**
 * SMS provider adapter.
 * Integration boundary: replace this stub with actual SMS provider (e.g., SSL Wireless, InfoBip)
 * credentials/endpoint when available.
 * 
 * Assumption: SMS provider credentials are passed via environment variables.
 * Tracked in TRACK.md: SMS_PROVIDER_URL, SMS_PROVIDER_API_KEY env vars required.
 */
@Injectable()
export class SmsProviderAdapter implements SmsProvider {
  private readonly logger = new Logger(SmsProviderAdapter.name);
  private readonly providerUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.providerUrl = config.get<string>('SMS_PROVIDER_URL', '');
    this.apiKey = config.get<string>('SMS_PROVIDER_API_KEY', '');
  }

  async send(to: string, message: string): Promise<void> {
    if (!this.providerUrl || !this.apiKey) {
      // Development/test fallback: log OTP instead of sending
      this.logger.warn(`[SMS STUB] To: ${to} | Message: ${message}`);
      return;
    }

    // Production: call actual SMS provider REST API
    // TODO: implement actual provider integration when credentials are available
    // Integration boundary marked in TRACK.md
    this.logger.warn(`[SMS STUB] To: ${to} | Message: ${message}`);
  }
}
