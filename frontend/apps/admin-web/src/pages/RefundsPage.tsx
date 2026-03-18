import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiDownload, apiFetch } from '../lib/api';
import type { Refund } from '../types';

const REFUND_STATUS_OPTIONS = ['pending', 'processing', 'completed', 'failed'];

function formatPaisa(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minAmountPaisa, setMinAmountPaisa] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    setError('');

    const query = new URLSearchParams();
    if (search.trim()) query.set('search', search.trim());
    if (statusFilter) query.set('status', statusFilter);
    if (minAmountPaisa.trim()) query.set('minAmountPaisa', minAmountPaisa.trim());

    try {
      const data = await apiFetch<Refund[]>(`/api/admin/refunds${query.toString() ? `?${query.toString()}` : ''}`);
      setRefunds(data);
      setSelectedIds((prev) => prev.filter((id) => data.some((r) => r.id === id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load refunds');
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, minAmountPaisa]);

  useEffect(() => {
    void loadRefunds();
  }, [loadRefunds]);

  const allVisibleSelected = useMemo(
    () => refunds.length > 0 && refunds.every((r) => selectedIds.includes(r.id)),
    [refunds, selectedIds],
  );

  function toggleSelection(refundId: string) {
    setSelectedIds((prev) => prev.includes(refundId) ? prev.filter((id) => id !== refundId) : [...prev, refundId]);
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !refunds.some((r) => r.id === id)));
      return;
    }
    const visibleIds = refunds.map((r) => r.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  }

  async function updateRefund(refundId: string, patch: { status?: string; providerRefundId?: string }) {
    try {
      const updated = await apiFetch<Refund>(`/api/admin/refunds/${refundId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setRefunds((prev) => prev.map((r) => r.id === refundId ? { ...r, ...updated } : r));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update refund');
    }
  }

  async function bulkUpdateStatus() {
    if (!selectedIds.length || !bulkStatus) {
      setError('Select refunds and bulk status first');
      return;
    }

    try {
      await apiFetch<{ ok: boolean; updatedCount: number }>('/api/admin/refunds/bulk-status', {
        method: 'POST',
        body: JSON.stringify({ refundIds: selectedIds, status: bulkStatus }),
      });
      setBulkStatus('');
      await loadRefunds();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk update refunds');
    }
  }

  async function exportCsv() {
    try {
      await apiDownload('/api/admin/exports/refunds.csv', 'admin-refunds.csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export refunds');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Refund Operations</h1>
        <p className="page-subtitle">Filter, bulk update, provider refs, and CSV export</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-bar" style={{ marginBottom: 12, display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr 1fr auto auto' }}>
        <input className="form-input" placeholder="Search id/order/reason" value={search} onChange={(e: any) => setSearch(e.target.value)} />
        <select className="form-select" value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          {REFUND_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <input className="form-input" placeholder="Min amount (paisa)" value={minAmountPaisa} onChange={(e: any) => setMinAmountPaisa(e.target.value)} />
        <button className="btn btn-secondary" onClick={() => void loadRefunds()} disabled={loading}>Refresh</button>
        <button className="btn btn-ghost" onClick={() => void exportCsv()}>Export CSV</button>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-body" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr auto' }}>
          <select className="form-select" value={bulkStatus} onChange={(e: any) => setBulkStatus(e.target.value)}>
            <option value="">Bulk status</option>
            {REFUND_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className="btn btn-primary" disabled={!selectedIds.length} onClick={() => void bulkUpdateStatus()}>
            Apply to {selectedIds.length} selected
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allVisibleSelected} onChange={() => toggleSelectAll()} /></th>
                <th>Refund</th>
                <th>Order</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Provider Ref</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => (
                <tr key={refund.id}>
                  <td><input type="checkbox" checked={selectedIds.includes(refund.id)} onChange={() => toggleSelection(refund.id)} /></td>
                  <td><code className="code-ref">{refund.id.slice(0, 8)}</code></td>
                  <td><code className="code-ref">{refund.orderId.slice(0, 8)}</code></td>
                  <td>{formatPaisa(Number(refund.amountPaisa))}</td>
                  <td>{refund.reason}</td>
                  <td>
                    <select className="form-select" value={refund.status} onChange={(e: any) => void updateRefund(refund.id, { status: e.target.value })}>
                      {REFUND_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      className="form-input"
                      placeholder="provider refund ref"
                      value={refund.providerRefundId || ''}
                      onBlur={(e: any) => {
                        const value = e.target.value?.trim();
                        if (value !== (refund.providerRefundId || '')) {
                          void updateRefund(refund.id, { providerRefundId: value || undefined });
                        }
                      }}
                      defaultValue={refund.providerRefundId || ''}
                    />
                  </td>
                  <td>{new Date(refund.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!loading && refunds.length === 0 && (
                <tr><td colSpan={8}>No refunds found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
