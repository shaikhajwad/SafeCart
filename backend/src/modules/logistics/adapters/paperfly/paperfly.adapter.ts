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
 * Paperfly Courier Adapter
 * 
 * Published rates (same city up to 1kg): ৳70 (7000 minor)
 * COD fee: 0% same city, 1% other zones
 * 
 * Integration boundary: PAPERFLY_API_KEY, PAPERFLY_BASE_URL env vars required.
 */
@Injectable()
export class PaperflyAdapter extends CourierProviderAdapter {
  readonly provider = 'paperfly';
  private readonly logger = new Logger(PaperflyAdapter.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    super();
    this.apiKey = config.get<string>('PAPERFLY_API_KEY', '');
    this.baseUrl = config.get<string>('PAPERFLY_BASE_URL', 'https://api.paperfly.com.bd/v2');
  }

  async getQuote(params: CourierQuoteParams): Promise<CourierQuote | null> {
    // Published rate card fallback
    const sameCityDhaka =
      params.originCity?.toLowerCase().includes('dhaka') &&
      params.destinationCity?.toLowerCase().includes('dhaka');

    const baseFeeMinor = params.weightGrams <= 1000 ? 7000 : 10000;
    const codFeeMinor =
      params.isCod
        ? sameCityDhaka
          ? 0
          : Math.ceil((params.codAmountMinor || 0) * 0.01)
        : 0;

    return {
      provider: this.provider,
      feeMinor: baseFeeMinor,
      codFeeMinor,
      estimatedDays: sameCityDhaka ? 1 : 3,
      currency: 'BDT',
    };
  }

  async bookShipment(params: BookShipmentParams): Promise<ShipmentBookingResult> {
    this.logger.warn('[Paperfly STUB] Booking shipment');
    return {
      providerRef: `paperfly_stub_${params.idempotencyKey}`,
      trackingId: `PF-STUB-${Date.now()}`,
      status: 'booked',
    };
  }

  async trackShipment(trackingId: string): Promise<Record<string, unknown>> {
    return { tracking_id: trackingId, status: 'unknown' };
  }
}
