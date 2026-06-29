import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      {/* NAV */}
      <nav className="px-8 h-16 flex items-center justify-between sticky top-0 z-10 bg-[#0f0f0f]/80 backdrop-blur-sm border-b border-[#1f1f1f]">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-[18px] font-black tracking-[-0.5px] text-white"
          >
            Review<span className="text-indigo-400">IQ</span>
          </Link>
          <div className="flex items-center gap-1">
            {[{ label: "Pricing", href: "/pricing" }].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[13px] font-semibold text-[#777] hover:text-white cursor-pointer transition-colors px-3 py-1.5 rounded-md hover:bg-[#1a1a1a]"
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

      {/* HERO */}
      <div className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-40 overflow-hidden">
        {/* Gradient orb top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at center, #6366f1 0%, transparent 70%)",
          }}
        />
        {/* Gradient orb bottom left */}
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(ellipse at center, #22c55e 0%, transparent 70%)",
          }}
        />
        {/* Gradient orb bottom right */}
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(ellipse at center, #6366f1 0%, transparent 70%)",
          }}
        />

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 border border-[#2a2a2a] bg-[#141414] rounded-full px-4 py-1.5 text-[12px] text-[#777] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            Now in beta · Free to start
          </div>

          <h1
            className="text-[64px] font-black tracking-tight leading-[1.05] mb-6 max-w-3xl"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #888888 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Practice code review.
            <br />
            Get hired faster.
          </h1>

          <p className="text-[#666] text-[16px] max-w-md mb-10 leading-relaxed">
            Real PR-style diffs with bugs planted by AI. Write your review. Get
            graded against ground truth. See exactly what you missed.
          </p>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="bg-white text-black font-bold px-7 py-3 rounded-md hover:bg-[#e4e4e7] transition-colors text-[14px] tracking-tight"
            >
              Start reviewing free
            </Link>
            <Link
              href="#how"
              className="text-[#666] hover:text-white text-[14px] font-semibold transition-colors px-4 py-3"
            >
              See how it works →
            </Link>
          </div>

          {/* Social proof */}
          <p className="text-[#333] text-[12px] mt-8">
            Built for engineers prepping for senior roles
          </p>
        </div>
      </div>

      {/* FAKE PRODUCT SCREENSHOT */}
      <div className="relative px-8 pb-24 flex justify-center">
        <div className="relative w-full max-w-4xl">
          {/* Glow under screenshot */}
          <div
            className="absolute -inset-4 rounded-2xl opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at center, #6366f1 0%, transparent 60%)",
              filter: "blur(40px)",
            }}
          />
          <div className="relative border border-[#222] rounded-xl overflow-hidden bg-[#0a0a0a]">
            {/* Fake browser bar */}
            <div className="border-b border-[#1f1f1f] px-4 py-3 flex items-center gap-2 bg-[#111]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-4 py-1 text-[11px] text-[#444] w-48 text-center">
                  reviewiq.dev/review
                </div>
              </div>
            </div>
            {/* Fake app UI */}
            <div className="grid grid-cols-[180px_1fr_320px] h-64">
              {/* Sidebar */}
              <div className="border-r border-[#1f1f1f] p-4 space-y-3">
                <div className="text-[9px] text-[#333] uppercase tracking-widest font-bold">
                  Configuration
                </div>
                {["Role", "Language", "Seniority"].map((l) => (
                  <div key={l}>
                    <div className="text-[9px] text-[#444] mb-1">{l}</div>
                    <div className="bg-[#141414] border border-[#222] rounded px-2 py-1.5 text-[10px] text-[#666]">
                      {l === "Role"
                        ? "Backend Engineer"
                        : l === "Language"
                          ? "Python"
                          : "Mid-level"}
                    </div>
                  </div>
                ))}
                <div className="bg-white rounded px-2 py-1.5 text-[10px] text-black font-bold text-center">
                  Generate PR →
                </div>
              </div>
              {/* Code panel */}
              <div className="border-r border-[#1f1f1f] p-4 bg-[#080808] font-mono text-[10px]">
                <div className="text-[9px] text-[#333] uppercase tracking-widest mb-3">
                  Code Snippet
                </div>
                {[
                  { n: 1, code: "class UserManager:", color: "#818cf8" },
                  { n: 2, code: "  def __init__(self):", color: "#d4d4d8" },
                  { n: 3, code: "    self.users = []", color: "#d4d4d8" },
                  { n: 4, code: "", color: "#d4d4d8" },
                  {
                    n: 5,
                    code: "  def add_user(self, email):",
                    color: "#d4d4d8",
                  },
                  {
                    n: 6,
                    code: "    if self._find(email):",
                    color: "#ef4444",
                    bug: true,
                  },
                  {
                    n: 7,
                    code: '      raise ValueError("exists")',
                    color: "#d4d4d8",
                  },
                  {
                    n: 8,
                    code: "    self.users.append(email)",
                    color: "#d4d4d8",
                  },
                ].map(({ n, code, color, bug }) => (
                  <div
                    key={n}
                    className={`flex gap-3 px-1 rounded ${bug ? "bg-[#1a0808]" : ""}`}
                  >
                    <span className="text-[#2a2a2a] w-4 text-right flex-shrink-0">
                      {n}
                    </span>
                    <span style={{ color }}>{code}</span>
                    {bug && (
                      <span className="text-[#ef4444] text-[8px] ml-auto self-center border border-[#7f1d1d] px-1 rounded">
                        ⚠ Bug
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {/* Result panel */}
              <div className="p-4 space-y-3">
                <div className="text-[9px] text-[#333] uppercase tracking-widest">
                  Result
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[36px] font-black text-white leading-none">
                    7
                  </span>
                  <span className="text-[14px] text-[#333]">/10</span>
                </div>
                <div className="h-[2px] bg-[#1f1f1f] rounded-full">
                  <div className="h-full bg-white rounded-full w-[70%]" />
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="bg-[#052e16] border border-[#14532d] rounded p-2 flex gap-2">
                    <span className="text-[#4ade80] text-[9px] font-bold">
                      ✓
                    </span>
                    <span className="text-[9px] text-[#aaa]">
                      Caught: inconsistent API interface
                    </span>
                  </div>
                  <div className="bg-[#130f0e] border border-[#2a1f1a] rounded p-2 flex gap-2">
                    <span className="text-[#a16040] text-[9px] font-bold">
                      ✗
                    </span>
                    <span className="text-[9px] text-[#666]">
                      Missed: duplicate username allowed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" className="border-t border-[#1a1a1a] px-8 py-24 relative">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-[11px] font-bold text-[#333] uppercase tracking-widest mb-12 text-center">
            How it works
          </p>
          <div className="grid grid-cols-3 gap-12">
            {[
              {
                n: "01",
                title: "Pick your setup",
                body: "Choose role, language, and seniority. We generate a realistic PR diff with bugs planted by AI, different every time.",
              },
              {
                n: "02",
                title: "Write your review",
                body: "Treat it like a real PR. Catch bugs, explain what's wrong, suggest fixes. Write like a senior engineer.",
              },
              {
                n: "03",
                title: "See your gaps",
                body: "AI grades against the known bug list. See exactly what you caught, what you missed, and how to write a stronger review.",
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex flex-col gap-3">
                <span className="text-[11px] font-mono text-[#333]">{n}</span>
                <h3 className="text-[14px] font-bold text-white">{title}</h3>
                <p className="text-[13px] text-[#555] leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA STRIP */}
      <div className="border-t border-[#1a1a1a] px-8 py-20 flex flex-col items-center text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background:
              "radial-gradient(ellipse at center, #6366f1 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <h2
            className="text-[36px] font-black tracking-tight mb-4"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #888 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Ready to level up your reviews?
          </h2>
          <p className="text-[#555] text-[14px] mb-8">
            Start free. No card required. One review on us.
          </p>
          <Link
            href="/login"
            className="bg-white text-black font-bold px-8 py-3 rounded-md hover:bg-[#e4e4e7] transition-colors text-[14px] tracking-tight"
          >
            Get started free
          </Link>
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
