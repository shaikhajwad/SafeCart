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
    status === 'completed' || status === 'delivered'
      ? 'badge badge-success'
      : status === 'cancelled' || status === 'failed'
        ? 'badge badge-danger'
        : status === 'pending'
          ? 'badge badge-warning'
          : 'badge badge-info';
  return <span className={cls}>{status}</span>;
}

export default function Dashboard() {
  const { user, org, orgId } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!orgId) return;
    apiFetch<Order[]>(`/api/orgs/${orgId}/orders`)
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [orgId]);

  const isLoading = orgId !== null && orders === null;
  const orderList = orders ?? [];
  const totalOrders = orderList.length;
  const pendingOrders = orderList.filter((o) => o.status === 'pending').length;
  const completedOrders = orderList.filter(
    (o) => o.status === 'completed' || o.status === 'delivered',
  ).length;
  const recentOrders = [...orderList]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {org?.name ?? user?.phone} 👋</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{totalOrders}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card stat-card-warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{pendingOrders}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{completedOrders}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card stat-card-info">
          <div className="stat-icon">💰</div>
          <div className="stat-value">
            {formatBDT(orderList.reduce((s, o) => s + o.totalPaisa, 0))}
          </div>
          <div className="stat-label">Total Revenue</div>
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/products" className="btn btn-primary">
          + Add Product
        </Link>
        <Link to="/checkout-links" className="btn btn-secondary">
          + Create Checkout Link
        </Link>
        <Link to="/orders" className="btn btn-ghost">
          View All Orders →
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Orders</h2>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="text-center text-muted">Loading orders…</div>
          ) : recentOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No orders yet. Share your checkout links to start selling!</p>
              <Link to="/checkout-links" className="btn btn-primary">
                Create Checkout Link
              </Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Buyer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono">{order.orderRef}</td>
                    <td>{order.buyerName}</td>
                    <td>{formatBDT(order.totalPaisa)}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>{new Date(order.createdAt).toLocaleDateString('en-BD')}</td>
                    <td>
                      <Link to={`/orders/${order.id}`} className="btn btn-sm btn-ghost">
                        View
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
