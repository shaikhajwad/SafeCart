'use client';

import { useState } from 'react';

interface PayButtonProps {
  orderId: string;
  accessCode: string;
}

export default function PayButton({ orderId, accessCode }: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePay() {
    setLoading(true);
    setError('');
    try {
      // Use relative URL — Next.js rewrites /api/* to the backend (works both locally and in Docker)
      const res = await fetch(
        `/api/orders/${orderId}/payments/initiate/buyer?access_code=${encodeURIComponent(accessCode)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'sslcommerz' }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: { message?: string }; message?: string };
        throw new Error(data?.error?.message ?? data?.message ?? 'Failed to initiate payment');
      }
      const { payUrl } = await res.json() as { payUrl: string };
      window.location.href = payUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}
      <button
        onClick={() => { void handlePay(); }}
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Redirecting to payment…' : '💳 Pay Now via SSLCommerz'}
      </button>
      <p className="mt-2 text-center text-xs text-gray-400">
        You will be redirected to the SSLCommerz secure payment gateway.
      </p>
    </div>
  );
}
