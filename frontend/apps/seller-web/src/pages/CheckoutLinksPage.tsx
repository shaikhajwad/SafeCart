import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import type { CheckoutSession, Product } from '../types';

const APP_BASE_URL = (import.meta.env.VITE_APP_BASE_URL as string | undefined) ?? 'http://localhost:3001';

function formatBDT(paisa: number): string {
  return 'BDT ' + (paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 });
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active'
      ? 'badge badge-success'
      : status === 'used'
        ? 'badge badge-info'
        : status === 'expired'
          ? 'badge badge-danger'
          : 'badge badge-warning';
  return <span className={cls}>{status}</span>;
}

export default function CheckoutLinksPage() {
  const { orgId } = useAuth();
  const [sessions, setSessions] = useState<CheckoutSession[]>([]);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    quantity: '1',
    customTitle: '',
    expiresAt: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    apiFetch<Product[]>(`/api/orgs/${orgId}/products`)
      .then(setProducts)
      .catch(() => setProducts([]));
    // Load existing checkout sessions
    apiFetch<CheckoutSession[]>(`/api/checkout-sessions/orgs/${orgId}/checkout-sessions`)
      .then(setSessions)
      .catch(() => setSessions([]));
  }, [orgId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productId) return;
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        productId: form.productId,
        quantity: parseInt(form.quantity) || 1,
      };
      if (form.customTitle.trim()) body['customTitle'] = form.customTitle.trim();
      if (form.expiresAt) body['expiresAt'] = new Date(form.expiresAt).toISOString();
      const session = await apiFetch<CheckoutSession>('/api/checkout-sessions', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setSessions((prev) => [session, ...prev]);
      setShowForm(false);
      setForm({ productId: '', quantity: '1', customTitle: '', expiresAt: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout link');
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(session: CheckoutSession) {
    const url = `${APP_BASE_URL}/checkout/${session.token}`;
    await navigator.clipboard.writeText(url).catch(() => {
      prompt('Copy this link:', url);
    });
    setCopiedId(session.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (!orgId) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <p>Set up your store first to create checkout links.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Checkout Links</h1>
          <p className="page-subtitle">Share these links with your customers</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setError(''); }}>
          + Create Link
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h2 className="card-title">New Checkout Link</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="cl-product">Product *</label>
                <select
                  id="cl-product"
                  className="form-select"
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  required
                  disabled={saving}
                >
                  <option value="">Select a product…</option>
                  {(products ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatBDT(p.pricePaisa)}
                    </option>
                  ))}
                </select>
                {(products ?? []).length === 0 && (
                  <div className="form-hint">No products found. Add products first.</div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="cl-qty">Quantity</label>
                  <input
                    id="cl-qty"
                    type="number"
                    className="form-input"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cl-expires">Expires At</label>
                  <input
                    id="cl-expires"
                    type="datetime-local"
                    className="form-input"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cl-title">Custom Title</label>
                <input
                  id="cl-title"
                  type="text"
                  className="form-input"
                  placeholder="Optional custom title"
                  value={form.customTitle}
                  onChange={(e) => setForm({ ...form, customTitle: e.target.value })}
                  disabled={saving}
                />
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving || !form.productId}>
                  {saving ? 'Creating…' : 'Create Link'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {orgId !== null && products === null ? (
            <div className="text-center text-muted">Loading…</div>
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <p>No checkout links yet. Create one to start accepting payments.</p>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                + Create Checkout Link
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title / Product</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const product = (products ?? []).find((p) => p.id === s.productId);
                  const url = `${APP_BASE_URL}/checkout/${s.token}`;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div>{s.customTitle ?? product?.name ?? 'Checkout'}</div>
                        <div className="text-muted text-sm font-mono">{s.token}</div>
                      </td>
                      <td className="font-mono">{formatBDT(s.lockedPricePaisa)}</td>
                      <td><StatusBadge status={s.status} /></td>
                      <td className="text-muted">
                        {s.expiresAt ? new Date(s.expiresAt).toLocaleString('en-BD') : '—'}
                      </td>
                      <td>
                        <div className="action-btns">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-ghost"
                          >
                            Open
                          </a>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => copyLink(s)}
                          >
                            {copiedId === s.id ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
