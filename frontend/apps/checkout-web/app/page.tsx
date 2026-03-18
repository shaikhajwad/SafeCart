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

function IconCheck({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/* ─── data ──────────────────────────────────────────────────────── */

const BUYER_FEATURES = [
  {
    icon: <IconShield />,
    title: "Escrow-Protected Payments",
    desc: "Your money is held securely in escrow and only released to the seller after you confirm delivery.",
    color: "blue",
  },
  {
    icon: <IconTruck />,
    title: "Real-Time Order Tracking",
    desc: "Track your order from checkout through dispatch to doorstep — no login required with your access code.",
    color: "emerald",
  },
  {
    icon: <IconRefund />,
    title: "Easy Refunds & Disputes",
    desc: "Changed your mind or item not as described? Raise a dispute and our team resolves it within 72 hours.",
    color: "amber",
  },
  {
    icon: <IconBolt />,
    title: "Instant Payment Options",
    desc: "Pay via SSLCommerz, bKash, or Nagad — all major Bangladesh payment methods supported.",
    color: "violet",
  },
];

const SELLER_FEATURES = [
  {
    icon: <IconLink />,
    title: "Shareable Checkout Links",
    desc: "Generate a secure checkout link in seconds and share it directly in Messenger, WhatsApp, or your Facebook post.",
    color: "blue",
  },
  {
    icon: <IconClipboard />,
    title: "Automated Order Management",
    desc: "Orders, payment confirmations, and shipment bookings handled automatically — less manual work for you.",
    color: "emerald",
  },
  {
    icon: <IconTruck />,
    title: "Multi-Courier Booking",
    desc: "Pathao, eCourier, Paperfly, RedX — book couriers with one click straight from your seller dashboard.",
    color: "amber",
  },
  {
    icon: <IconShield />,
    title: "Compliance Built-In",
    desc: "Stay aligned with Bangladesh Digital Commerce Operation Guidelines 2021 with zero extra effort.",
    color: "violet",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Seller Creates a Checkout Link",
    desc: "A seller lists their product on SafeCart and shares a unique, tamper-proof checkout link on Facebook, Messenger, or WhatsApp.",
    emoji: "🔗",
  },
  {
    step: "02",
    title: "Buyer Pays Securely",
    desc: "The buyer opens the link, fills in their delivery details, and pays via bKash, card, or mobile banking — all protected by escrow.",
    emoji: "💳",
  },
  {
    step: "03",
    title: "Deliver → Confirm → Release",
    desc: "The courier delivers the parcel. Once the buyer confirms receipt, the escrow hold is released to the seller automatically.",
    emoji: "✅",
  },
];

const TRUST_STATS = [
  { value: "৳0", label: "Buyer Losses to Fraud", icon: "🛡️" },
  { value: "4+", label: "Courier Partners", icon: "🚚" },
  { value: "72h", label: "Dispute Resolution SLA", icon: "⚡" },
  { value: "100%", label: "Compliant with BDCOG 2021", icon: "✅" },
];

const TESTIMONIALS = [
  {
    quote: "SafeCart made my F-commerce store feel like a real business. Buyers trust me more now because they see escrow protection.",
    name: "Farhan Ahmed",
    role: "Clothing Seller, Dhaka",
    avatar: "FA",
  },
  {
    quote: "I was scammed twice before. With SafeCart, my money stays safe until I get my package. Finally I can shop online with confidence!",
    name: "Nusrat Jahan",
    role: "Buyer, Chittagong",
    avatar: "NJ",
  },
  {
    quote: "The multi-courier booking feature saves me at least 2 hours every day. I can focus on growing my business instead of logistics.",
    name: "Raihan Islam",
    role: "Electronics Seller, Sylhet",
    avatar: "RI",
  },
];

const sellerDashboardUrl = process.env.NEXT_PUBLIC_SELLER_DASHBOARD_URL ?? "http://localhost:3002";

const featureColorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-600",    iconBg: "bg-blue-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", iconBg: "bg-emerald-100" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-600",   iconBg: "bg-amber-100" },
  violet:  { bg: "bg-violet-50",  text: "text-violet-600",  iconBg: "bg-violet-100" },
};

