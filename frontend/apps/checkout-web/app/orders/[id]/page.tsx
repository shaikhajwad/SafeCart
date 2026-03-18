import { notFound } from 'next/navigation';
import Link from 'next/link';
import PayButton from './PayButton';

interface StatusHistoryEntry {
  id: string;
  status: string;
  createdAt: string;
  note?: string;
}

interface Order {
  id: string;
  orderRef: string;
  status: string;
  buyerName: string;
  buyerPhone: string;
  addressLine1: string;
  addressLine2?: string;
  district: string;
  thana: string;
  postalCode?: string;
  specialInstructions?: string;
  quantity: number;
  unitPricePaisa: number;
  totalPaisa: number;
  createdAt: string;
  updatedAt: string;
  statusHistory?: StatusHistoryEntry[];
  product?: { title: string; imageCoverUrl?: string };
  sellerOrg?: { name: string };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  CHECKOUT_STARTED: 'Checkout Started',
  PAYMENT_PENDING: 'Awaiting Payment',
  PAID: 'Payment Received',
  SHIPMENT_BOOKED: 'Shipment Booked',
  IN_TRANSIT: 'Out for Delivery',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTE_OPEN: 'Dispute Open',
  REFUNDED: 'Refunded',
};

const STATUS_STEPS = [
  'PAYMENT_PENDING',
  'PAID',
  'SHIPMENT_BOOKED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
] as const;

function statusBadgeCls(status: string): string {
  switch (status) {
    case 'COMPLETED':
    case 'DELIVERED':
      return 'bg-green-100 text-green-700';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'bg-red-100 text-red-600';
    case 'DISPUTE_OPEN':
      return 'bg-yellow-100 text-yellow-700';
    case 'PAID':
    case 'SHIPMENT_BOOKED':
    case 'IN_TRANSIT':
      return 'bg-indigo-100 text-indigo-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return '****';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

function formatBDT(paisa: number): string {
  return (paisa / 100).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function getOrder(id: string, accessCode: string | null): Promise<Order | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
  const qs = accessCode ? `?access_code=${encodeURIComponent(accessCode)}` : '';
  try {
    const res = await fetch(`${apiBase}/api/orders/${id}${qs}`, {
      cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json() as Promise<Order>;
  } catch {
    return null;
  }
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ access_code?: string; payment?: string }>;
}) {
  const { id } = await params;
  const { access_code: accessCode, payment: paymentResult } = await searchParams;

  const order = await getOrder(id, accessCode ?? null);

  if (!order) {
    notFound();
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 mb-3 shadow">
            <span className="text-white text-base font-bold">S</span>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">SafeCart</h1>
          <p className="text-xs text-gray-400 mt-0.5">Order Confirmation &amp; Tracking</p>
        </div>

        {/* Payment result banner */}
        {paymentResult === 'success' && (
          <div role="alert" className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 font-medium text-center">
            ✅ Payment received! Your order is being processed.
          </div>
        )}
        {paymentResult === 'failed' && (
          <div role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium text-center">
            ❌ Payment failed. Please try again below.
          </div>
        )}
        {paymentResult === 'cancelled' && (
          <div role="alert" className="mb-4 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-700 font-medium text-center">
            ⚠️ Payment was cancelled. You can try again below.
          </div>
        )}

        {/* Status card */}
        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Order Reference
              </p>
              <p className="font-bold text-gray-900 text-lg">{order.orderRef}</p>
              {order.sellerOrg && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Seller: {order.sellerOrg.name}
                </p>
              )}
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeCls(order.status)}`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          {/* Product */}
          {order.product && (
            <p className="text-sm font-medium text-gray-800 mb-3">
              {order.product.title}
            </p>
          )}

          {/* Order amounts */}
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Unit price</span>
              <span>৳{formatBDT(order.unitPricePaisa)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Quantity</span>
              <span>{order.quantity}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
              <span>Total</span>
              <span className="text-indigo-700">৳{formatBDT(order.totalPaisa)}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Pay Now — shown when order is awaiting payment and buyer has access_code */}
        {accessCode && (order.status === 'CHECKOUT_STARTED' || order.status === 'PAYMENT_PENDING') && (
          <div className="bg-white rounded-2xl shadow p-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Complete Your Payment</h2>
            <p className="text-xs text-gray-500 mb-4">
              Your order is reserved. Complete payment securely via SSLCommerz to confirm it.
            </p>
            <PayButton orderId={order.id} accessCode={accessCode} />
          </div>
        )}

        {/* Status timeline */}
        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Order Progress
          </h2>
          <ol className="space-y-3" aria-label="Order status timeline">
            {STATUS_STEPS.map((step, idx) => {
              const done = currentStepIdx >= 0 && idx < currentStepIdx;
              const active = idx === currentStepIdx;
              return (
                <li key={step} className="flex items-center gap-3">
                  <div
                    aria-hidden="true"
                    className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      done
                        ? 'bg-green-500 text-white'
                        : active
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {done ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-sm ${
                      done || active
                        ? 'font-medium text-gray-800'
                        : 'text-gray-400'
                    }`}
                  >
                    {STATUS_LABELS[step]}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Status history */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Status History
            </h2>
            <ol className="space-y-3">
              {order.statusHistory.map((entry) => (
                <li
                  key={entry.id}
                  className="border-l-2 border-indigo-200 pl-4 py-0.5"
                >
                  <p className="text-sm font-medium text-gray-800">
                    {STATUS_LABELS[entry.status] ?? entry.status}
                  </p>
                  {entry.note && (
                    <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(entry.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Delivery details */}
        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Delivery Details
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-400">Name</dt>
              <dd className="text-gray-800 font-medium">{order.buyerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Phone</dt>
              <dd className="text-gray-800 font-medium font-mono">
                {maskPhone(order.buyerPhone)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Address</dt>
              <dd className="text-gray-800 text-right max-w-xs">
                {order.addressLine1}
                {order.addressLine2 ? `, ${order.addressLine2}` : ''}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Area</dt>
              <dd className="text-gray-800">
                {order.thana}, {order.district}
                {order.postalCode ? ` – ${order.postalCode}` : ''}
              </dd>
            </div>
            {order.specialInstructions && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400 flex-shrink-0">Notes</dt>
                <dd className="text-gray-600 text-right">
                  {order.specialInstructions}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="text-center pb-6">
          <p className="text-xs text-gray-400">
            🔒 Secured by SafeCart Escrow &middot; Your payment is protected
          </p>
          <Link
            href="/login"
            className="inline-block mt-3 text-xs text-indigo-600 hover:underline"
          >
            Sign in to manage your orders →
          </Link>
        </div>
      </div>
    </div>
  );
}
