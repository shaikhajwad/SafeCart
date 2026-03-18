import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { User } from '../types';

const ROLE_OPTIONS = ['buyer', 'seller_owner', 'seller_staff', 'support_agent', 'admin'];
const STATUS_OPTIONS = ['active', 'blocked', 'deleted'];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<User[]>('/api/admin/users');
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function updateUser(userId: string, patch: { role?: string; status?: string }) {
    setUpdatingId(userId);
    setError('');
    try {
      const updated = await apiFetch<User>(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setUsers((prev: User[]) => prev.map((u: User) => (u.id === userId ? { ...u, ...updated } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">Manage user roles and account status</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: User) => (
                <tr key={user.id}>
                  <td>
                    <div>{user.fullName || 'Unnamed'}</div>
                    <code className="code-ref">{user.id.slice(0, 8)}</code>
                  </td>
                  <td>{user.phoneE164 || user.phone || '-'}</td>
                  <td>{user.email || '-'}</td>
                  <td>
                    <select
                      className="form-select"
                      value={user.role}
                      disabled={updatingId === user.id}
                      onChange={(e: any) => void updateUser(user.id, { role: e.target.value })}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      value={user.status || 'active'}
                      disabled={updatingId === user.id}
                      onChange={(e: any) => void updateUser(user.id, { status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
