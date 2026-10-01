"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else {
        setMessage("Account created. Signing you in...");
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) setError(signInError.message);
        else router.push("/review");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else router.push("/review");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#101418] text-[#f4f5f6] flex flex-col">
      <nav className="border-b border-[#ffffff14] px-6 sm:px-10 h-[76px] flex items-center justify-between">
        <Link
          href="/"
          className="text-[21px] font-extrabold tracking-[-1.2px] text-white"
        >
          Review<span className="text-[#ff765f]">IQ</span>
        </Link>
        <span className="text-[12px] text-[#98a3aa]">
          {isSignUp ? "Already have an account?" : "No account yet?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#ff9a87] hover:text-white transition-colors"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </span>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] space-y-6 rounded-xl border border-[#ffffff17] bg-[#151b20] p-7 shadow-2xl sm:p-9">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff927e]">ReviewIQ account</p>
            <h1 className="text-[27px] font-semibold text-white tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-[13px] leading-6 text-[#9ba6ad] mt-2">
              {isSignUp
                ? "Start free with 5 review credits. No card required."
                : "Sign in to continue reviewing."}
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#101519] border border-[#ffffff20] rounded-md px-4 py-3 text-[13px] text-white placeholder-[#738089] focus:outline-none focus:border-[#ff806a] transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-[#101519] border border-[#ffffff20] rounded-md px-4 py-3 text-[13px] text-white placeholder-[#738089] focus:outline-none focus:border-[#ff806a] transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-[12px]">{error}</p>}
          {message && <p className="text-green-400 text-[12px]">{message}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full bg-[#ff806a] text-[#201715] font-bold py-3 rounded-md text-[13px] hover:bg-[#ff9a87] transition-colors disabled:opacity-40 tracking-tight"
          >
            {loading ? "..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}
