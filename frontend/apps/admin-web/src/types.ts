export interface User {
  id: string;
  phone: string;
  phoneE164?: string;
  email?: string;
  fullName?: string;
  role: string;
  status?: string;
  createdAt?: string;
}

export interface Org {
  id: string;
  slug?: string;
  displayName?: string;
  name: string;
  status?: string;
  contactPhone?: string;
  website?: string;
  tradeLicense?: string;
  tin?: string;
  ubid?: string;
  supportPhone?: string;
  supportEmail?: string;
  createdAt?: string;
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
  org?: Org;
}

export interface VerificationDocument {
  id: string;
  type: string;
  fileKey: string;
  description?: string;
}

export interface VerificationRequest {
  id: string;
  orgId: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  reason?: string;
  org?: Org;
  documents?: VerificationDocument[];
}

export interface Dispute {
  id: string;
  orderId: string;
  openedBy: string;
  reason: string;
  status: string;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  order?: Order;
}

export interface DashboardStats {
  totalOrgs: number;
  pendingVerifications: number;
  openDisputes: number;
  totalOrders: number;
  recentOrders?: Order[];
}

export interface Refund {
  id: string;
  orderId: string;
  paymentIntentId: string;
  amountPaisa: number;
  reason: string;
  status: string;
  providerRefundId?: string;
  initiatedByUserId?: string;
  createdAt: string;
}
