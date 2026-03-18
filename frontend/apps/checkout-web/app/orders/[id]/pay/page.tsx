'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PaymentStatus {
  orderId: string;
  orderStatus: string;
  paymentIntents: Array<{
    id: string;
    provider: string;
    status: string;
    amountPaisa: number;
    payUrl?: string;
    createdAt: string;
  }>;
}

export default function PaymentPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const accessCode = searchParams.get('access_code');

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  useEffect(() => {
    const query = accessCode ? `?access_code=${encodeURIComponent(accessCode)}` : '';
    fetch(`/api/orders/${params.id}/payments/status${query}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load payment status');
        return r.json();
      })
      .then((data) => {
        setPaymentStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id, accessCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  if (error || !paymentStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-red-600 font-medium">{error || 'Order not found'}</p>
        </div>
      </div>
    );
  }

  const latestIntent = paymentStatus.paymentIntents?.[0];
  const isPaid = paymentStatus.orderStatus === 'PAID';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={`/orders/${params.id}`} className="text-green-600 hover:text-green-700 font-medium">
            ← Back to Order
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment</h1>
          <p className="text-gray-600 mb-6">Order ID: {params.id}</p>

          {isPaid && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">✓ Payment Received</p>
              <p className="text-green-600 text-sm">Your payment has been successfully processed.</p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>

            {paymentStatus.paymentIntents?.length === 0 ? (
              <p className="text-gray-500">No payment intents found</p>
            ) : (
              <div className="space-y-4">
                {paymentStatus.paymentIntents?.map((intent) => (
                  <div key={intent.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 capitalize">{intent.provider}</p>
                        <p className="text-sm text-gray-500">{new Date(intent.createdAt).toLocaleString()}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                          intent.status === 'succeeded'
                            ? 'bg-green-100 text-green-800'
                            : intent.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {intent.status}
                      </span>
                    </div>

                    <p className="text-lg font-semibold text-gray-900 mb-4">
                      BDT {(intent.amountPaisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </p>

                    {intent.payUrl && intent.status === 'processing' && (
                      <a
                        href={intent.payUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                      >
                        Complete Payment →
                      </a>
                    )}

                    {intent.id === selectedPaymentId && (
                      <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        <p>Payment ID: <code className="bg-gray-200 px-1 rounded">{intent.id}</code></p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <Link href={`/orders/${params.id}`} className="text-green-600 hover:text-green-700 font-medium">
              ← Back to Order Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
