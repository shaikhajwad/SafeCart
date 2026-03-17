import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  CourierProviderAdapter,
  CourierQuoteParams,
  CourierQuote,
  BookShipmentParams,
  ShipmentBookingResult,
} from '../courier-provider.adapter';

/**
 * Pathao Courier Adapter
 * 
 * Published rates (same city up to 500g): ৳60 (6000 minor)
 * COD fee: 1%
 * 
 * Integration boundary: real credentials go in environment variables.
 * PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_BASE_URL
 */
@Injectable()
export class PathaoAdapter extends CourierProviderAdapter {
  readonly provider = 'pathao';
  private readonly logger = new Logger(PathaoAdapter.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    super();
    this.clientId = config.get<string>('PATHAO_CLIENT_ID', '');
    this.clientSecret = config.get<string>('PATHAO_CLIENT_SECRET', '');
    this.baseUrl = config.get<string>('PATHAO_BASE_URL', 'https://merchant.pathao.com/api/v1');
  }

  async getQuote(params: CourierQuoteParams): Promise<CourierQuote | null> {
    if (!this.clientId) {
      // Published rate card fallback (Pathao same-city up to 500g: ৳60)
      const baseFeeMinor = params.weightGrams <= 500 ? 6000 : 8000;
      const codFeeMinor = params.isCod ? Math.ceil((params.codAmountMinor || 0) * 0.01) : 0;
      return {
        provider: this.provider,
        feeMinor: baseFeeMinor,
        codFeeMinor,
        estimatedDays: 1,
        currency: 'BDT',
      };
    }

    // Production: call Pathao rate API
    this.logger.warn('[Pathao] Live quote API not yet integrated');
    return null;
  }

  async bookShipment(params: BookShipmentParams): Promise<ShipmentBookingResult> {
    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('[Pathao STUB] Booking shipment with stub');
      return {
        providerRef: `pathao_stub_${params.idempotencyKey}`,
        trackingId: `PT-STUB-${Date.now()}`,
        status: 'booked',
      };
    }

    // Production: call Pathao booking API
    this.logger.warn('[Pathao] Live booking API not yet integrated');
    throw new Error('booking_failed');
  }

  async trackShipment(trackingId: string): Promise<Record<string, unknown>> {
    this.logger.warn(`[Pathao STUB] Tracking ${trackingId}`);
    return { tracking_id: trackingId, status: 'unknown' };
  }
}
