import Link from "next/link";
import { GUEST_EXERCISE } from "@/lib/guest/exercise";
import TryExercise from "@/app/try/TryExercise";

export default async function TryPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const params = await searchParams;
  const placement = typeof params.from === "string" && /^[a-z_]{1,30}$/.test(params.from) ? params.from : "direct";
  return <main className="min-h-screen bg-[#101418] text-[#f4f5f6]">
    <nav className="mx-auto flex min-h-[4.75rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
      <Link href="/" className="text-xl font-extrabold tracking-[-0.06em]">Review<span className="text-[#ff806a]">IQ</span></Link>
      <Link href="/login" className="text-sm text-[#c6cfd3] hover:text-white focus-visible:outline-2 focus-visible:outline-[#ff9a87]">Sign in</Link>
    </nav>
    <TryExercise exercise={GUEST_EXERCISE} placement={placement} />
  </main>;
}
