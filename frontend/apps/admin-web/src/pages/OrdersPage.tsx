import { useCallback, useEffect, useState } from 'react';
import { apiDownload, apiFetch } from '../lib/api';
import type { Order } from '../types';

const ORDER_STATUS_OPTIONS = [
  'DRAFT',
  'CHECKOUT_STARTED',
  'PAYMENT_PENDING',
  'PAID',
  'SHIPMENT_BOOKED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'DISPUTE_OPEN',
  'RETURN_IN_TRANSIT',
  'REFUNDED',
];

function formatPaisa(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    const query = new URLSearchParams();
    if (search.trim()) query.set('search', search.trim());
    if (statusFilter) query.set('status', statusFilter);

    try {
      const data = await apiFetch<Order[]>(`/api/admin/orders${query.toString() ? `?${query.toString()}` : ''}`);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const updated = await apiFetch<Order>(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, ...updated } : o));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    }
  }

  async function holdOrder(orderId: string) {
    try {
      await apiFetch(`/api/admin/orders/${orderId}/hold`, { method: 'POST', body: JSON.stringify({ reason: 'Manual review hold' }) });
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to put order on hold');
    }
  }

  async function exportCsv() {
    try {
      await apiDownload('/api/admin/exports/orders.csv', 'admin-orders.csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export orders');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <p className="page-subtitle">Operational order control with search, status force-update, and export</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-bar" style={{ marginBottom: 12, display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr auto auto' }}>
        <input className="form-input" placeholder="Search by ref, buyer name, phone" value={search} onChange={(e: any) => setSearch(e.target.value)} />
        <select className="form-select" value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          {ORDER_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={() => void loadOrders()} disabled={loading}>Refresh</button>
        <button className="btn btn-ghost" onClick={() => void exportCsv()}>Export CSV</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Buyer</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Force Status</th>
                <th>Actions</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><code className="code-ref">{order.orderRef}</code></td>
                  <td>{order.buyerName || '-'}</td>
                  <td>{order.buyerPhone || '-'}</td>
                  <td>{formatPaisa(Number(order.totalPaisa))}</td>
                  <td><span className="badge badge-info">{order.status}</span></td>
                  <td>
                    <select className="form-select" value={order.status} onChange={(e: any) => void updateOrderStatus(order.id, e.target.value)}>
                      {ORDER_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => void holdOrder(order.id)}>
                      Risk Hold
                    </button>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={8}>No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
