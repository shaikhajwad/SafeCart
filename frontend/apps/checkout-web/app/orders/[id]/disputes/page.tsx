'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Dispute {
  id: string;
  orderId: string;
  reason: string;
  status: string;
  createdAt: string;
  evidence: Array<{
    id: string;
    fileKey: string;
    description?: string;
  }>;
}

export default function DisputePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const accessCode = searchParams.get('access_code');

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const url = `/api/orders/${params.id}/disputes`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setDisputes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setDisputes([]);
        setLoading(false);
      });
  }, [params.id]);

  const handleCreateDispute = async () => {
    if (!reason.trim()) {
      setError('Please enter a dispute reason');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const query = accessCode ? `?access_code=${encodeURIComponent(accessCode)}` : '';
      const res = await fetch(`/api/orders/${params.id}/disputes${query}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create dispute');
      }

      const newDispute = await res.json();
      setDisputes([newDispute, ...disputes]);
      setReason('');
      setShowCreateForm(false);
      setSuccess('Dispute created successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create dispute');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={`/orders/${params.id}`} className="text-green-600 hover:text-green-700 font-medium">
            ← Back to Order
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Disputes</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
              {success}
            </div>
          )}

          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mb-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
            >
              + Create New Dispute
            </button>
          )}

          {showCreateForm && (
            <div className="mb-6 p-4 border-2 border-green-200 rounded-lg bg-green-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create a Dispute</h3>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe your issue with this order..."
                className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-600"
                rows={5}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateDispute}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {submitting ? 'Creating...' : 'Submit Dispute'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setReason('');
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {disputes.length === 0 && !showCreateForm && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No disputes yet</p>
            </div>
          )}

          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="p-4 border border-gray-200 rounded-lg hover:shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">Dispute #{dispute.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">{new Date(dispute.createdAt).toLocaleString()}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      dispute.status === 'open'
                        ? 'bg-yellow-100 text-yellow-800'
                        : dispute.status === 'resolved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {dispute.status}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{dispute.reason}</p>
                {dispute.evidence && dispute.evidence.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Evidence ({dispute.evidence.length}):</p>
                    <ul className="list-disc list-inside">
                      {dispute.evidence.map((ev) => (
                        <li key={ev.id}>{ev.description || ev.fileKey}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
