import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiDownload, apiFetch } from '../lib/api';
import type { Org } from '../types';

const ORG_STATUS_OPTIONS = ['pending_verification', 'active', 'suspended', 'closed'];

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    setError('');

    const query = new URLSearchParams();
    if (search.trim()) query.set('search', search.trim());
    if (statusFilter) query.set('status', statusFilter);

    try {
      const data = await apiFetch<Org[]>(`/api/admin/orgs${query.toString() ? `?${query.toString()}` : ''}`);
      setOrgs(data);
      setSelectedIds((prev) => prev.filter((id) => data.some((o) => o.id === id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organisations');
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    void loadOrgs();
  }, [loadOrgs]);

  const allVisibleSelected = useMemo(
    () => orgs.length > 0 && orgs.every((o) => selectedIds.includes(o.id)),
    [orgs, selectedIds],
  );

  function toggleSelection(orgId: string) {
    setSelectedIds((prev) => prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]);
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !orgs.some((o) => o.id === id)));
      return;
    }
    const visibleIds = orgs.map((o) => o.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  }

  async function updateOrgStatus(orgId: string, status: string) {
    try {
      const updated = await apiFetch<Org>(`/api/admin/orgs/${orgId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setOrgs((prev) => prev.map((o) => o.id === orgId ? { ...o, ...updated } : o));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organisation');
    }
  }

  async function bulkUpdateStatus() {
    if (!selectedIds.length) {
      setError('Select at least one organisation');
      return;
    }
    if (!bulkStatus) {
      setError('Choose a status for bulk update');
      return;
    }

    try {
      await apiFetch<{ ok: boolean; updatedCount: number }>('/api/admin/orgs/bulk-status', {
        method: 'POST',
        body: JSON.stringify({ orgIds: selectedIds, status: bulkStatus }),
      });
      setBulkStatus('');
      await loadOrgs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk update organisations');
    }
  }

  async function exportCsv() {
    try {
      await apiDownload('/api/admin/exports/orgs.csv', 'admin-orgs.csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export organisations');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Organisations</h1>
        <p className="page-subtitle">Lifecycle control, filtering, bulk status updates, and export</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-bar" style={{ marginBottom: 12, display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr auto auto' }}>
        <input
          className="form-input"
          placeholder="Search by name, slug, support email"
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
        />
        <select className="form-select" value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          {ORG_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={() => void loadOrgs()} disabled={loading}>Refresh</button>
        <button className="btn btn-ghost" onClick={() => void exportCsv()}>Export CSV</button>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-body" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr auto' }}>
          <select className="form-select" value={bulkStatus} onChange={(e: any) => setBulkStatus(e.target.value)}>
            <option value="">Bulk status</option>
            {ORG_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => void bulkUpdateStatus()} disabled={!selectedIds.length}>
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
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Support</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    <input type="checkbox" checked={selectedIds.includes(org.id)} onChange={() => toggleSelection(org.id)} />
                  </td>
                  <td>{org.displayName || org.name || '-'}</td>
                  <td>{org.slug || '-'}</td>
                  <td>
                    <select className="form-select" value={org.status || 'pending_verification'} onChange={(e: any) => void updateOrgStatus(org.id, e.target.value)}>
                      {ORG_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td>{org.supportEmail || org.supportPhone || org.contactPhone || '-'}</td>
                  <td>{org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {!loading && orgs.length === 0 && (
                <tr><td colSpan={6}>No organisations found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
