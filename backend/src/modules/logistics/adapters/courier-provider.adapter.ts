/**
 * Courier provider adapter interface.
 * Each courier (Pathao, Paperfly, eCourier, RedX) implements this interface.
 */
export interface CourierQuoteParams {
  orderId: string;
  originCity: string;
  destinationCity: string;
  destinationPostcode?: string;
  weightGrams: number;
  isCod: boolean;
  codAmountMinor?: number;
}

export interface CourierQuote {
  provider: string;
  feeMinor: number;
  codFeeMinor: number;
  estimatedDays: number;
  currency: string;
}

export interface BookShipmentParams {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientPostcode?: string;
  weightGrams: number;
  codAmountMinor: number;
  idempotencyKey: string;
  notes?: string;
}

export interface ShipmentBookingResult {
  providerRef: string;
  trackingId: string;
  status: string;
}

export abstract class CourierProviderAdapter {
  abstract readonly provider: string;
  abstract getQuote(params: CourierQuoteParams): Promise<CourierQuote | null>;
  abstract bookShipment(params: BookShipmentParams): Promise<ShipmentBookingResult>;
  abstract trackShipment(trackingId: string): Promise<Record<string, unknown>>;
}
