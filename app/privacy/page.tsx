import Link from "next/link";

export const metadata = { title: "Privacy Policy | ReviewIQ" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#101418] px-5 py-10 text-[#e8ecee] sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-xl font-extrabold tracking-tight">Review<span className="text-[#ff806a]">IQ</span></Link>
        <h1 className="mt-12 text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-[#9eabb2]">Effective October 10, 2026</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-[#bcc6cb]">
          <section><h2 className="mb-2 text-lg font-semibold text-white">What we collect</h2><p>When you create an account, we receive your email address and authentication information through Supabase. If you choose Google sign-in, Google shares your basic profile and email with Supabase for authentication. We store your credit balance, generated exercises, submitted code reviews, scores, and feedback. When you use ReviewIQ in ChatGPT as a guest, we receive a ChatGPT user identifier, hash it with a server secret, and store only the hash with a guest review count and grading results. We also process the exercise settings and review text you submit. If you connect your ReviewIQ account in ChatGPT, we use your authorization to access your ReviewIQ account and review history.</p></section>
          <section><h2 className="mb-2 text-lg font-semibold text-white">How we use it</h2><p>We use this information to generate exercises, grade your findings, show feedback, maintain your review history and credit balance, enforce the two guest review limit, protect the service from abuse, and operate the product. Exercise code and review text are sent to OpenAI for generation and grading. When you use the ChatGPT connection, exercises, credit status, and feedback returned by ReviewIQ are also visible in that ChatGPT conversation. Supabase provides authentication and database hosting. We use PostHog for product analytics. Gumroad processes subscriptions and sends us payment information needed to grant credits; ReviewIQ does not collect your payment card details.</p></section>
          <section><h2 className="mb-2 text-lg font-semibold text-white">Retention and control</h2><p>Account reviews and balances remain while your account is active. Guest quota records and feedback remain so we can enforce the guest limit and replay a completed result. You can disconnect the ChatGPT connection in ChatGPT. For access, correction, or deletion requests, email us at <a className="text-[#ff9a87] underline" href="mailto:reviewiq.team@outlook.com">reviewiq.team@outlook.com</a>. We will assess deletion requests, including records needed for security, fraud prevention, or legal obligations.</p></section>
          <section><h2 className="mb-2 text-lg font-semibold text-white">Contact</h2><p>For privacy or support questions, contact <a className="text-[#ff9a87] underline" href="mailto:reviewiq.team@outlook.com">reviewiq.team@outlook.com</a>.</p></section>
        </div>
        <Link href="/" className="mt-12 inline-block text-sm text-[#ff9a87] hover:underline">← Back to ReviewIQ</Link>
      </div>
    </main>
  );
}
