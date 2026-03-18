import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  CHECKOUT_STARTED = 'CHECKOUT_STARTED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  SHIPMENT_BOOKED = 'SHIPMENT_BOOKED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTE_OPEN = 'DISPUTE_OPEN',
  RETURN_IN_TRANSIT = 'RETURN_IN_TRANSIT',
  REFUNDED = 'REFUNDED',
}

/** Allowed state transitions */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.CHECKOUT_STARTED, OrderStatus.CANCELLED],
  [OrderStatus.CHECKOUT_STARTED]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPMENT_BOOKED, OrderStatus.CANCELLED, OrderStatus.DISPUTE_OPEN],
  [OrderStatus.SHIPMENT_BOOKED]: [OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED, OrderStatus.DISPUTE_OPEN, OrderStatus.RETURN_IN_TRANSIT],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.DISPUTE_OPEN, OrderStatus.RETURN_IN_TRANSIT],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
  [OrderStatus.DISPUTE_OPEN]: [OrderStatus.COMPLETED, OrderStatus.REFUNDED, OrderStatus.RETURN_IN_TRANSIT],
  [OrderStatus.RETURN_IN_TRANSIT]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [],
};

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Human-readable order reference */
  @Column({ unique: true, name: 'order_ref' })
  orderRef: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ name: 'checkout_session_id' })
  checkoutSessionId: string;

  @Column({ nullable: true, name: 'buyer_user_id' })
  buyerUserId: string;

  /** Public access code for unauthenticated tracking */
  @Column({ name: 'access_code' })
  accessCode: string;

  @Column({ default: OrderStatus.DRAFT })
  status: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ nullable: true, name: 'variant_id' })
  variantId: string;

  @Column({ default: 1 })
  quantity: number;

  /** Unit price at order creation in paisa */
  @Column({ name: 'unit_price_paisa', type: 'bigint' })
  unitPricePaisa: number;

  /** Subtotal in paisa */
  @Column({ name: 'subtotal_paisa', type: 'bigint' })
  subtotalPaisa: number;

  /** Shipping charge in paisa */
  @Column({ default: 0, name: 'shipping_paisa', type: 'bigint' })
  shippingPaisa: number;

  /** Total in paisa */
  @Column({ name: 'total_paisa', type: 'bigint' })
  totalPaisa: number;

  // Shipping address (flattened for simplicity)
  @Column({ nullable: true, name: 'buyer_name' })
  buyerName: string;

  @Column({ nullable: true, name: 'buyer_phone' })
  buyerPhone: string;

  @Column({ nullable: true, name: 'address_line1' })
  addressLine1: string;

  @Column({ nullable: true, name: 'address_line2' })
  addressLine2: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  thana: string;

  @Column({ nullable: true, name: 'postal_code' })
  postalCode: string;

  @Column({ nullable: true, name: 'special_instructions', type: 'text' })
  specialInstructions: string;

  /** Buyer consent to terms and conditions */
  @Column({ default: false, name: 'consent_terms' })
  consentTerms: boolean;

  /** Buyer consent to cookies and tracking */
  @Column({ default: false, name: 'consent_cookies' })
  consentCookies: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
