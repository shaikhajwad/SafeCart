'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface TrackingEvent {
  id: string;
  status: string;
  description?: string;
  location?: string;
  eventTime: string;
}

interface OrderTracking {
  id: string;
  orderRef: string;
  status: string;
  buyerName: string;
  district: string;
  thana: string;
  quantity: number;
  totalPaisa: number;
  shipment?: {
    provider: string;
    trackingNumber?: string;
    trackingUrl?: string;
    status: string;
    events: TrackingEvent[];
    estimatedDeliveryAt?: string;
    deliveredAt?: string;
  };
}

const STATUS_STEPS = [
  'PAYMENT_PENDING',
  'PAID',
  'SHIPMENT_BOOKED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  CHECKOUT_STARTED: 'Checkout Started',
  PAYMENT_PENDING: 'Payment Pending',
  PAID: 'Payment Received',
  SHIPMENT_BOOKED: 'Shipment Booked',
  IN_TRANSIT: 'Out for Delivery',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTE_OPEN: 'Dispute Open',
  REFUNDED: 'Refunded',
};

export default function OrderTrackPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const accessCode = searchParams.get('code');

  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `/api/orders/${params.id}/track${accessCode ? `?access_code=${accessCode}` : ''}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setOrder(data); setLoading(false); })
      .catch(() => { setError('Order not found'); setLoading(false); });
  }, [params.id, accessCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-red-600 font-medium">{error ?? 'Order not found'}</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-green-700">SafeCart</h1>
          <p className="text-gray-500 text-sm">Order Tracking</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Order Reference</p>
              <p className="font-bold text-gray-800">{order.orderRef}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
              order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
              order.status === 'DISPUTE_OPEN' ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <p>Delivering to: {order.buyerName} · {order.thana}, {order.district}</p>
            <p className="mt-1 font-medium text-gray-800">
              Total: ৳{(Number(order.totalPaisa) / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="font-semibold text-gray-700 mb-4">Delivery Progress</h3>
          <div className="space-y-3">
            {STATUS_STEPS.map((step, idx) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  idx < currentStepIndex ? 'bg-green-500 text-white' :
                  idx === currentStepIndex ? 'bg-green-600 text-white ring-4 ring-green-100' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {idx < currentStepIndex ? '✓' : idx + 1}
                </div>
                <span className={`text-sm ${
                  idx <= currentStepIndex ? 'text-gray-800 font-medium' : 'text-gray-400'
                }`}>
                  {STATUS_LABELS[step]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipment Events */}
        {order.shipment?.events && order.shipment.events.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-700 mb-4">
              Courier Updates ({order.shipment.provider})
            </h3>
            {order.shipment.trackingNumber && (
              <p className="text-xs text-gray-500 mb-3">
                Tracking #: {order.shipment.trackingNumber}
              </p>
            )}
            <div className="space-y-3">
              {order.shipment.events.map((event) => (
                <div key={event.id} className="border-l-2 border-green-200 pl-4">
                  <p className="text-sm font-medium text-gray-800">{event.status}</p>
                  {event.description && (
                    <p className="text-xs text-gray-500">{event.description}</p>
                  )}
                  {event.location && (
                    <p className="text-xs text-gray-400">📍 {event.location}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(event.eventTime).toLocaleString('en-BD')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
