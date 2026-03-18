import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { Dispute } from '../types';

interface ResolveDisputeDto {
  resolution: 'resolved_seller' | 'resolved_buyer' | 'closed';
  notes?: string;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Dispute[]>('/api/admin/disputes');
      setDisputes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleResolve(id: string, resolution: 'resolved_seller' | 'resolved_buyer' | 'closed') {
    setActionLoading(id + '-' + resolution);
    setActionError('');
    try {
      const dto: ResolveDisputeDto = { resolution, notes: notes.trim() || undefined };
      await apiFetch(`/api/admin/disputes/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      setSelected(null);
      setNotes('');
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to resolve dispute');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const statuses = [...new Set(disputes.map((d) => d.status))];
  const filtered = disputes.filter((d) => !statusFilter || d.status === statusFilter);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Disputes</h1>
          <p className="page-subtitle">{filtered.length} of {disputes.length} dispute{disputes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-controls">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 140 }}
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            className={`btn-icon${loading ? ' spinning' : ''}`}
            onClick={() => void load()}
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

      {filtered.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <p>{statusFilter ? 'No disputes match this filter.' : 'No disputes found'}</p>
        </div>
      )}

      <div className="card-list">
        {filtered.map((dispute) => (
          <div key={dispute.id} className="card dispute-card">
            <div className="card-body">
              <div className="dispute-header">
                <div>
                  <div className="dispute-id">Dispute #{dispute.id.slice(0, 8)}</div>
                  <div className="dispute-meta">
                    <span>Order: {dispute.order?.orderRef ?? dispute.orderId}</span>
                    <span>Reason: {dispute.reason}</span>
                    <span>Opened: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                    {dispute.resolvedAt && <span>Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <span className={`badge badge-${dispute.status}`}>{dispute.status}</span>
              </div>

              {selected === dispute.id ? (
                <div className="action-panel">
                  {actionError && <div className="alert alert-danger">{actionError}</div>}
                  <div className="form-group">
                    <label className="form-label">Resolution Notes (optional)</label>
                    <textarea
                      className="form-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add resolution notes…"
                      rows={3}
                    />
                  </div>
                  <div className="action-buttons">
                    <button
                      className="btn btn-success"
                      onClick={() => void handleResolve(dispute.id, 'resolved_buyer')}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === dispute.id + '-resolved_buyer' ? 'Resolving…' : 'Resolve For Buyer'}
                    </button>
                    <button
                      className="btn btn-warning"
                      onClick={() => void handleResolve(dispute.id, 'resolved_seller')}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === dispute.id + '-resolved_seller' ? 'Resolving…' : 'Resolve For Seller'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => void handleResolve(dispute.id, 'closed')}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === dispute.id + '-closed' ? 'Closing…' : 'Close'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => { setSelected(null); setNotes(''); setActionError(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                dispute.status === 'open' && (
                  <button
                    className="btn btn-primary btn-sm mt-4"
                    onClick={() => { setSelected(dispute.id); setActionError(''); }}
                  >
                    Resolve
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
