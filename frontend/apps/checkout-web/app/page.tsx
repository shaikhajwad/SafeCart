import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-6 shadow-lg">
          <span className="text-white text-2xl font-bold">S</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">SafeCart</h1>
        <p className="text-gray-500 text-lg mb-8">
          Bangladesh&apos;s trusted F-commerce checkout and escrow platform.
          Shop safely. Pay confidently.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Track My Order
          </Link>
          <a
            href="https://safecart.com.bd"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Learn More
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-10">
          🔒 Payments protected by SafeCart Escrow &middot; Your data is safe
          with us
        </p>
      </div>
    </div>
  );
}
