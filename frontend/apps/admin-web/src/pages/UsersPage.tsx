import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface User {
  id: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadUsers = useCallback(() => {
    setLoading(true);
    apiFetch<User[]>('/api/admin/users')
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || u.phone.includes(q) || u.id.toLowerCase().includes(q);
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesStatus = !statusFilter || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roles = [...new Set(users.map((u) => u.role))];
  const statuses = [...new Set(users.map((u) => u.status))];

  async function handleUpdate(id: string, body: { role?: string; status?: string }) {
    try {
      const updated = await apiFetch<User>(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">
            {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="page-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by phone or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 130 }}
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 130 }}
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            className={`btn-icon${loading ? ' spinning' : ''}`}
            onClick={loadUsers}
            title="Refresh"
          >
            <svg viewBox="0 0 24 24">
              <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>{search || roleFilter || statusFilter ? 'No users match your filters.' : 'No users yet.'}</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td className="font-semibold">{u.phone}</td>
                    <td>
                      <select
                        className="form-select"
                        value={u.role}
                        onChange={(e) => handleUpdate(u.id, { role: e.target.value })}
                        style={{ width: 'auto', minWidth: 120, padding: '4px 30px 4px 10px', fontSize: '12px' }}
                      >
                        <option value="buyer">buyer</option>
                        <option value="seller">seller</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={u.status}
                        onChange={(e) => handleUpdate(u.id, { status: e.target.value })}
                        style={{ width: 'auto', minWidth: 120, padding: '4px 30px 4px 10px', fontSize: '12px' }}
                      >
                        <option value="active">active</option>
                        <option value="blocked">blocked</option>
                      </select>
                    </td>
                    <td className="text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <code className="font-mono text-muted text-sm">{u.id.slice(0, 8)}</code>
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
