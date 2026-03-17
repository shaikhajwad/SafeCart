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
 * eCourier Adapter
 * Published rate (inside Dhaka next day standard): ৳80 (8000 minor)
 * Integration boundary: ECOURIER_API_KEY, ECOURIER_BASE_URL env vars required.
 */
@Injectable()
export class EcourierAdapter extends CourierProviderAdapter {
  readonly provider = 'ecourier';
  private readonly logger = new Logger(EcourierAdapter.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    super();
    this.apiKey = config.get<string>('ECOURIER_API_KEY', '');
    this.baseUrl = config.get<string>('ECOURIER_BASE_URL', 'https://ecourier.com.bd/api');
  }

  async getQuote(params: CourierQuoteParams): Promise<CourierQuote | null> {
    const baseFeeMinor = 8000; // ৳80
    const codFeeMinor = params.isCod ? Math.ceil((params.codAmountMinor || 0) * 0.01) : 0;
    return {
      provider: this.provider,
      feeMinor: baseFeeMinor,
      codFeeMinor,
      estimatedDays: 1,
      currency: 'BDT',
    };
  }

  async bookShipment(params: BookShipmentParams): Promise<ShipmentBookingResult> {
    this.logger.warn('[eCourier STUB] Booking shipment');
    return {
      providerRef: `ecourier_stub_${params.idempotencyKey}`,
      trackingId: `EC-STUB-${Date.now()}`,
      status: 'booked',
    };
  }

  async trackShipment(trackingId: string): Promise<Record<string, unknown>> {
    return { tracking_id: trackingId, status: 'unknown' };
  }
}
