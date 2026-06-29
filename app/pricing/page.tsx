import Link from "next/link";

const PACKS = [
  {
    name: "Starter",
    price: "9€",
    reviews: 10,
    perReview: "0.90€",
    url: process.env.NEXT_PUBLIC_LS_10_REVIEWS_URL,
    description: "Perfect for focused interview prep.",
    features: [
      "10 AI-graded reviews",
      "Bug breakdown per session",
      "Interviewer feedback",
      "All languages",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "19€",
    reviews: 30,
    perReview: "0.63€",
    url: process.env.NEXT_PUBLIC_LS_30_REVIEWS_URL,
    description: "For engineers serious about leveling up.",
    features: [
      "30 AI-graded reviews",
      "Bug breakdown per session",
      "Interviewer feedback",
      "All languages",
      "Review history",
    ],
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      {/* NAV */}
      <nav className="border-b border-[#252525] px-8 h-16 flex items-center justify-between sticky top-0 bg-[#0f0f0f]/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-[18px] font-black tracking-[-0.5px] text-white"
          >
            Review<span className="text-indigo-400">IQ</span>
          </Link>
          <div className="flex items-center gap-1">
            {[
              { label: "Product", href: "/" },
              { label: "Pricing", href: "/pricing" },
              { label: "Changelog", href: "/" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={`text-[13px] font-semibold cursor-pointer transition-all px-3 py-1.5 rounded-md ${
                  label === "Pricing"
                    ? "text-white bg-[#222]"
                    : "text-[#777] hover:text-white hover:bg-[#1a1a1a]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13px] font-semibold text-[#777] hover:text-white transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="bg-white text-black text-[13px] font-bold px-5 py-2 rounded-md hover:bg-[#e4e4e7] transition-colors tracking-tight"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* HEADER */}
      <div className="text-center px-4 pt-24 pb-16">
        <p className="text-[11px] font-bold text-[#444] uppercase tracking-widest mb-4">
          Pricing
        </p>
        <h1
          className="text-[48px] font-black tracking-tight leading-tight mb-4"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #888 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          One interview pass pays
          <br />
          for this many times over.
        </h1>
        <p className="text-[#555] text-[15px] max-w-md mx-auto">
          No subscription. Buy a pack, use it when you need it. Credits never
          expire.
        </p>
      </div>

      {/* CARDS */}
      <div className="flex justify-center gap-6 px-8 pb-24">
        {PACKS.map((pack) => (
          <div
            key={pack.name}
            className={`w-80 rounded-xl border p-8 flex flex-col gap-6 relative ${
              pack.highlight
                ? "border-white/20 bg-[#141414]"
                : "border-[#222] bg-[#0f0f0f]"
            }`}
          >
            {pack.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full tracking-wide">
                MOST POPULAR
              </div>
            )}

            <div>
              <p className="text-[12px] font-bold text-[#555] uppercase tracking-widest mb-3">
                {pack.name}
              </p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[48px] font-black tracking-tight leading-none">
                  {pack.price}
                </span>
              </div>
              <p className="text-[#555] text-[12px]">
                {pack.reviews} reviews · {pack.perReview} per review
              </p>
              <p className="text-[#666] text-[13px] mt-3">{pack.description}</p>
            </div>

            <a
              href={pack.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3 rounded-md text-[13px] font-bold text-center transition-colors ${
                pack.highlight
                  ? "bg-white text-black hover:bg-[#e4e4e7]"
                  : "bg-[#1a1a1a] text-white hover:bg-[#222] border border-[#2a2a2a]"
              }`}
            >
              Get {pack.reviews} reviews →
            </a>

            <div className="space-y-3">
              {pack.features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <span className="text-[#22c55e] text-[12px]">✓</span>
                  <span className="text-[13px] text-[#777]">{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="border-t border-[#1a1a1a] px-8 py-20 max-w-2xl mx-auto w-full">
        <p className="text-[11px] font-bold text-[#333] uppercase tracking-widest mb-10 text-center">
          Common questions
        </p>
        <div className="space-y-8">
          {[
            {
              q: "Do credits expire?",
              a: "No. Buy a pack and use it whenever you need it. No pressure.",
            },
            {
              q: "What languages are supported?",
              a: "Python, TypeScript, JavaScript, Java, and Go. More coming.",
            },
            {
              q: "Can I get a refund?",
              a: "If you haven't used any credits, yes. Email us.",
            },
            {
              q: "Is this useful for senior roles?",
              a: "Especially for senior roles. Code review is a core interview round at most companies hiring above mid-level.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-[#1a1a1a] pb-8">
              <p className="text-[14px] font-semibold text-white mb-2">{q}</p>
              <p className="text-[13px] text-[#555] leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-[#1a1a1a] px-8 py-6 flex items-center justify-between">
        <span className="text-[22px] font-black tracking-tight text-[#222]">
          ReviewIQ
        </span>
        <span className="text-[12px] text-[#333]">© 2026 ReviewIQ</span>
      </div>
    </main>
  );
}
