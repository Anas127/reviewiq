import Link from "next/link";

const steps = [
  [
    "01",
    "Read the change",
    "Work through a realistic pull request written for your role and experience level.",
  ],
  [
    "02",
    "Write your review",
    "Call out concrete risks, explain the impact, and suggest a fix.",
  ],
  [
    "03",
    "Learn from the result",
    "Compare your review with the planted issues and get focused interviewer feedback.",
  ],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#101418] text-[#f4f5f6]">
      <nav className="relative z-10 mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link href="/" className="text-[21px] font-extrabold tracking-[-1.2px]">
          Review<span className="text-[#ff806a]">IQ</span>
        </Link>
        <div className="flex items-center gap-7 text-[13px] font-medium text-[#aab2b8]">
          <Link className="transition hover:text-white" href="#method">
            Method
          </Link>
          <Link className="transition hover:text-white" href="/pricing">
            Pricing
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-[13px] font-medium text-[#aab2b8] hover:text-white sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-[#ff806a] px-4 py-2.5 text-[12px] font-bold text-[#1d1715] transition hover:bg-[#ff9a87]"
          >
            Start practicing <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </nav>
      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:pb-32 lg:pt-20">
        <div className="pointer-events-none absolute -left-40 top-0 h-[460px] w-[460px] rounded-full bg-[#bd563e]/10 blur-[120px]" />
        <div className="relative z-[1]">
          <p className="mb-7 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.24em] text-[#ff9a87]">
            <span className="h-px w-8 bg-[#ff806a]" /> Deliberate practice for
            code review
          </p>
          <h1 className="max-w-[620px] text-[48px] font-semibold leading-[1.04] tracking-[-2.6px] sm:text-[64px] lg:text-[70px]">
            Think like the reviewer{" "}
            <span className="font-serif italic font-normal text-[#ff806a]">
              they hire.
            </span>
          </h1>
          <p className="mt-7 max-w-[490px] text-[15px] leading-7 text-[#a7b0b6]">
            Practice on realistic pull requests, catch the issues that matter,
            and get precise feedback on every review.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link
              href="/login?mode=signup"
              className="rounded-md bg-[#ff806a] px-5 py-3 text-[13px] font-bold text-[#1d1715] transition hover:bg-[#ff9a87]"
            >
              Start with 5 free reviews <span className="ml-3">↗</span>
            </Link>
            <Link
              href="#method"
              className="text-[13px] font-semibold text-[#c4c9cd] hover:text-white"
            >
              See the practice flow{" "}
              <span className="ml-1 text-[#ff806a]">↓</span>
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-5 border-t border-[#ffffff14] pt-5 text-[11px] text-[#929ca3]">
            <span>
              <b className="mr-2 text-[#e3e6e8]">5</b> free reviews
            </span>
            <span className="h-3 w-px bg-[#384047]" />
            <span>No card required</span>
            <span className="h-3 w-px bg-[#384047]" />
            <span>Built for engineers</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[650px] lg:ml-auto">
          <div className="absolute -inset-7 rounded-3xl bg-[#cf6348]/[.08] blur-3xl" />
          <div className="relative overflow-hidden rounded-xl border border-[#ffffff1a] bg-[#151b20] shadow-[0_34px_100px_-38px_#000]">
            <div className="flex h-12 items-center justify-between border-b border-[#ffffff12] bg-[#171e23] px-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff806a]" />
                <span className="text-[10px] font-semibold tracking-wide text-[#bbc2c7]">
                  PRACTICE SESSION
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#75818a]">
                REVIEW-014
              </span>
            </div>
            <div className="grid min-h-[345px] md:grid-cols-[1.05fr_.95fr]">
              <div className="border-b border-[#ffffff12] p-5 md:border-b-0 md:border-r">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-[#849099]">
                      Pull request · user service
                    </p>
                    <p className="mt-1 text-[14px] font-semibold">
                      Add account lookup
                    </p>
                  </div>
                  <span className="rounded border border-[#ff806a33] bg-[#ff806a0d] px-2 py-1 text-[9px] font-semibold text-[#ff9a87]">
                    3 issues planted
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[10px] leading-5 sm:text-[11px]">
                  <p className="text-[#7e8991]">{"  def find_user(email):"}</p>
                  <p className="rounded bg-[#d9664b14] px-2 text-[#d2a197]">
                    {"-   return users[email.lower()]"}
                  </p>
                  <p className="rounded bg-[#72bd8b12] px-2 text-[#9fc4aa]">
                    {"+   user = users.get(email)"}
                  </p>
                  <p className="rounded bg-[#72bd8b12] px-2 text-[#9fc4aa]">
                    {"+   return user"}
                  </p>
                  <p className="mt-5 text-[#78848d]">
                    {"  def deactivate_user(user):"}
                  </p>
                  <p className="rounded bg-[#d9664b14] px-2 text-[#d2a197]">
                    {"-   user.active = False"}
                  </p>
                  <p className="text-[#78848d]">{"  # ... more changes"}</p>
                </div>
              </div>
              <div className="flex flex-col p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-[#e1e5e7]">
                    Your review
                  </p>
                  <span className="text-[10px] text-[#75818a]">Draft</span>
                </div>
                <div className="flex-1 rounded-md border border-[#ffffff12] bg-[#101519] p-3 text-[11px] leading-5 text-[#9fa9af]">
                  The lookup now uses the original email string, so addresses
                  with different casing can fail to match. Normalize the key
                  before calling get…
                  <span className="animate-pulse text-[#ff806a]">|</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] text-[#738089]">
                    Practice credit · 1
                  </span>
                  <span className="rounded bg-[#ff806a] px-3 py-2 text-[10px] font-bold text-[#1d1715]">
                    Submit review ↗
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#ffffff12] px-5 py-3 text-[9px] text-[#748089]">
              <span>
                Backend Engineer <span className="mx-2 text-[#3f494f]">/</span>{" "}
                Python <span className="mx-2 text-[#3f494f]">/</span> Senior
              </span>
              <span className="tracking-[.16em]">REVIEWIQ · PRACTICE</span>
            </div>
          </div>
          <div className="absolute -bottom-7 -left-5 hidden rounded-lg border border-[#ffffff17] bg-[#1b2227] px-4 py-3 shadow-2xl sm:block">
            <p className="text-[9px] uppercase tracking-[.16em] text-[#7f8a91]">
              Feedback
            </p>
            <p className="mt-1 text-[12px] font-semibold text-[#e4e8e9]">
              Specific. Actionable. Yours.
            </p>
          </div>
        </div>
      </section>
      <section
        id="method"
        className="border-t border-[#ffffff12] bg-[#13191e] px-6 py-20 lg:px-10 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#ff927e]">
                The practice loop
              </p>
              <h2 className="mt-3 text-[32px] font-semibold tracking-[-1.2px] sm:text-[40px]">
                Build judgment through repetition.
              </h2>
            </div>
            <p className="max-w-sm text-[13px] leading-6 text-[#929ca3]">
              Every session gives you a clear signal on what you noticed and
              where your review can get sharper.
            </p>
          </div>
          <div className="grid gap-8 border-t border-[#ffffff17] pt-7 sm:grid-cols-3 sm:gap-10">
            {steps.map(([number, title, body]) => (
              <article key={number}>
                <p className="font-mono text-[11px] text-[#ff927e]">{number}</p>
                <h3 className="mt-5 text-[16px] font-semibold">{title}</h3>
                <p className="mt-2 max-w-sm text-[12px] leading-6 text-[#929ca3]">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-6 py-20 sm:flex-row sm:items-center lg:px-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff927e]">
            Your next review starts here
          </p>
          <h2 className="mt-3 text-[30px] font-semibold tracking-[-1px]">
            Make your instincts interview ready.
          </h2>
        </div>
        <Link
          href="/pricing"
          className="rounded-md border border-[#ffffff2a] px-5 py-3 text-[12px] font-semibold transition hover:border-[#ff806a] hover:text-[#ff9a87]"
        >
          Explore ReviewIQ Pro <span className="ml-3">↗</span>
        </Link>
      </section>
      <footer className="flex items-center justify-between border-t border-[#ffffff12] px-6 py-6 text-[11px] text-[#76818a] lg:px-10">
        <Link
          href="/"
          className="font-extrabold tracking-[-.7px] text-[#d8dcde]"
        >
          Review<span className="text-[#ff806a]">IQ</span>
        </Link>
        <span>Practice with intention. Review with confidence.</span>
        <span>© 2026 ReviewIQ</span>
      </footer>
    </main>
  );
}
