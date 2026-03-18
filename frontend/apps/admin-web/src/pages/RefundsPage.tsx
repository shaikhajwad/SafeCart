import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { Refund } from '../types';

const REFUND_STATUS_OPTIONS = ['pending', 'processing', 'completed', 'failed'];

function formatPaisa(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<Refund[]>('/api/admin/refunds');
        setRefunds(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load refunds');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function updateRefund(refundId: string, status: string) {
    setUpdatingId(refundId);
    setError('');
    try {
      const updated = await apiFetch<Refund>(`/api/admin/refunds/${refundId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setRefunds((prev) => prev.map((r) => (r.id === refundId ? { ...r, ...updated } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update refund');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Refund Operations</h1>
        <p className="page-subtitle">Review and control refund processing lifecycle</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Refund</th>
                <th>Order</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => (
                <tr key={refund.id}>
                  <td>
                    <code className="code-ref">{refund.id.slice(0, 8)}</code>
                  </td>
                  <td>
                    <code className="code-ref">{refund.orderId.slice(0, 8)}</code>
                  </td>
                  <td>{formatPaisa(Number(refund.amountPaisa))}</td>
                  <td>{refund.reason}</td>
                  <td>
                    <select
                      className="form-select"
                      value={refund.status}
                      disabled={updatingId === refund.id}
                      onChange={(e) => void updateRefund(refund.id, e.target.value)}
                    >
                      {REFUND_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td>{new Date(refund.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
