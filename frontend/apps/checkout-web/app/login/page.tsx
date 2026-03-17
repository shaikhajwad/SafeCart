'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 'phone' | 'otp';

const BD_PHONE_RE = /^\+8801[3-9]\d{8}$/;

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

export default function LoginPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  function validatePhone(value: string): boolean {
    if (!value) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!BD_PHONE_RE.test(value)) {
      setPhoneError('Enter a valid Bangladesh number: +8801XXXXXXXXX');
      return false;
    }
    setPhoneError('');
    return true;
  }

  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!validatePhone(phone)) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data as { error?: { message?: string } })?.error?.message ??
          (data as { message?: string })?.message ??
          'Failed to send OTP. Please try again.';
        throw new Error(msg);
      }
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!otp.trim()) {
      setError('Please enter the OTP sent to your phone.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otp.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data as { error?: { message?: string } })?.error?.message ??
          (data as { message?: string })?.message ??
          'Invalid OTP. Please try again.';
        throw new Error(msg);
      }
      const { accessToken } = (await res.json()) as {
        accessToken: string;
        isNewUser: boolean;
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('safecart_token', accessToken);
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 mb-4 shadow-lg"
          >
            <span className="text-white text-xl font-bold">S</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">SafeCart</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to track your orders
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-7">
          {step === 'phone' ? (
            <>
              <h2 className="text-base font-semibold text-gray-800 mb-5">
                Enter your phone number
              </h2>
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </div>
              )}
              <form onSubmit={handleSendOtp} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="+8801XXXXXXXXX"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) validatePhone(e.target.value);
                    }}
                    onBlur={(e) => validatePhone(e.target.value)}
                    aria-describedby={phoneError ? 'phone-err' : undefined}
                    aria-invalid={!!phoneError}
                    className={`${inputCls} ${phoneError ? 'border-red-400 focus:ring-red-400' : ''}`}
                  />
                  {phoneError && (
                    <p id="phone-err" className="mt-1 text-xs text-red-600">
                      {phoneError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending OTP…
                    </span>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-gray-800 mb-1">
                Verify your phone
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Enter the 6-digit OTP sent to{' '}
                <span className="font-medium text-gray-700">{phone}</span>
              </p>
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </div>
              )}
              <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    One-Time Password
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    className={`${inputCls} tracking-widest text-center text-lg`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Verifying…
                    </span>
                  ) : (
                    'Verify & Sign In'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                  }}
                  className="w-full text-sm text-indigo-600 hover:underline"
                >
                  ← Change phone number
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          🔒 SafeCart keeps your data safe and private
        </p>
      </div>
    </div>
  );
}
