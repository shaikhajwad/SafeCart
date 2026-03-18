import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiDownload, apiFetch } from '../lib/api';
import type { User } from '../types';

const ROLE_OPTIONS = ['buyer', 'seller_owner', 'seller_staff', 'support_agent', 'admin'];
const STATUS_OPTIONS = ['active', 'blocked', 'deleted'];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    const query = new URLSearchParams();
    if (search.trim()) query.set('search', search.trim());
    if (roleFilter) query.set('role', roleFilter);
    if (statusFilter) query.set('status', statusFilter);

    try {
      const data = await apiFetch<User[]>(`/api/admin/users${query.toString() ? `?${query.toString()}` : ''}`);
      setUsers(data);
      setSelectedIds((prev: string[]) => prev.filter((id: string) => data.some((u: User) => u.id === id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const allVisibleSelected = useMemo(
    () => users.length > 0 && users.every((u: User) => selectedIds.includes(u.id)),
    [users, selectedIds],
  );

  function toggleSelection(userId: string) {
    setSelectedIds((prev: string[]) => prev.includes(userId) ? prev.filter((id: string) => id !== userId) : [...prev, userId]);
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((prev: string[]) => prev.filter((id: string) => !users.some((u: User) => u.id === id)));
      return;
    }
    const visibleIds = users.map((u: User) => u.id);
    setSelectedIds((prev: string[]) => Array.from(new Set([...prev, ...visibleIds])));
  }

  async function updateUser(userId: string, patch: { role?: string; status?: string }) {
    try {
      const updated = await apiFetch<User>(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setUsers((prev: User[]) => prev.map((u: User) => u.id === userId ? { ...u, ...updated } : u));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  }

  async function handleBulkUpdate() {
    if (!selectedIds.length) {
      setError('Select at least one user for bulk update');
      return;
    }
    if (!bulkRole && !bulkStatus) {
      setError('Choose bulk role or status before applying');
      return;
    }

    setBulkLoading(true);
    setError('');
    try {
      await apiFetch<{ ok: boolean; updatedCount: number }>('/api/admin/users/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ userIds: selectedIds, role: bulkRole || undefined, status: bulkStatus || undefined }),
      });
      setBulkRole('');
      setBulkStatus('');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply bulk update');
    } finally {
      setBulkLoading(false);
    }
  }

  async function exportCsv() {
    try {
      await apiDownload('/api/admin/exports/users.csv', 'admin-users.csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export users');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">Search, filter, bulk-control users, and export directory</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-bar" style={{ marginBottom: 12, display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr 1fr auto auto' }}>
        <input
          className="form-input"
          placeholder="Search phone/email/name/id"
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
        />
        <select className="form-select" value={roleFilter} onChange={(e: any) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <select className="form-select" value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={() => void loadUsers()} disabled={loading}>Refresh</button>
        <button className="btn btn-ghost" onClick={() => void exportCsv()}>Export CSV</button>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-body" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr auto', alignItems: 'end' }}>
          <select className="form-select" value={bulkRole} onChange={(e: any) => setBulkRole(e.target.value)}>
            <option value="">Bulk role (optional)</option>
            {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <select className="form-select" value={bulkStatus} onChange={(e: any) => setBulkStatus(e.target.value)}>
            <option value="">Bulk status (optional)</option>
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className="btn btn-primary" disabled={!selectedIds.length || bulkLoading} onClick={() => void handleBulkUpdate()}>
            {bulkLoading ? 'Applying...' : `Apply to ${selectedIds.length} selected`}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={allVisibleSelected} onChange={() => toggleSelectAll()} />
                </th>
                <th>Phone</th>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user.id)}
                      onChange={() => toggleSelection(user.id)}
                    />
                  </td>
                  <td>{user.phoneE164 || user.phone || '-'}</td>
                  <td>{user.email || '-'}</td>
                  <td>{user.fullName || '-'}</td>
                  <td>
                    <select
                      className="form-select"
                      value={user.role}
                      onChange={(e: any) => void updateUser(user.id, { role: e.target.value })}
                    >
                      {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      value={user.status || 'active'}
                      onChange={(e: any) => void updateUser(user.id, { status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
