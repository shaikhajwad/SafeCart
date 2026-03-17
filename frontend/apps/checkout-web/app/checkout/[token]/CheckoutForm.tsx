'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CheckoutFormProps {
  token: string;
}

interface FormState {
  buyerName: string;
  buyerPhone: string;
  addressLine1: string;
  addressLine2: string;
  district: string;
  thana: string;
  postalCode: string;
  specialInstructions: string;
  consentTerms: boolean;
  consentCookies: boolean;
}

interface OrderCreatedResponse {
  id: string;
  accessCode?: string;
}

const INITIAL_FORM: FormState = {
  buyerName: '',
  buyerPhone: '',
  addressLine1: '',
  addressLine2: '',
  district: '',
  thana: '',
  postalCode: '',
  specialInstructions: '',
  consentTerms: false,
  consentCookies: false,
};

const BD_PHONE_RE = /^\+8801[3-9]\d{8}$/;

function InputField({
  id,
  label,
  optional,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {optional && <span className="ml-1 text-xs text-gray-400">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

export default function CheckoutForm({ token }: CheckoutFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [phoneError, setPhoneError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validatePhone(value: string) {
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg('');

    if (!validatePhone(form.buyerPhone)) return;
    if (!form.consentTerms) {
      setErrorMsg('You must agree to the terms and conditions to proceed.');
      return;
    }

    setSubmitting(true);

    try {
      const body: Record<string, string> = {
        buyerName: form.buyerName,
        buyerPhone: form.buyerPhone,
        addressLine1: form.addressLine1,
        district: form.district,
        thana: form.thana,
      };
      if (form.addressLine2) body.addressLine2 = form.addressLine2;
      if (form.postalCode) body.postalCode = form.postalCode;
      if (form.specialInstructions) body.specialInstructions = form.specialInstructions;

      const res = await fetch(`${apiBase}/api/checkout-sessions/${token}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data as { error?: { message?: string } })?.error?.message ??
          (data as { message?: string })?.message ??
          'Failed to place order. Please try again.';
        throw new Error(msg);
      }

      const order = await res.json() as OrderCreatedResponse;
      if (!order.id) throw new Error('Invalid response from server.');
      const qs = order.accessCode ? `?access_code=${encodeURIComponent(order.accessCode)}` : '';
      router.push(`/orders/${order.id}${qs}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {errorMsg && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
        >
          {errorMsg}
        </div>
      )}

      <InputField id="buyerName" label="Full Name">
        <input
          id="buyerName"
          type="text"
          required
          autoComplete="name"
          placeholder="Your full name"
          value={form.buyerName}
          onChange={(e) => set('buyerName', e.target.value)}
          className={inputCls}
        />
      </InputField>

      <InputField id="buyerPhone" label="Phone Number">
        <input
          id="buyerPhone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+8801XXXXXXXXX"
          value={form.buyerPhone}
          onChange={(e) => {
            set('buyerPhone', e.target.value);
            if (phoneError) validatePhone(e.target.value);
          }}
          onBlur={(e) => validatePhone(e.target.value)}
          aria-describedby={phoneError ? 'phone-error' : undefined}
          aria-invalid={!!phoneError}
          className={`${inputCls} ${phoneError ? 'border-red-400 focus:ring-red-400' : ''}`}
        />
        {phoneError && (
          <p id="phone-error" className="mt-1 text-xs text-red-600">
            {phoneError}
          </p>
        )}
      </InputField>

      <InputField id="addressLine1" label="Address Line 1">
        <input
          id="addressLine1"
          type="text"
          required
          autoComplete="address-line1"
          placeholder="House / Road / Area"
          value={form.addressLine1}
          onChange={(e) => set('addressLine1', e.target.value)}
          className={inputCls}
        />
      </InputField>

      <InputField id="addressLine2" label="Address Line 2" optional>
        <input
          id="addressLine2"
          type="text"
          autoComplete="address-line2"
          placeholder="Apartment, floor, etc."
          value={form.addressLine2}
          onChange={(e) => set('addressLine2', e.target.value)}
          className={inputCls}
        />
      </InputField>

      <div className="grid grid-cols-2 gap-3">
        <InputField id="district" label="District">
          <input
            id="district"
            type="text"
            required
            placeholder="Dhaka"
            value={form.district}
            onChange={(e) => set('district', e.target.value)}
            className={inputCls}
          />
        </InputField>
        <InputField id="thana" label="Thana / Upazila">
          <input
            id="thana"
            type="text"
            required
            placeholder="Gulshan"
            value={form.thana}
            onChange={(e) => set('thana', e.target.value)}
            className={inputCls}
          />
        </InputField>
      </div>

      <InputField id="postalCode" label="Postal Code" optional>
        <input
          id="postalCode"
          type="text"
          autoComplete="postal-code"
          placeholder="1212"
          value={form.postalCode}
          onChange={(e) => set('postalCode', e.target.value)}
          className={inputCls}
        />
      </InputField>

      <InputField id="specialInstructions" label="Special Instructions" optional>
        <textarea
          id="specialInstructions"
          rows={3}
          placeholder="Any notes for the seller or courier..."
          value={form.specialInstructions}
          onChange={(e) => set('specialInstructions', e.target.value)}
          className={`${inputCls} resize-none`}
        />
      </InputField>

      <div className="space-y-3 pt-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            id="consentTerms"
            required
            checked={form.consentTerms}
            onChange={(e) => set('consentTerms', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
          />
          <span className="text-sm text-gray-600">
            I agree to the{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              terms and conditions
            </a>{' '}
            and consent to my personal data being used for order processing.
            <span className="text-red-500 ml-0.5">*</span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            id="consentCookies"
            checked={form.consentCookies}
            onChange={(e) => set('consentCookies', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
          />
          <span className="text-sm text-gray-600">
            I acknowledge that this site uses cookies to improve user experience
            and order tracking.
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Placing Order…
          </span>
        ) : (
          'Place Order'
        )}
      </button>

      <p className="text-center text-xs text-gray-400 pb-1">
        🔒 Your payment is protected by SafeCart Escrow
      </p>
    </form>
  );
}
