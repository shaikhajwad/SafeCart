import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

interface Shipment {
  id: string;
  orderId: string;
  orderRef: string;
  courier: string;
  trackingNumber?: string;
  status: string;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'DELIVERED'
      ? 'badge badge-success'
      : status === 'CANCELLED'
        ? 'badge badge-danger'
        : status === 'BOOKED'
          ? 'badge badge-warning'
          : 'badge badge-info';
  return <span className={cls}>{status}</span>;
}

const SHIPMENT_STATUSES = ['', 'BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function ShipmentsPage() {
  const { orgId } = useAuth();
  const [shipments, setShipments] = useState<Shipment[] | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!orgId) return;
    apiFetch<Shipment[]>(`/api/orgs/${orgId}/shipments`)
      .then(setShipments)
      .catch(() => setShipments([]));
  }, [orgId]);

  const isLoading = orgId !== null && shipments === null;
  const shipmentList = shipments ?? [];
  const filtered = statusFilter ? shipmentList.filter((s) => s.status === statusFilter) : shipmentList;

  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!orgId) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>Set up your store to view shipments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shipments</h1>
          <p className="page-subtitle">
            {filtered.length} of {shipmentList.length} shipment{shipmentList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="page-controls">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 160 }}
          >
            {SHIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s === '' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : sorted.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>{statusFilter ? `No ${statusFilter} shipments.` : 'No shipments yet.'}</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Courier</th>
                  <th>Tracking #</th>
                  <th>Status</th>
                  <th>Est. Delivery</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <tr key={s.id}>
                    <td className="font-semibold">{s.orderRef}</td>
                    <td>{s.courier}</td>
                    <td className="font-mono text-muted">{s.trackingNumber || '—'}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="text-muted">
                      {s.estimatedDeliveryAt ? new Date(s.estimatedDeliveryAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <Link to={`/shipments/${s.id}`} className="btn btn-sm btn-ghost">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
