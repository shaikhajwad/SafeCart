import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { Org } from '../types';

const ORG_STATUS_OPTIONS = ['pending_verification', 'active', 'suspended', 'closed'];

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<Org[]>('/api/admin/orgs');
        setOrgs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organisations');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function updateOrgStatus(orgId: string, status: string) {
    setUpdatingId(orgId);
    setError('');
    try {
      const updated = await apiFetch<Org>(`/api/admin/orgs/${orgId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setOrgs((prev) => prev.map((o) => (o.id === orgId ? { ...o, ...updated } : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organisation');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Organisations</h1>
        <p className="page-subtitle">Control merchant lifecycle and platform access</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Org</th>
                <th>Slug</th>
                <th>Support</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    <div>{org.displayName || org.name || 'Unnamed Org'}</div>
                    <code className="code-ref">{org.id.slice(0, 8)}</code>
                  </td>
                  <td>{org.slug || '-'}</td>
                  <td>
                    <div>{org.supportPhone || org.contactPhone || '-'}</div>
                    <div>{org.supportEmail || '-'}</div>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      value={org.status || 'pending_verification'}
                      disabled={updatingId === org.id}
                      onChange={(e) => void updateOrgStatus(org.id, e.target.value)}
                    >
                      {ORG_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td>{org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
