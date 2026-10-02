import Link from "next/link";

const gumroadUrl = process.env.NEXT_PUBLIC_GUMROAD_URL;

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#101418] text-[#f4f5f6]">
      <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link href="/" className="text-[21px] font-extrabold tracking-[-1.2px]">
          Review<span className="text-[#ff806a]">IQ</span>
        </Link>
        <div className="flex items-center gap-7 text-[13px] font-medium text-[#aab2b8]">
          <Link href="/" className="hover:text-white">
            Product
          </Link>
          <Link href="/pricing" className="text-white">
            Pricing
          </Link>
        </div>
        <Link
          href="/login?mode=signup"
          className="rounded-md bg-[#ff806a] px-4 py-2.5 text-[12px] font-bold text-[#1d1715] transition hover:bg-[#ff9a87]"
        >
          Get started ↗
        </Link>
      </nav>
      <section className="px-6 pb-24 pt-16 lg:pt-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[.24em] text-[#ff927e]">
            Simple, useful pricing
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-center text-[42px] font-semibold leading-tight tracking-[-1.9px] sm:text-[56px]">
            Better reviews come from{" "}
            <span className="font-serif italic font-normal text-[#ff806a]">
              practice.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-center text-[14px] leading-7 text-[#9ca7ae]">
            Start free with 5 credits. Upgrade to ReviewIQ Pro for 10 new
            credits every month.
          </p>
          <div className="mx-auto mt-14 grid max-w-[800px] gap-5 md:grid-cols-2">
            <article className="flex flex-col rounded-xl border border-[#ffffff18] bg-[#151b20] p-7 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#a0abb2]">
                Free
              </p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-[46px] font-semibold tracking-[-2px]">
                  €0
                </span>
                <span className="text-[12px] text-[#829099]">to start</span>
              </div>
              <p className="mt-2 text-[12px] leading-6 text-[#9ca7ae]">
                A proper start for getting familiar with code review interviews.
              </p>
              <Link
                href="/login?mode=signup"
                className="mt-7 rounded-md border border-[#ffffff2d] py-3 text-center text-[12px] font-semibold transition hover:border-[#ff806a] hover:text-[#ff9a87]"
              >
                Create a free account
              </Link>
              <ul className="mt-8 space-y-4 border-t border-[#ffffff14] pt-6 text-[12px] text-[#c1c8cc]">
                {[
                  "5 review credits when you join",
                  "Realistic, AI-generated pull requests",
                  "Detailed review feedback",
                  "Credits only used after successful grading",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[#ff927e]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
            <article className="relative flex flex-col rounded-xl border border-[#ff806a66] bg-[#191e22] p-7 shadow-[0_24px_80px_-44px_#ff806a80] sm:p-8">
              <div className="absolute -top-3 right-7 rounded bg-[#ff806a] px-3 py-1 text-[9px] font-bold uppercase tracking-[.15em] text-[#201715]">
                For consistent practice
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff9a87]">
                ReviewIQ Pro
              </p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-[46px] font-semibold tracking-[-2px]">
                  €8.99
                </span>
                <span className="text-[12px] text-[#829099]">/ month</span>
              </div>
              <p className="mt-2 text-[12px] leading-6 text-[#aab3b9]">
                Keep a steady rhythm and build a deeper review history.
              </p>
              {gumroadUrl ? (
                <a
                  href={gumroadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 rounded-md bg-[#ff806a] py-3 text-center text-[12px] font-bold text-[#201715] transition hover:bg-[#ff9a87]"
                >
                  Get ReviewIQ Pro <span className="ml-2">↗</span>
                </a>
              ) : (
                <Link
                  href="/login"
                  className="mt-7 rounded-md bg-[#ff806a] py-3 text-center text-[12px] font-bold text-[#201715] transition hover:bg-[#ff9a87]"
                >
                  Sign in to upgrade <span className="ml-2">↗</span>
                </Link>
              )}
              <ul className="mt-8 space-y-4 border-t border-[#ffffff14] pt-6 text-[12px] text-[#d1d5d8]">
                {[
                  "10 credits added each billing cycle",
                  "Unused credits roll over",
                  "Cancel anytime; keep credits already earned",
                  "Full review history and all languages",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[#ff927e]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <p className="mx-auto mt-7 max-w-xl text-center text-[10px] leading-5 text-[#77838a]">
            Payment is securely handled by Gumroad. Your balance only changes
            after a review is graded successfully.
          </p>
        </div>
      </section>
      <footer className="border-t border-[#ffffff12] px-6 py-6 text-center text-[10px] text-[#76818a]">
        Review<span className="font-bold text-[#d8dcde]">IQ</span> · Practice
        with intention. Review with confidence.
      </footer>
    </main>
  );
}
