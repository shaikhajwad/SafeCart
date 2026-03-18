import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface RiskHold {
  id: string;
  orderId: string;
  orderRef: string;
  reason: string;
  status: string;
  heldAt: string;
  releasedAt?: string;
}

export default function RiskHoldsPage() {
  const [holds, setHolds] = useState<RiskHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    apiFetch<RiskHold[]>('/api/admin/risk-holds')
      .then((data) => {
        setHolds(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = holds.filter((hold: RiskHold) => {
    if (statusFilter === 'active') return hold.status === 'held' || hold.status === 'dispute_frozen';
    if (statusFilter === 'released') return hold.status === 'released';
    return true;
  });

  const handleReleaseHold = async (orderId: string) => {
    if (!confirm('Release this hold?')) return;

    try {
      await apiFetch(`/api/admin/risk-holds/${orderId}/release`, { method: 'POST' });
      setHolds((prev: RiskHold[]) =>
        prev.map((h: RiskHold) => (h.orderId === orderId ? { ...h, status: 'released', releasedAt: new Date().toISOString() } : h)),
      );
    } catch (err: any) {
      alert('Failed to release hold: ' + (err.message || 'Unknown error'));
    }
  };

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
        <h1>Risk Holds</h1>
        <p className="text-gray-600 text-sm">Manage payment holds for risky orders</p>
      </div>

      <div className="card bg-base-100 shadow mb-6">
        <div className="card-body flex-row items-center justify-between">
          <div>
            <h2 className="card-title text-lg">Status Filter</h2>
          </div>
          <div className="flex gap-2">
            {['active', 'released', 'all'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`btn btn-sm ${statusFilter === filter ? 'btn-primary' : 'btn-ghost'}`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔓</div>
          <p>{statusFilter === 'active' ? 'No active holds' : 'No holds found'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((hold: RiskHold) => (
            <div key={hold.id} className="card bg-base-100 shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="card-title text-lg">
                      <Link to={`/orders/${hold.orderId}`} className="link link-primary">
                        {hold.orderRef}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600 font-mono">{hold.orderId}</p>
                  </div>
                  <span
                    className={`badge ${hold.status === 'released' ? 'badge-success' : 'badge-warning'}`}
                  >
                    {hold.status}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="label-text font-semibold">Reason</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{hold.reason}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="label-text text-gray-600 text-sm">Held At</p>
                    <p className="text-sm">{new Date(hold.heldAt).toLocaleString('en-BD')}</p>
                  </div>
                  {hold.releasedAt && (
                    <div>
                      <p className="label-text text-gray-600 text-sm">Released At</p>
                      <p className="text-sm">{new Date(hold.releasedAt).toLocaleString('en-BD')}</p>
                    </div>
                  )}
                </div>

                {(hold.status === 'held' || hold.status === 'dispute_frozen') && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReleaseHold(hold.orderId)}
                      className="btn btn-sm btn-primary"
                    >
                      Release Hold
                    </button>
                    <Link to={`/orders/${hold.orderId}`} className="btn btn-sm btn-ghost">
                      View Order
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
