import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface Org {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
}

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrgs = useCallback(() => {
    setLoading(true);
    apiFetch<Org[]>('/api/admin/orgs')
      .then(setOrgs)
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadOrgs(); }, [loadOrgs]);

  const filtered = orgs.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      o.name.toLowerCase().includes(q) ||
      o.slug.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = [...new Set(orgs.map((o) => o.status))];

  async function handleStatusChange(id: string, status: string) {
    try {
      const updated = await apiFetch<Org>(`/api/admin/orgs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setOrgs((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update org');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Organisations</h1>
          <p className="page-subtitle">
            {filtered.length} of {orgs.length} organisation{orgs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="page-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by name or slug…"
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
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            className={`btn-icon${loading ? ' spinning' : ''}`}
            onClick={loadOrgs}
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
              <div className="empty-icon">🏢</div>
              <p>{search || statusFilter ? 'No organisations match your filters.' : 'No organisations yet.'}</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id}>
                    <td className="font-semibold">{o.name}</td>
                    <td className="text-muted font-mono">{o.slug}</td>
                    <td>
                      <select
                        className="form-select"
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        style={{ width: 'auto', minWidth: 120, padding: '4px 30px 4px 10px', fontSize: '12px' }}
                      >
                        <option value="active">active</option>
                        <option value="pending_verification">pending_verification</option>
                        <option value="suspended">suspended</option>
                      </select>
                    </td>
                    <td className="text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
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
