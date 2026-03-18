import { useCallback, useEffect, useState } from 'react';
import { apiDownload, apiFetch } from '../lib/api';
import type { Dispute } from '../types';

interface ResolveDisputeDto {
  resolution: 'resolved_seller' | 'resolved_buyer' | 'closed';
  notes?: string;
}

const DISPUTE_STATUS_FILTERS = ['open', 'resolved_seller', 'resolved_buyer', 'closed'];

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDisputes = useCallback(async () => {
    setLoading(true);
    setError('');

    const query = new URLSearchParams();
    if (statusFilter) query.set('status', statusFilter);
    if (search.trim()) query.set('search', search.trim());

    try {
      const data = await apiFetch<Dispute[]>(`/api/admin/disputes${query.toString() ? `?${query.toString()}` : ''}`);
      setDisputes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load disputes');
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    void loadDisputes();
  }, [loadDisputes]);

  async function handleResolve(id: string, resolution: ResolveDisputeDto['resolution']) {
    setActionLoading(`${id}:${resolution}`);
    try {
      const dto: ResolveDisputeDto = { resolution, notes: notes.trim() || undefined };
      await apiFetch(`/api/admin/disputes/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      setSelected(null);
      setNotes('');
      await loadDisputes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve dispute');
    } finally {
      setActionLoading(null);
    }
  }

  async function reopenDispute(id: string) {
    setActionLoading(`${id}:reopen`);
    try {
      await apiFetch(`/api/admin/disputes/${id}/reopen`, { method: 'PATCH' });
      await loadDisputes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reopen dispute');
    } finally {
      setActionLoading(null);
    }
  }

  async function exportCsv() {
    try {
      await apiDownload('/api/admin/exports/disputes.csv', 'admin-disputes.csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export disputes');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Disputes</h1>
        <p className="page-subtitle">Search, filter, resolve, reopen, and export dispute queue</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-bar" style={{ marginBottom: 12, display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr auto auto' }}>
        <input className="form-input" placeholder="Search by reason/order/dispute id" value={search} onChange={(e: any) => setSearch(e.target.value)} />
        <select className="form-select" value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          {DISPUTE_STATUS_FILTERS.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={() => void loadDisputes()} disabled={loading}>Refresh</button>
        <button className="btn btn-ghost" onClick={() => void exportCsv()}>Export CSV</button>
      </div>

      <div className="card-list">
        {disputes.map((dispute) => (
          <div key={dispute.id} className="card dispute-card">
            <div className="card-body">
              <div className="dispute-header">
                <div>
                  <div className="dispute-id">Dispute #{dispute.id.slice(0, 8)}</div>
                  <div className="dispute-meta">
                    <span>Order: {dispute.order?.orderRef ?? dispute.orderId}</span>
                    <span>Reason: {dispute.reason}</span>
                    <span>Opened: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`badge badge-${dispute.status}`}>{dispute.status}</span>
              </div>

              {selected === dispute.id ? (
                <div className="action-panel">
                  <div className="form-group">
                    <label className="form-label">Resolution notes</label>
                    <textarea className="form-input" value={notes} onChange={(e: any) => setNotes(e.target.value)} rows={3} />
                  </div>
                  <div className="action-buttons">
                    <button className="btn btn-success" onClick={() => void handleResolve(dispute.id, 'resolved_buyer')} disabled={actionLoading !== null}>
                      {actionLoading === `${dispute.id}:resolved_buyer` ? '...' : 'Resolve For Buyer'}
                    </button>
                    <button className="btn btn-warning" onClick={() => void handleResolve(dispute.id, 'resolved_seller')} disabled={actionLoading !== null}>
                      {actionLoading === `${dispute.id}:resolved_seller` ? '...' : 'Resolve For Seller'}
                    </button>
                    <button className="btn btn-danger" onClick={() => void handleResolve(dispute.id, 'closed')} disabled={actionLoading !== null}>
                      {actionLoading === `${dispute.id}:closed` ? '...' : 'Close'}
                    </button>
                    <button className="btn btn-ghost" onClick={() => { setSelected(null); setNotes(''); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="action-buttons mt-4">
                  {dispute.status === 'open' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setSelected(dispute.id)}>Resolve</button>
                  )}
                  {dispute.status !== 'open' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => void reopenDispute(dispute.id)} disabled={actionLoading === `${dispute.id}:reopen`}>
                      {actionLoading === `${dispute.id}:reopen` ? 'Reopening...' : 'Reopen'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {!loading && disputes.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <p>No disputes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