/* ─── page ──────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-200 group-hover:shadow-indigo-300 transition-shadow">
              <span className="text-white font-black text-sm tracking-tight">S</span>
            </div>
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">SafeCart</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600">
            <a href="#how-it-works" className="px-3 py-2 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all">How It Works</a>
            <a href="#for-buyers" className="px-3 py-2 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all">For Buyers</a>
            <a href="#for-sellers" className="px-3 py-2 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all">For Sellers</a>
            <Link href="/pricing" className="px-3 py-2 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all">Pricing</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              Track Order
            </Link>
            <a
              href={sellerDashboardUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
            >
              Start Selling <IconArrow />
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-indigo-900 text-white">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{backgroundImage:"radial-gradient(ellipse 80% 50% at 50% -20%,rgba(99,102,241,0.35),transparent)"}} />
        <div aria-hidden="true" className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-500 opacity-10 blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-purple-600 opacity-15 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-28 md:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/85 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              🇧🇩 Built for Bangladesh F-Commerce
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.08] tracking-tight mb-6">
              The Safest Way to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                Buy &amp; Sell Online
              </span>
            </h1>

            <p className="text-indigo-100/80 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              SafeCart gives buyers <strong className="text-white font-semibold">escrow-protected payments</strong> and real-time tracking, and gives sellers <strong className="text-white font-semibold">professional checkout links</strong>, automated courier booking, and full compliance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-indigo-700 font-bold text-base hover:bg-indigo-50 transition-all shadow-xl shadow-black/20"
              >
                <span>📦</span> Track My Order
                <IconArrow />
              </Link>
              <a
                href={sellerDashboardUrl}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-indigo-500/30 border border-white/20 text-white font-bold text-base hover:bg-indigo-500/50 transition-all backdrop-blur-sm"
              >
                <span>🛒</span> Start Selling Free
                <IconArrow />
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-indigo-300/70">
              <span className="flex items-center gap-1.5"><IconCheck className="w-4 h-4 text-green-400" /> No monthly fee</span>
              <span className="text-indigo-600">·</span>
              <span className="flex items-center gap-1.5"><IconCheck className="w-4 h-4 text-green-400" /> Payments in escrow</span>
              <span className="text-indigo-600">·</span>
              <span className="flex items-center gap-1.5"><IconCheck className="w-4 h-4 text-green-400" /> bKash &amp; Nagad supported</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none" aria-hidden="true">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-10">
            <path d="M0 40L1440 40L1440 20C1200 0 960 40 720 20C480 0 240 40 0 20L0 40Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Trust stats bar ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl mb-1.5">{s.icon}</div>
              <p className="text-3xl font-black text-indigo-600 tracking-tight leading-none mb-1">{s.value}</p>
              <p className="text-xs text-gray-500 font-medium leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">
              Three Steps to Safe Commerce
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
              From checkout link to cash in hand — with trust baked in at every stage.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div aria-hidden="true" className="hidden md:block absolute top-14 left-[calc(33.3%+16px)] right-[calc(33.3%+16px)] h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-300 to-indigo-200" />

            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="relative z-10">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all p-8 text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-2xl mb-5 shadow-lg shadow-indigo-200 group-hover:-translate-y-1 transition-transform">
                    {item.emoji}
                  </div>
                  <div className="inline-block bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                    Step {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Buyers ── */}
      <section id="for-buyers" className="py-24 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
              For Buyers
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">
              Shop With Complete Confidence
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
              Your money is safe until the parcel is in your hands. No more fraud, no more &ldquo;payment er por kono update nei.&rdquo;
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BUYER_FEATURES.map((f) => {
              const c = featureColorMap[f.color];
              return (
                <div key={f.title} className={`rounded-2xl ${c.bg} p-6 hover:shadow-lg hover:-translate-y-1 transition-all group`}>
                  <div className={`w-12 h-12 rounded-2xl ${c.iconBg} ${c.text} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-base leading-snug">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              📦 Track Your Order <IconArrow />
            </Link>
          </div>
        </div>
      </section>

      {/* ── For Sellers ── */}
      <section id="for-sellers" className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
              For Sellers
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">
              Run Your F-Commerce Like a Pro
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
              From product listing to courier dispatch — SafeCart handles the operational complexity so you can focus on selling.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SELLER_FEATURES.map((f) => {
              const c = featureColorMap[f.color];
              return (
                <div key={f.title} className={`rounded-2xl ${c.bg} p-6 hover:shadow-lg hover:-translate-y-1 transition-all group`}>
                  <div className={`w-12 h-12 rounded-2xl ${c.iconBg} ${c.text} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-base leading-snug">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <a
              href={sellerDashboardUrl}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              🛒 Open Your Seller Dashboard <IconArrow />
            </a>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
              What People Say
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">
              Trusted by Buyers &amp; Sellers
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 24 24" fill="#f59e0b" className="w-4 h-4" aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compliance CTA banner ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white py-20 px-4 sm:px-6">
        <div aria-hidden="true" className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white opacity-5 blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-purple-400 opacity-10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-block bg-white/10 border border-white/15 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            🏛️ Regulatory Compliance
          </span>
          <h2 className="text-3xl sm:text-4xl font-black mb-5 leading-tight">
            Fully Compliant with Bangladesh<br className="hidden sm:block" /> Digital Commerce Guidelines 2021
          </h2>
          <p className="text-indigo-100/80 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            SafeCart is built on top of the BDCOG 2021 framework — every order, payment, and dispute is logged with a 6-year immutable audit trail.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {[
              "Pre-purchase disclosure",
              "Buyer grievance channel",
              "Escrow release rules",
              "Refund timelines",
              "KYC-verified sellers",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-white text-sm font-medium px-4 py-2 rounded-xl backdrop-blur-sm">
                <IconCheck className="w-4 h-4 text-green-400" />
                {item}
              </span>
            ))}
          </div>

          <a
            href={sellerDashboardUrl}
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-white text-indigo-700 font-bold text-base hover:bg-indigo-50 transition-all shadow-xl"
          >
            Get Started Free — No Subscription <IconArrow />
          </a>
        </div>
      </section>

      {/* ── Pricing teaser ── */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-3">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 mb-6">Buyers always free. Sellers pay only a small % per successful transaction — no monthly fee.</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-indigo-200 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors"
          >
            View Pricing Plans <IconArrow />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-400 py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-md">
                  <span className="text-white font-black text-sm">S</span>
                </div>
                <span className="font-extrabold text-white text-lg tracking-tight">SafeCart</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-500">
                Bangladesh&apos;s trusted checkout and escrow platform for F-commerce sellers and buyers.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Product</p>
                <ul className="space-y-2.5">
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#for-buyers" className="hover:text-white transition-colors">For Buyers</a></li>
                  <li><a href="#for-sellers" className="hover:text-white transition-colors">For Sellers</a></li>
                  <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Platforms</p>
                <ul className="space-y-2.5">
                  <li><a href={sellerDashboardUrl} className="hover:text-white transition-colors">Seller Dashboard</a></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Order Tracking</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Support</p>
                <ul className="space-y-2.5">
                  <li><a href="mailto:support@safecart.com.bd" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="https://safecart.com.bd/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="https://safecart.com.bd/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} SafeCart. All rights reserved.</p>
            <p>🔒 Payments protected by SafeCart Escrow &middot; Your data is safe with us</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
