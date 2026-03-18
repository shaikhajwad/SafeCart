import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import type { Order } from '../types';

function formatBDT(paisa: number): string {
  return 'BDT ' + (paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 });
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'COMPLETED' || status === 'DELIVERED'
      ? 'badge badge-success'
      : status === 'CANCELLED' || status === 'REFUNDED'
        ? 'badge badge-danger'
        : status === 'PAYMENT_PENDING' || status === 'DRAFT' || status === 'DISPUTE_OPEN'
          ? 'badge badge-warning'
          : 'badge badge-info';
  return <span className={cls}>{status}</span>;
}

const STATUS_OPTIONS = ['', 'DRAFT', 'CHECKOUT_STARTED', 'PAYMENT_PENDING', 'PAID', 'SHIPMENT_BOOKED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTE_OPEN', 'REFUNDED'];

export default function OrdersPage() {
  const { orgId } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!orgId) return;
    apiFetch<Order[]>(`/api/orgs/${orgId}/orders`)
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [orgId]);

  const isLoading = orgId !== null && orders === null;
  const orderList = orders ?? [];
  const filtered = statusFilter
    ? orderList.filter((o) => o.status === statusFilter)
    : orderList;

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (!orgId) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>Set up your store to view orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="filter-bar">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === '' ? 'All statuses' : s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center text-muted">Loading orders…</div>
          ) : sorted.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>{statusFilter ? `No ${statusFilter} orders.` : 'No orders yet.'}</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Buyer</th>
                  <th>Phone</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono">{order.orderRef}</td>
                    <td>{order.buyerName}</td>
                    <td className="text-muted">{order.buyerPhone}</td>
                    <td className="font-mono">{formatBDT(order.totalPaisa)}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td className="text-muted">{new Date(order.createdAt).toLocaleDateString('en-BD')}</td>
                    <td>
                      <Link to={`/orders/${order.id}`} className="btn btn-sm btn-ghost">
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
