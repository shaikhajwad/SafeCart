import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { Order } from '../types';

function formatBDT(paisa: number): string {
  return 'BDT ' + (paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 });
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'completed' || status === 'delivered'
      ? 'badge badge-success'
      : status === 'cancelled' || status === 'failed'
        ? 'badge badge-danger'
        : status === 'pending'
          ? 'badge badge-warning'
          : 'badge badge-info';
  return <span className={cls}>{status}</span>;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['completed'],
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiFetch<Order>(`/api/orders/${id}`)
      .then(setOrder)
      .catch(() => setError('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: string) {
    if (!id) return;
    setUpdating(true);
    setError('');
    try {
      const updated = await apiFetch<Order>(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="text-center text-muted">Loading order…</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page">
        <div className="alert alert-danger">{error || 'Order not found.'}</div>
        <button className="btn btn-ghost" onClick={() => navigate('/orders')}>← Back to Orders</button>
      </div>
    );
  }

  const nextStatuses = ALLOWED_TRANSITIONS[order.status] ?? [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/orders')}>
            ← Orders
          </button>
          <h1 className="page-title">Order {order.orderRef}</h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div className="detail-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Buyer Information</h2>
          </div>
          <div className="card-body">
            <dl className="detail-list">
              <dt>Name</dt>
              <dd>{order.buyerName}</dd>
              <dt>Phone</dt>
              <dd>{order.buyerPhone}</dd>
              <dt>District</dt>
              <dd>{order.district}</dd>
              <dt>Thana</dt>
              <dd>{order.thana}</dd>
              <dt>Address</dt>
              <dd>{order.addressLine1}</dd>
            </dl>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Order Summary</h2>
          </div>
          <div className="card-body">
            <dl className="detail-list">
              <dt>Order Ref</dt>
              <dd className="font-mono">{order.orderRef}</dd>
              <dt>Total</dt>
              <dd className="font-mono text-lg">{formatBDT(order.totalPaisa)}</dd>
              <dt>Status</dt>
              <dd><StatusBadge status={order.status} /></dd>
              <dt>Date</dt>
              <dd>{new Date(order.createdAt).toLocaleString('en-BD')}</dd>
            </dl>
          </div>
        </div>
      </div>

      {nextStatuses.length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <h2 className="card-title">Update Order Status</h2>
          </div>
          <div className="card-body">
            <div className="action-btns">
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  className={`btn ${status === 'cancelled' ? 'btn-danger' : status === 'delivered' || status === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => updateStatus(status)}
                  disabled={updating}
                >
                  {updating ? 'Updating…' : `Mark as ${status}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
