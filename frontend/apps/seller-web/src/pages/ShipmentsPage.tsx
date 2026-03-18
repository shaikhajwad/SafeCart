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

function formatBDT(paisa: number): string {
  return 'BDT ' + (paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 });
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
        <h1>Shipments</h1>
        <div className="page-controls">
          <input
            type="text"
            placeholder="Filter by status..."
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input input-sm"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="loading loading-spinner loading-lg" />
        </div>
      )}

      {!isLoading && shipmentList.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No shipments yet</p>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
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
                <td className="font-medium">{s.orderRef}</td>
                <td className="capitalize">{s.courier}</td>
                <td>{s.trackingNumber || '-'}</td>
                <td>
                  <StatusBadge status={s.status} />
                </td>
                <td className="text-sm text-gray-500">
                  {s.estimatedDeliveryAt ? new Date(s.estimatedDeliveryAt).toLocaleDateString() : '-'}
                </td>
                <td>
                  <Link to={`/shipments/${s.id}`} className="link link-primary link-sm">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
