import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { Order } from '../types';

function formatPaisa(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [holdLoading, setHoldLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<Order[]>('/api/admin/orders');
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleHold(id: string) {
    setHoldLoading(id);
    try {
      await apiFetch(`/api/admin/orders/${id}/hold`, { method: 'POST' });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'CANCELLED' } : o));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hold order');
    } finally {
      setHoldLoading(null);
    }
  }

  const statuses = Array.from(new Set(orders.map((o) => o.status)));
  const filtered = statusFilter ? orders.filter((o) => o.status === statusFilter) : orders;

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">All Orders</h1>
        <p className="page-subtitle">Platform-wide order management</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-bar">
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="filter-count">{filtered.length} orders</span>
      </div>

      {filtered.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No orders found</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Org</th>
                  <th>Buyer</th>
                  <th>Phone</th>
                  <th>District</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id}>
                    <td><code className="code-ref">{order.orderRef}</code></td>
                    <td>{order.org?.name ?? order.orgId}</td>
                    <td>{order.buyerName}</td>
                    <td>{order.buyerPhone}</td>
                    <td>{order.district}</td>
                    <td>{formatPaisa(order.totalPaisa)}</td>
                    <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      {order.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={() => void handleHold(order.id)}
                          disabled={holdLoading === order.id}
                        >
                          {holdLoading === order.id ? '…' : 'Hold'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
