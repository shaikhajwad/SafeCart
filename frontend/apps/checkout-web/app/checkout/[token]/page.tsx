import { notFound } from 'next/navigation';
import CheckoutForm from './CheckoutForm';

interface Product {
  id: string;
  title: string;
  description?: string;
  imageCoverUrl?: string;
  pricePaisa: number;
}

interface SellerOrg {
  id: string;
  name: string;
  logoUrl?: string;
}

interface CheckoutSession {
  id: string;
  token: string;
  status: string;
  quantity: number;
  lockedPricePaisa: number;
  customTitle?: string;
  expiresAt?: string;
  product?: Product;
  sellerOrg?: SellerOrg;
}

async function getCheckoutSession(token: string): Promise<CheckoutSession | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
  try {
    const res = await fetch(`${apiBase}/api/checkout-sessions/${token}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<CheckoutSession>;
  } catch {
    return null;
  }
}

function formatBDT(paisa: number): string {
  return (paisa / 100).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getCheckoutSession(token);

  if (!session) {
    notFound();
  }

  if (session.status === 'EXPIRED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow p-8 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⏰</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-500 text-sm">
            This checkout link has expired. Please contact the seller for a new
            link.
          </p>
        </div>
      </div>
    );
  }

  if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow p-8 text-center">
          <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-yellow-600 text-2xl">ℹ️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {session.status === 'COMPLETED' ? 'Already Completed' : 'Checkout Cancelled'}
          </h1>
          <p className="text-gray-500 text-sm">
            This checkout session is no longer active. Please contact the seller
            if you need assistance.
          </p>
        </div>
      </div>
    );
  }

  const title =
    session.customTitle ?? session.product?.title ?? 'Your Order';
  const unitPaisa = session.lockedPricePaisa;
  const totalPaisa = unitPaisa * session.quantity;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 mb-3 shadow">
            <span className="text-white text-base font-bold">S</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900">SafeCart</h1>
          <p className="text-xs text-gray-400 mt-0.5">Secure Checkout</p>
        </div>

        {/* Seller org banner */}
        {session.sellerOrg && (
          <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm px-4 py-3 mb-4">
            {session.sellerOrg.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={session.sellerOrg.logoUrl}
                alt={session.sellerOrg.name}
                className="h-8 w-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 font-bold text-sm">
                  {session.sellerOrg.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Sold by</p>
              <p className="text-sm font-semibold text-gray-800">
                {session.sellerOrg.name}
              </p>
            </div>
          </div>
        )}

        {/* Product / order summary */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          {session.product?.imageCoverUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={session.product.imageCoverUrl}
              alt={title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
          {session.product?.description && (
            <p className="text-sm text-gray-500 mb-3">
              {session.product.description}
            </p>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              ৳{formatBDT(unitPaisa)} × {session.quantity}{' '}
              {session.quantity === 1 ? 'item' : 'items'}
            </div>
            <div className="text-xl font-bold text-indigo-700">
              ৳{formatBDT(totalPaisa)}
            </div>
          </div>
        </div>

        {/* Checkout form */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-5">
            Delivery Details
          </h3>
          <CheckoutForm token={token} />
        </div>
      </div>
    </div>
  );
}
