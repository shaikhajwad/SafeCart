import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CourierProviderAdapter,
  CourierQuoteParams,
  CourierQuote,
  BookShipmentParams,
  ShipmentBookingResult,
} from '../courier-provider.adapter';

/**
 * RedX Courier Adapter
 * Published rate: unspecified (no official public rate card found per Technical Doc)
 * Integration boundary: REDX_API_KEY, REDX_BASE_URL env vars required.
 */
@Injectable()
export class RedxAdapter extends CourierProviderAdapter {
  readonly provider = 'redx';
  private readonly logger = new Logger(RedxAdapter.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async getQuote(_params: CourierQuoteParams): Promise<CourierQuote | null> {
    // No official rate card; return null to signal quote unavailable
    return null;
  }

  async bookShipment(params: BookShipmentParams): Promise<ShipmentBookingResult> {
    this.logger.warn('[RedX STUB] Booking shipment');
    return {
      providerRef: `redx_stub_${params.idempotencyKey}`,
      trackingId: `RX-STUB-${Date.now()}`,
      status: 'booked',
    };
  }

  async trackShipment(trackingId: string): Promise<Record<string, unknown>> {
    return { tracking_id: trackingId, status: 'unknown' };
  }
}
