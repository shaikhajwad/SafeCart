import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface TrackingEvent {
  id: string;
  status: string;
  description?: string;
  location?: string;
  eventTime: string;
}

interface Shipment {
  id: string;
  orderId: string;
  orderRef: string;
  courier: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: string;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  events?: TrackingEvent[];
  createdAt: string;
}

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch<Shipment>(`/api/shipments/${id}`)
      .then((data) => {
        setShipment(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <div className="flex justify-center py-12">
          <div className="loading loading-spinner loading-lg" />
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <p>{error || 'Shipment not found'}</p>
          <Link to="/shipments" className="link link-primary mt-4">
            Back to Shipments
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = {
    BOOKED: 'badge-warning',
    IN_TRANSIT: 'badge-info',
    DELIVERED: 'badge-success',
    CANCELLED: 'badge-danger',
  }[shipment.status] || 'badge-secondary';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/shipments" className="link link-primary text-sm mb-2 block">
            ← Back to Shipments
          </Link>
          <h1>Shipment #{shipment.orderRef}</h1>
          <p className="text-gray-600 text-sm">Shipment ID: {id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <p className="text-gray-600 text-sm">Status</p>
            <p className="text-xl font-bold capitalize">{shipment.status}</p>
            <p className={`badge ${statusColor} mt-2`}>{shipment.status}</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <p className="text-gray-600 text-sm">Courier</p>
            <p className="text-xl font-bold capitalize">{shipment.courier}</p>
            {shipment.trackingNumber && (
              <p className="text-sm text-gray-500 mt-2">Tracking: {shipment.trackingNumber}</p>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <p className="text-gray-600 text-sm">Estimated Delivery</p>
            <p className="text-xl font-bold">
              {shipment.estimatedDeliveryAt
                ? new Date(shipment.estimatedDeliveryAt).toLocaleDateString('en-BD')
                : 'N/A'}
            </p>
            {shipment.deliveredAt && (
              <p className="text-sm text-green-600 mt-2">Delivered: {new Date(shipment.deliveredAt).toLocaleString('en-BD')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow mb-6">
        <div className="card-body">
          <h2 className="card-title">Order Details</h2>
          <div className="divider my-0" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Order Ref</p>
              <Link to={`/orders/${shipment.orderId}`} className="link link-primary font-semibold">
                {shipment.orderRef}
              </Link>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Order ID</p>
              <p className="font-mono text-sm">{shipment.orderId}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Created</p>
              <p>{new Date(shipment.createdAt).toLocaleString('en-BD')}</p>
            </div>
          </div>
        </div>
      </div>

      {shipment.trackingUrl && (
        <div className="card bg-base-100 shadow mb-6">
          <div className="card-body">
            <h2 className="card-title">Tracking Link</h2>
            <p className="text-sm text-gray-600">Use the courier's tracking page for real-time updates:</p>
            <a
              href={shipment.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary break-all Text-sm mt-2"
            >
              {shipment.trackingUrl}
            </a>
          </div>
        </div>
      )}

      {shipment.events && shipment.events.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Tracking Events</h2>
            <div className="divider my-0" />
            <div className="space-y-4">
              {shipment.events.map((event, idx) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    {idx < shipment.events!.length - 1 && <div className="w-0.5 h-12 bg-gray-300" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-semibold text-gray-900">{event.status}</p>
                    {event.location && <p className="text-sm text-gray-600">{event.location}</p>}
                    {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
                    <p className="text-xs text-gray-500 mt-2">{new Date(event.eventTime).toLocaleString('en-BD')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
