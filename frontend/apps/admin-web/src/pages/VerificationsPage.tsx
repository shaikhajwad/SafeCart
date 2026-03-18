import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { VerificationRequest } from '../types';

export default function VerificationsPage() {
  const [items, setItems] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<VerificationRequest | null>(null);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<VerificationRequest[]>('/api/admin/verifications');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleApprove(id: string) {
    setActionLoading(id + '-approve');
    setActionError('');
    try {
      await apiFetch(`/api/admin/verifications/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
      setSelected(null);
      setNotes('');
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    if (!reason.trim()) { setActionError('Reason is required'); return; }
    setActionLoading(id + '-reject');
    setActionError('');
    try {
      await apiFetch(`/api/admin/verifications/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      setSelected(null);
      setReason('');
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">KYC Verifications</h1>
        <p className="page-subtitle">Review and approve organisation verification requests</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {items.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <p>No pending verifications</p>
        </div>
      )}

      <div className="card-list">
        {items.map((item) => (
          <div key={item.id} className="card verification-card">
            <div className="card-body">
              <div className="verification-header">
                <div>
                  <h3 className="verification-org">{item.org?.name ?? item.orgId}</h3>
                  <div className="verification-meta">
                    <span>Submitted: {new Date(item.submittedAt).toLocaleDateString()}</span>
                    {item.org?.contactPhone && <span>Phone: {item.org.contactPhone}</span>}
                    {item.org?.tradeLicense && <span>Trade Licence: {item.org.tradeLicense}</span>}
                    {item.org?.tin && <span>TIN: {item.org.tin}</span>}
                  </div>
                  {item.documents && item.documents.length > 0 && (
                    <div className="doc-list">
                      {item.documents.map((doc) => (
                        <span key={doc.id} className="doc-badge">{doc.type}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`badge badge-${item.status}`}>{item.status}</span>
              </div>

              {selected?.id === item.id ? (
                <div className="action-panel">
                  {actionError && <div className="alert alert-danger">{actionError}</div>}
                  <div className="form-group">
                    <label className="form-label">Approval Notes (optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Internal notes…"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rejection Reason</label>
                    <input
                      type="text"
                      className="form-input"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Required if rejecting…"
                    />
                  </div>
                  <div className="action-buttons">
                    <button
                      className="btn btn-success"
                      onClick={() => void handleApprove(item.id)}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === item.id + '-approve' ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => void handleReject(item.id)}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === item.id + '-reject' ? 'Rejecting…' : 'Reject'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => { setSelected(null); setNotes(''); setReason(''); setActionError(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                item.status === 'pending' && (
                  <button
                    className="btn btn-primary btn-sm mt-4"
                    onClick={() => { setSelected(item); setActionError(''); }}
                  >
                    Review
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
