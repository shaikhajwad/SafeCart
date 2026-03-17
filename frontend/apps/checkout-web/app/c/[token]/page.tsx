'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface CheckoutSession {
  id: string;
  token: string;
  productId: string;
  quantity: number;
  lockedPricePaisa: number;
  customTitle?: string;
}

interface OrderForm {
  buyerName: string;
  buyerPhone: string;
  addressLine1: string;
  district: string;
  thana: string;
  paymentProvider: 'sslcommerz' | 'bkash';
}

export default function CheckoutPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<OrderForm>({
    buyerName: '',
    buyerPhone: '',
    addressLine1: '',
    district: '',
    thana: '',
    paymentProvider: 'bkash',
  });

  useEffect(() => {
    fetch(`/api/proxy/checkout-sessions/${params.token}`)
      .then((r) => r.json())
      .then((data) => { setSession(data); setLoading(false); })
      .catch(() => { setError('Checkout link not found or expired'); setLoading(false); });
  }, [params.token]);

  const totalBDT = session ? (Number(session.lockedPricePaisa) * session.quantity) / 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setError(null);

    try {
      // Create order
      const orderRes = await fetch(`/api/proxy/checkout-sessions/${params.token}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: form.buyerName,
          buyerPhone: form.buyerPhone,
          addressLine1: form.addressLine1,
          district: form.district,
          thana: form.thana,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error?.message ?? 'Failed to create order');
      }

      const order = await orderRes.json();

      // Initiate payment
      const payRes = await fetch(`/api/proxy/orders/${order.id}/payments/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: form.paymentProvider }),
      });

      if (!payRes.ok) {
        const err = await payRes.json();
        throw new Error(err.error?.message ?? 'Failed to initiate payment');
      }

      const payment = await payRes.json();
      // Redirect to payment gateway
      window.location.href = payment.payUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-red-600 text-lg font-medium">{error}</p>
          <p className="text-gray-500 mt-2">Please contact the seller for a new link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-green-700">SafeCart</h1>
          <p className="text-gray-500 text-sm mt-1">Secure Checkout</p>
        </div>

        {/* Product Summary */}
        {session && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {session.customTitle ?? 'Your Order'}
            </h2>
            <div className="flex justify-between items-center text-gray-600">
              <span>Quantity: {session.quantity}</span>
              <span className="text-xl font-bold text-green-700">
                ৳{totalBDT.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Order Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-md font-semibold text-gray-700 mb-4">Shipping & Payment</h3>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={form.buyerName}
                onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={form.buyerPhone}
                onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="+8801XXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                required
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="House/Road/Area"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input
                  type="text"
                  required
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Dhaka"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thana/Upazila</label>
                <input
                  type="text"
                  required
                  value={form.thana}
                  onChange={(e) => setForm({ ...form, thana: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Gulshan"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {(['bkash', 'sslcommerz'] as const).map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => setForm({ ...form, paymentProvider: provider })}
                    className={`border-2 rounded-md p-3 text-center text-sm font-medium transition-colors ${
                      form.paymentProvider === provider
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {provider === 'bkash' ? '📱 bKash' : '💳 Card/MFS'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white font-semibold py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {submitting ? 'Processing...' : `Pay ৳${totalBDT.toFixed(2)}`}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            🔒 Secured by SafeCart Escrow · Your payment is protected
          </p>
        </div>
      </div>
    </div>
  );
}
