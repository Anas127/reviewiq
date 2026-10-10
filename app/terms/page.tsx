import Link from "next/link";

export const metadata = { title: "Terms of Service | ReviewIQ" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#101418] px-5 py-10 text-[#e8ecee] sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-xl font-extrabold tracking-tight">Review<span className="text-[#ff806a]">IQ</span></Link>
        <h1 className="mt-12 text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-[#9eabb2]">Effective October 10, 2026</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-[#bcc6cb]">
          <section><h2 className="mb-2 text-lg font-semibold text-white">Using ReviewIQ</h2><p>ReviewIQ provides practice code review exercises and automated feedback. You may use the service for lawful learning and evaluation. Do not use it to abuse the service, interfere with other users, or submit private code or information you are not authorized to share. Keep your account credentials secure.</p></section>
          <section><h2 className="mb-2 text-lg font-semibold text-white">Credits and subscriptions</h2><p>New ReviewIQ accounts receive 5 free review credits. ReviewIQ Pro provides 30 credits for each successful $8.99 monthly billing cycle. Unused credits roll over. One credit is consumed only when a review is successfully graded and saved. The ChatGPT guest experience permits two completed reviews per ChatGPT account before you connect a ReviewIQ account. Gumroad handles subscription payments and cancellation. Cancelling stops future grants but does not remove credits you already received.</p></section>
          <section><h2 className="mb-2 text-lg font-semibold text-white">Feedback and availability</h2><p>Exercises and feedback are generated with AI and may contain mistakes. Use your own judgment before applying any advice to real software. We may change or interrupt the service for maintenance, security, or operational reasons.</p></section>
          <section><h2 className="mb-2 text-lg font-semibold text-white">Questions</h2><p>For support or questions about these terms, email <a className="text-[#ff9a87] underline" href="mailto:reviewiq.team@outlook.com">reviewiq.team@outlook.com</a>. See our <Link href="/privacy" className="text-[#ff9a87] underline">Privacy Policy</Link> for information about data handling.</p></section>
        </div>
        <Link href="/" className="mt-12 inline-block text-sm text-[#ff9a87] hover:underline">← Back to ReviewIQ</Link>
      </div>
    </main>
  );
}
