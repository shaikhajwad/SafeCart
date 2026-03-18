import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Record<string, any>;
  userId: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');

  useEffect(() => {
    apiFetch<AuditLog[]>('/api/audit-logs')
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = logs.filter((log) => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (entityTypeFilter && log.entityType !== entityTypeFilter) return false;
    return true;
  });

  const actions = [...new Set(logs.map((l) => l.action))].sort();
  const entityTypes = [...new Set(logs.map((l) => l.entityType))].sort();

  if (loading) {
    return (
      <div className="page">
        <div className="flex justify-center py-12">
          <div className="loading loading-spinner loading-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Audit Logs</h1>
        <p className="text-gray-600 text-sm">Track all system activities</p>
      </div>

      <div className="card bg-base-100 shadow mb-6">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="select select-bordered"
            >
              <option value="">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>

            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="select select-bordered"
            >
              <option value="">All Entity Types</option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No audit logs found</p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>Action</th>
                  <th>User ID</th>
                  <th className="text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="hover">
                    <td className="text-sm">{new Date(log.createdAt).toLocaleString('en-BD')}</td>
                    <td>
                      <span className="badge badge-sm">{log.entityType}</span>
                    </td>
                    <td className="font-mono text-xs">{log.entityId.slice(0, 8)}...</td>
                    <td>
                      <span className="badge badge-primary badge-sm">{log.action}</span>
                    </td>
                    <td className="text-sm">{log.userId.slice(0, 8)}...</td>
                    <td className="text-right">
                      {log.changes && (
                        <details className="dropdown">
                          <summary className="link link-primary link-sm">View</summary>
                          <div className="dropdown-content bg-gray-100 p-4 rounded text-xs max-w-xs">
                            <pre>{JSON.stringify(log.changes, null, 2)}</pre>
                          </div>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t text-sm text-gray-600">
            Showing {filtered.length} of {logs.length} logs
          </div>
        </div>
      )}
    </div>
  );
}
