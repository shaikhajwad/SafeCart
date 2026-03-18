import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { Refund } from '../types';

const REFUND_STATUS_OPTIONS = ['pending', 'processing', 'completed', 'failed'];

function formatPaisa(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadRefunds = useCallback(() => {
    setLoading(true);
    setError('');
    apiFetch<Refund[]>('/api/admin/refunds')
      .then(setRefunds)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load refunds'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadRefunds(); }, [loadRefunds]);

  async function updateRefund(refundId: string, status: string) {
    setUpdatingId(refundId);
    setError('');
    try {
      const updated = await apiFetch<Refund>(`/api/admin/refunds/${refundId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setRefunds((prev) => prev.map((r) => (r.id === refundId ? { ...r, ...updated } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update refund');
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = refunds.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.orderId.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Refund Operations</h1>
          <p className="page-subtitle">
            {filtered.length} of {refunds.length} refund{refunds.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="page-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by ID, order, reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 140 }}
          >
            <option value="">All Statuses</option>
            {REFUND_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            className={`btn-icon${loading ? ' spinning' : ''}`}
            onClick={loadRefunds}
            title="Refresh"
          >
            <svg viewBox="0 0 24 24">
              <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💸</div>
              <p>{search || statusFilter ? 'No refunds match your filters.' : 'No refunds yet.'}</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Refund</th>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((refund) => (
                  <tr key={refund.id}>
                    <td><code className="font-mono">{refund.id.slice(0, 8)}</code></td>
                    <td><code className="font-mono">{refund.orderId.slice(0, 8)}</code></td>
                    <td className="font-mono">{formatPaisa(Number(refund.amountPaisa))}</td>
                    <td>{refund.reason}</td>
                    <td>
                      <select
                        className="form-select"
                        value={refund.status}
                        disabled={updatingId === refund.id}
                        onChange={(e) => void updateRefund(refund.id, e.target.value)}
                        style={{ width: 'auto', minWidth: 120, padding: '4px 30px 4px 10px', fontSize: '12px' }}
                      >
                        {REFUND_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-muted">{new Date(refund.createdAt).toLocaleDateString()}</td>
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
