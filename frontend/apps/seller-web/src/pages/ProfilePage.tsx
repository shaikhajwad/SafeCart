import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import type { Org } from '../types';

export default function ProfilePage() {
  const { org, orgId, setOrg } = useAuth();
  const [form, setForm] = useState({
    name: '',
    contactPhone: '',
    website: '',
    description: '',
    tradeLicense: '',
    tin: '',
    ubid: '',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name,
        contactPhone: org.contactPhone ?? '',
        website: org.website ?? '',
        description: org.description ?? '',
        tradeLicense: org.tradeLicense ?? '',
        tin: org.tin ?? '',
        ubid: org.ubid ?? '',
      });
    }
  }, [org]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const updated = await apiFetch<Org>(`/api/orgs/${orgId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name.trim(),
          contactPhone: form.contactPhone.trim() || undefined,
          website: form.website.trim() || undefined,
          description: form.description.trim() || undefined,
          tradeLicense: form.tradeLicense.trim() || undefined,
          tin: form.tin.trim() || undefined,
          ubid: form.ubid.trim() || undefined,
        }),
      });
      setOrg(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  if (!orgId) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <p>Set up your store first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Store Profile</h1>
          <p className="page-subtitle">Manage your business information</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-header">
          <h2 className="card-title">Business Details</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label" htmlFor="p-name">Business Name *</label>
              <input
                id="p-name"
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="p-phone">Contact Phone</label>
              <input
                id="p-phone"
                type="tel"
                className="form-input"
                placeholder="+8801XXXXXXXXX"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="p-website">Website</label>
              <input
                id="p-website"
                type="url"
                className="form-input"
                placeholder="https://yourstore.com"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="p-desc">Description</label>
              <textarea
                id="p-desc"
                className="form-input"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="section-divider">
              <span>Legal Information</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="p-trade">Trade License</label>
                <input
                  id="p-trade"
                  type="text"
                  className="form-input"
                  placeholder="Trade license number"
                  value={form.tradeLicense}
                  onChange={(e) => setForm({ ...form, tradeLicense: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="p-tin">TIN</label>
                <input
                  id="p-tin"
                  type="text"
                  className="form-input"
                  placeholder="Tax identification number"
                  value={form.tin}
                  onChange={(e) => setForm({ ...form, tin: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="p-ubid">UBID</label>
              <input
                id="p-ubid"
                type="text"
                className="form-input"
                placeholder="Unique Business ID"
                value={form.ubid}
                onChange={(e) => setForm({ ...form, ubid: e.target.value })}
                disabled={loading}
              />
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {saved && <div className="alert alert-success">Profile saved successfully!</div>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
