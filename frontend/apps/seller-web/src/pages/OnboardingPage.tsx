import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import type { Org } from '../types';

export default function OnboardingPage() {
  const { setOrg } = useAuth();
  const [name, setName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const org = await apiFetch<Org>('/api/orgs', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          contactPhone: contactPhone.trim() || undefined,
          website: website.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      setOrg(org);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div className="login-header">
          <div className="login-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" />
              <line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" />
              <path d="M9 22v-4h6v4" />
            </svg>
          </div>
          <h1 className="login-title">Set Up Your Store</h1>
          <p className="login-subtitle">Tell us about your business</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="org-name">Business Name *</label>
            <input
              id="org-name"
              type="text"
              className="form-input"
              placeholder="Your store name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contact-phone">Contact Phone</label>
            <input
              id="contact-phone"
              type="tel"
              className="form-input"
              placeholder="+8801XXXXXXXXX"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="website">Website</label>
            <input
              id="website"
              type="url"
              className="form-input"
              placeholder="https://yourstore.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className="form-input"
              placeholder="What do you sell?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !name.trim()}>
            {loading ? 'Creating…' : 'Create Store →'}
          </button>
        </form>
      </div>
    </div>
  );
}
