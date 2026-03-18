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

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Disputes</h1>
        <p className="page-subtitle">Review and resolve platform disputes</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {disputes.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <p>No disputes found</p>
        </div>
      )}

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
