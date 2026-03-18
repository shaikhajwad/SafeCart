export interface User {
  id: string;
  phone: string;
  role: string;
}

export interface Org {
  id: string;
  name: string;
  contactPhone?: string;
  website?: string;
  description?: string;
  tradeLicense?: string;
  tin?: string;
  ubid?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  pricePaisa: number;
  currency: string;
  sku?: string;
  stock?: number;
  orgId: string;
  images?: string[];
}

export interface CheckoutSession {
  id: string;
  token: string;
  orgId: string;
  productId: string;
  lockedPricePaisa: number;
  customTitle?: string;
  status: string;
  quantity?: number;
  expiresAt?: string;
}

export interface Order {
  id: string;
  orderRef: string;
  orgId: string;
  status: string;
  buyerName: string;
  buyerPhone: string;
  district: string;
  thana: string;
  addressLine1: string;
  totalPaisa: number;
  createdAt: string;
}
