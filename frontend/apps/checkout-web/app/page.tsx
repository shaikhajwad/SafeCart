import Link from "next/link";

/* ─── tiny inline-SVG icon helpers ─────────────────────────────── */

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 5v4h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </svg>
  );
}

function IconRefund() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.81" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ─── data ──────────────────────────────────────────────────────── */

const BUYER_FEATURES = [
  {
    icon: <IconShield />,
    title: "Escrow-Protected Payments",
    desc: "Your money is held securely in escrow and only released to the seller after you confirm delivery.",
  },
  {
    icon: <IconTruck />,
    title: "Real-Time Order Tracking",
    desc: "Track your order from checkout through dispatch to doorstep — no login required with your access code.",
  },
  {
    icon: <IconRefund />,
    title: "Easy Refunds & Disputes",
    desc: "Changed your mind or item not as described? Raise a dispute and our team resolves it within 72 hours.",
  },
  {
    icon: <IconBolt />,
    title: "Instant Payment Options",
    desc: "Pay via SSLCommerz, bKash, or Nagad — all major Bangladesh payment methods supported.",
  },
];

const SELLER_FEATURES = [
  {
    icon: <IconLink />,
    title: "Shareable Checkout Links",
    desc: "Generate a secure checkout link in seconds and share it directly in Messenger, WhatsApp, or your Facebook post.",
  },
  {
    icon: <IconClipboard />,
    title: "Automated Order Management",
    desc: "Orders, payment confirmations, and shipment bookings handled automatically — less manual work for you.",
  },
  {
    icon: <IconTruck />,
    title: "Multi-Courier Booking",
    desc: "Pathao, eCourier, Paperfly, RedX — book couriers with one click straight from your seller dashboard.",
  },
  {
    icon: <IconShield />,
    title: "Compliance Built-In",
    desc: "Stay aligned with Bangladesh Digital Commerce Operation Guidelines 2021 with zero extra effort.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Seller Creates a Checkout Link",
    desc: "A seller lists their product on SafeCart and shares a unique, tamper-proof checkout link on Facebook, Messenger, or WhatsApp.",
  },
  {
    step: "02",
    title: "Buyer Pays Securely",
    desc: "The buyer opens the link, fills in their delivery details, and pays via bKash, card, or mobile banking — all protected by escrow.",
  },
  {
    step: "03",
    title: "Deliver → Confirm → Release",
    desc: "The courier delivers the parcel. Once the buyer confirms receipt, the escrow hold is released to the seller automatically.",
  },
];

const TRUST_STATS = [
  { value: "৳0", label: "Buyer Losses to Fraud" },
  { value: "4+", label: "Courier Partners" },
  { value: "72h", label: "Dispute Resolution SLA" },
  { value: "100%", label: "Compliant with BDCOG 2021" },
];

/* ─── page ──────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">SafeCart</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#for-buyers" className="hover:text-indigo-600 transition-colors">For Buyers</a>
            <a href="#for-sellers" className="hover:text-indigo-600 transition-colors">For Sellers</a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Track Order
            </Link>
            <a
              href="https://seller.safecart.com.bd"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Start Selling →
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white">
        {/* decorative blobs */}
        <div aria-hidden="true" className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500 opacity-20 blur-3xl" />
        <div aria-hidden="true" className="absolute bottom-0 -left-16 w-72 h-72 rounded-full bg-purple-600 opacity-20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 md:py-32 text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            🇧🇩 Built for Bangladesh F-Commerce
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            The Safe Way to Buy &amp; Sell<br className="hidden sm:block" />
            on Facebook Commerce
          </h1>

          <p className="text-indigo-100 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            SafeCart gives buyers escrow-protected payments and real-time tracking, and gives sellers professional checkout links, automated courier booking, and full compliance — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-700 font-bold text-base hover:bg-indigo-50 transition-colors shadow-lg"
            >
              📦 Track My Order
            </Link>
            <a
              href="https://seller.safecart.com.bd"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-indigo-500/40 border border-white/30 text-white font-bold text-base hover:bg-indigo-500/60 transition-colors backdrop-blur-sm"
            >
              🛒 Start Selling Free →
            </a>
          </div>

          <p className="text-indigo-300 text-sm mt-8">
            🔒 Payments held in escrow &middot; Released only after delivery confirmed
          </p>
        </div>
      </section>

      {/* ── Trust stats bar ── */}
      <section className="bg-indigo-50 border-y border-indigo-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {TRUST_STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-indigo-600">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              How SafeCart Works
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Three simple steps from checkout link to cash in hand — with trust baked in at every stage.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="relative">
                {/* connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div aria-hidden="true" className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-indigo-100 -translate-x-4 z-0" />
                )}
                <div className="relative z-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 h-full hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-extrabold mb-5 shadow-sm">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Buyers ── */}
      <section id="for-buyers" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-green-100 text-green-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              For Buyers
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              Shop With Complete Confidence
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Your money is safe until the parcel is in your hands. No more fraud, no more &ldquo;payment er por kono update nei.&rdquo;
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BUYER_FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              📦 Track Your Order →
            </Link>
          </div>
        </div>
      </section>

      {/* ── For Sellers ── */}
      <section id="for-sellers" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              For Sellers
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              Run Your F-Commerce Like a Pro
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              From product listing to courier dispatch — SafeCart handles the operational complexity so you can focus on selling.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SELLER_FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href="https://seller.safecart.com.bd"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              🛒 Open Your Seller Dashboard →
            </a>
          </div>
        </div>
      </section>

      {/* ── Compliance CTA banner ── */}
      <section className="bg-indigo-600 text-white py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Fully Compliant with Bangladesh Digital Commerce Guidelines 2021
          </h2>
          <p className="text-indigo-200 text-lg mb-8 max-w-2xl mx-auto">
            SafeCart is built on top of the BDCOG 2021 framework — every order, payment, and dispute is logged with a 6-year immutable audit trail.
          </p>

          <ul className="flex flex-col sm:flex-row gap-4 justify-center text-sm font-medium text-indigo-100 mb-10">
            {[
              "Pre-purchase disclosure",
              "Buyer grievance channel",
              "Escrow release rules",
              "Refund timelines",
              "KYC-verified sellers",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-green-400"><IconCheck /></span>
                {item}
              </li>
            ))}
          </ul>

          <a
            href="https://seller.safecart.com.bd"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-700 font-bold text-base hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Get Started Free — No Subscription →
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
            {/* Brand */}
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

            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-white font-semibold mb-3">Product</p>
                <ul className="space-y-2">
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#for-buyers" className="hover:text-white transition-colors">For Buyers</a></li>
                  <li><a href="#for-sellers" className="hover:text-white transition-colors">For Sellers</a></li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Platforms</p>
                <ul className="space-y-2">
                  <li><a href="https://seller.safecart.com.bd" className="hover:text-white transition-colors">Seller Dashboard</a></li>
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
