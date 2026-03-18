import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing – SafeCart",
  description:
    "SafeCart is free for buyers. Sellers pay a tiny per-transaction fee — no monthly subscription, no hidden charges.",
};

const sellerDashboardUrl =
  process.env.NEXT_PUBLIC_SELLER_DASHBOARD_URL ?? "http://localhost:3002";

/* ─── icon helpers ──────────────────────────────────── */

function IconCheck({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
      aria-hidden="true"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/* ─── data ──────────────────────────────────────────── */

const PLANS = [
  {
    id: "buyer",
    name: "Buyer",
    badge: null,
    price: "Free",
    priceSub: "Always free",
    description:
      "Shop safely on any SafeCart-powered store with full escrow protection.",
    cta: "Track My Order",
    ctaHref: "/login",
    ctaStyle: "outline" as const,
    color: "green",
    features: [
      { label: "Escrow-protected payments", included: true },
      { label: "Real-time order tracking", included: true },
      { label: "Dispute resolution within 72 h", included: true },
      { label: "bKash / Nagad / card checkout", included: true },
      { label: "6-year purchase history", included: true },
      { label: "No account required", included: true },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    badge: null,
    price: "1.5%",
    priceSub: "per successful transaction",
    description:
      "Perfect for individual sellers and small F-commerce stores just getting started.",
    cta: "Start Selling Free",
    ctaHref: sellerDashboardUrl,
    ctaStyle: "outline" as const,
    color: "indigo",
    features: [
      { label: "Unlimited checkout links", included: true },
      { label: "Automated order management", included: true },
      { label: "1 courier integration (Pathao)", included: true },
      { label: "SSLCommerz / bKash / Nagad", included: true },
      { label: "Email + SMS notifications", included: true },
      { label: "Priority courier booking", included: false },
      { label: "Multi-courier booking", included: false },
      { label: "Dedicated account manager", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    badge: "Most Popular",
    price: "1.2%",
    priceSub: "per successful transaction",
    description:
      "For growing F-commerce businesses that need multi-courier support and lower fees.",
    cta: "Get Started",
    ctaHref: sellerDashboardUrl,
    ctaStyle: "filled" as const,
    color: "indigo",
    features: [
      { label: "Unlimited checkout links", included: true },
      { label: "Automated order management", included: true },
      { label: "All 4 courier integrations", included: true },
      { label: "SSLCommerz / bKash / Nagad", included: true },
      { label: "Email + SMS notifications", included: true },
      { label: "Priority courier booking", included: true },
      { label: "Multi-courier booking", included: true },
      { label: "Dedicated account manager", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: null,
    price: "Custom",
    priceSub: "volume discounts available",
    description:
      "For high-volume sellers and agencies managing multiple seller accounts.",
    cta: "Contact Us",
    ctaHref: "mailto:sales@safecart.com.bd",
    ctaStyle: "outline" as const,
    color: "slate",
    features: [
      { label: "Unlimited checkout links", included: true },
      { label: "Automated order management", included: true },
      { label: "All 4 courier integrations", included: true },
      { label: "SSLCommerz / bKash / Nagad", included: true },
      { label: "Email + SMS notifications", included: true },
      { label: "Priority courier booking", included: true },
      { label: "Multi-courier booking", included: true },
      { label: "Dedicated account manager", included: true },
    ],
  },
] as const;

const FAQS = [
  {
    q: "Is SafeCart really free for buyers?",
    a: "Yes, 100%. Buyers never pay any platform fee. You only pay the product price and any delivery charge set by the seller.",
  },
  {
    q: "When does SafeCart collect its fee?",
    a: "The transaction fee is deducted from the payment when the escrow is released to the seller — i.e., only after the buyer confirms delivery. No sale, no fee.",
  },
  {
    q: "What counts as a 'successful transaction'?",
    a: "A transaction is successful when the buyer confirms receipt and the funds are released to the seller. Cancelled or refunded orders are not charged.",
  },
  {
    q: "Are there any monthly subscription fees?",
    a: "No. SafeCart is purely pay-per-transaction. You won't be charged anything until you make a sale.",
  },
  {
    q: "Which payment gateways are supported?",
    a: "SSLCommerz (cards, internet banking), bKash, and Nagad are all natively integrated. More options are being added.",
  },
  {
    q: "How do courier integrations work?",
    a: "Once an order is confirmed, SafeCart can book a courier pickup on your behalf with a single click from your seller dashboard. Currently Pathao, eCourier, Paperfly, and RedX are supported on the Growth plan.",
  },
];

const TRUST_SIGNALS = [
  {
    icon: <IconShield />,
    title: "No hidden charges",
    desc: "The fee is shown up-front. No setup costs, no monthly minimum, no surprises.",
  },
  {
    icon: <IconZap />,
    title: "Pay only when you earn",
    desc: "The fee is deducted at payout — only after a confirmed, successful delivery.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Cancel anytime",
    desc: "There's nothing to cancel. Stop using SafeCart at any time — no lock-in, no penalties.",
  },
];

/* ─── page ──────────────────────────────────────────── */

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">SafeCart</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="/#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="/#for-buyers" className="hover:text-indigo-600 transition-colors">For Buyers</a>
            <a href="/#for-sellers" className="hover:text-indigo-600 transition-colors">For Sellers</a>
            <Link href="/pricing" className="text-indigo-600 font-semibold">Pricing</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Track Order
            </Link>
            <a
              href={sellerDashboardUrl}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Start Selling →
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white pt-24 pb-16 px-4 sm:px-6">
        <div aria-hidden="true" className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-500 opacity-10 blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-purple-600 opacity-15 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            🇧🇩 Simple, Transparent Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-5">
            Pay Only When<br />
            <span className="text-indigo-300">You Make a Sale</span>
          </h1>
          <p className="text-indigo-100 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            No monthly fee. No setup cost. SafeCart earns only when you do — a
            small percentage deducted at payout.
          </p>
        </div>
      </section>

      {/* ── Pricing cards ── */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {PLANS.map((plan) => {
              const isPopular = plan.badge === "Most Popular";
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-6 h-full ${
                    isPopular
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-2xl shadow-indigo-200 scale-[1.02]"
                      : "bg-white border-gray-200 text-gray-900 shadow-sm hover:shadow-md"
                  } transition-shadow`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                        <IconStar />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Plan name */}
                  <div className="mb-4">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isPopular ? "text-indigo-200" : "text-indigo-600"}`}>
                      {plan.name}
                    </p>
                    <p className={`text-3xl font-extrabold tracking-tight ${isPopular ? "text-white" : "text-gray-900"}`}>
                      {plan.price}
                    </p>
                    <p className={`text-xs mt-1 ${isPopular ? "text-indigo-200" : "text-gray-400"}`}>
                      {plan.priceSub}
                    </p>
                  </div>

                  {/* Description */}
                  <p className={`text-sm leading-relaxed mb-6 ${isPopular ? "text-indigo-100" : "text-gray-500"}`}>
                    {plan.description}
                  </p>

                  {/* CTA */}
                  {plan.ctaStyle === "filled" ? (
                    <a
                      href={plan.ctaHref}
                      className="mb-6 inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-colors shadow-md"
                    >
                      {plan.cta} →
                    </a>
                  ) : (
                    <a
                      href={plan.ctaHref}
                      className={`mb-6 inline-flex items-center justify-center px-5 py-3 rounded-xl font-bold text-sm border transition-colors ${
                        isPopular
                          ? "border-indigo-300 text-white hover:bg-indigo-500"
                          : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      }`}
                    >
                      {plan.cta} →
                    </a>
                  )}

                  {/* Feature list */}
                  <ul className="space-y-2.5 mt-auto">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-start gap-2.5">
                        <span
                          className={`flex-shrink-0 mt-0.5 ${
                            f.included
                              ? isPopular
                                ? "text-green-300"
                                : "text-green-500"
                              : isPopular
                              ? "text-indigo-400"
                              : "text-gray-300"
                          }`}
                        >
                          {f.included ? <IconCheck className="w-4 h-4" /> : <IconX className="w-4 h-4" />}
                        </span>
                        <span
                          className={`text-sm ${
                            f.included
                              ? isPopular
                                ? "text-white"
                                : "text-gray-700"
                              : isPopular
                              ? "text-indigo-300 line-through"
                              : "text-gray-300 line-through"
                          }`}
                        >
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            All fees are inclusive of VAT. Transaction fee is deducted from payout only on successful deliveries.
          </p>
        </div>
      </section>

      {/* ── Trust signals ── */}
      <section className="py-16 px-4 sm:px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          {TRUST_SIGNALS.map((t) => (
            <div key={t.title} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                {t.icon}
              </div>
              <h3 className="font-bold text-gray-900">{t.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 text-lg">
              Everything you need to know about how SafeCart pricing works.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-indigo-600 text-white py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Sell Safer?
          </h2>
          <p className="text-indigo-200 text-lg mb-8">
            Create your seller account in minutes. No upfront cost — start earning today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={sellerDashboardUrl}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-700 font-bold text-base hover:bg-indigo-50 transition-colors shadow-lg"
            >
              🛒 Start Selling Free →
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-indigo-500/40 border border-white/30 text-white font-bold text-base hover:bg-indigo-500/60 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-white text-lg">SafeCart</span>
              </div>
              <p className="text-sm leading-relaxed">
                Bangladesh&apos;s trusted checkout and escrow platform for F-commerce sellers and buyers.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-white font-semibold mb-3">Product</p>
                <ul className="space-y-2">
                  <li><a href="/#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="/#for-buyers" className="hover:text-white transition-colors">For Buyers</a></li>
                  <li><a href="/#for-sellers" className="hover:text-white transition-colors">For Sellers</a></li>
                  <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Platforms</p>
                <ul className="space-y-2">
                  <li><a href={sellerDashboardUrl} className="hover:text-white transition-colors">Seller Dashboard</a></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Order Tracking</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Support</p>
                <ul className="space-y-2">
                  <li><a href="mailto:support@safecart.com.bd" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="https://safecart.com.bd/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="https://safecart.com.bd/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
            <p>© {new Date().getFullYear()} SafeCart. All rights reserved.</p>
            <p>🔒 Payments protected by SafeCart Escrow &middot; Your data is safe with us</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
