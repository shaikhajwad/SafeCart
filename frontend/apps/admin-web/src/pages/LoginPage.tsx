import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface OtpSendResponse {
  message: string;
}

interface OtpVerifyResponse {
  accessToken: string;
  isNewUser: boolean;
}

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    try {
      await apiFetch<OtpSendResponse>('/api/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }),
      });
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<OtpVerifyResponse>('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
      });
      await login(res.accessToken);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="login-title">SafeCart Admin</h1>
          <p className="login-subtitle">Platform Administration</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Admin Mobile Number</label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                placeholder="+8801XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="form-static">{phone}</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="otp">Enter OTP</label>
              <input
                id="otp"
                type="text"
                className="form-input otp-input"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                disabled={loading}
                autoFocus
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify & Sign In'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-full"
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              disabled={loading}
            >
              ← Change number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
