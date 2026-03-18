import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { DashboardStats } from '../types';

function formatPaisa(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<DashboardStats>('/api/admin/dashboard');
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Platform overview</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {stats && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-label">Total Orgs</div>
              <div className="stat-value">{stats.totalOrgs}</div>
            </div>
            <div className="stat-card stat-card-warning" onClick={() => navigate('/verifications')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon">⏳</div>
              <div className="stat-label">Pending Verifications</div>
              <div className="stat-value">{stats.pendingVerifications}</div>
            </div>
            <div className="stat-card stat-card-danger" onClick={() => navigate('/disputes')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon">⚠️</div>
              <div className="stat-label">Open Disputes</div>
              <div className="stat-value">{stats.openDisputes}</div>
            </div>
            <div className="stat-card stat-card-info" onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon">📋</div>
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{stats.totalOrders}</div>
            </div>
          </div>

          {stats.recentOrders && stats.recentOrders.length > 0 && (
            <div className="card mt-6">
              <div className="card-header">
                <h2 className="card-title">Recent Orders</h2>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Buyer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td><code className="code-ref">{order.orderRef}</code></td>
                        <td>{order.buyerName}</td>
                        <td>{formatPaisa(order.totalPaisa)}</td>
                        <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
