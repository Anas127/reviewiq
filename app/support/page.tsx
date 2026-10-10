import Link from "next/link";

export const metadata = { title: "Support | ReviewIQ" };

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#101418] px-5 py-10 text-[#e8ecee] sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-xl font-extrabold tracking-tight">Review<span className="text-[#ff806a]">IQ</span></Link>
        <h1 className="mt-12 text-4xl font-semibold tracking-tight">Support</h1>
        <p className="mt-6 text-sm leading-7 text-[#bcc6cb]">For account access, credits, review feedback, billing, or the ChatGPT connection, email <a className="text-[#ff9a87] underline" href="mailto:reviewiq.team@outlook.com">reviewiq.team@outlook.com</a>. Include a short description of the problem and the email address on your ReviewIQ account. Please do not send your password, access tokens, or payment card information.</p>
        <Link href="/" className="mt-10 inline-block text-sm text-[#ff9a87] hover:underline">← Back to ReviewIQ</Link>
      </div>
    </main>
  );
}
