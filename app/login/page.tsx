"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isSignUp = searchParams.get("mode") === "signup";

  function switchMode(signUp: boolean) {
    setError("");
    setMessage("");
    router.push(signUp ? "/login?mode=signup" : "/login");
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setMessage("Account created. Signing you in...");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push("/review");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/review");
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
          {isSignUp ? "Already have an account?" : "New to ReviewIQ?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(!isSignUp)}
            className="text-[#ff9a87] hover:text-white transition-colors"
          >
            {isSignUp ? "Sign in" : "Create an account"}
          </button>
        </span>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] space-y-6 rounded-xl border border-[#ffffff17] bg-[#151b20] p-7 shadow-2xl sm:p-9">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff927e]">
              REVIEWIQ ACCOUNT
            </p>

            <h1 className="text-[27px] font-semibold text-white tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>

            <p className="text-[13px] leading-6 text-[#9ba6ad] mt-2">
              {isSignUp ? (
                <>
                  Start with 5 free code reviews.
                  <br />
                  No credit card required.
                </>
              ) : (
                "Sign in to continue reviewing."
              )}
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#101519] border border-[#ffffff20] rounded-md px-4 py-3 text-[13px] text-white placeholder-[#738089] focus:outline-none focus:border-[#ff806a] transition-colors"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading && email && password) {
                  handleSubmit();
                }
              }}
              className="w-full bg-[#101519] border border-[#ffffff20] rounded-md px-4 py-3 text-[13px] text-white placeholder-[#738089] focus:outline-none focus:border-[#ff806a] transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-[12px]">{error}</p>}

          {message && <p className="text-green-400 text-[12px]">{message}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full bg-[#ff806a] text-[#201715] font-bold py-3 rounded-md text-[13px] hover:bg-[#ff9a87] transition-colors disabled:opacity-40 tracking-tight"
          >
            {loading ? "..." : isSignUp ? "Create account" : "Sign in"}
          </button>

          <p className="border-t border-[#ffffff12] pt-5 text-center text-[12px] text-[#98a3aa]">
            {isSignUp ? "Already have an account?" : "New to ReviewIQ?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(!isSignUp)}
              className="font-medium text-[#ff9a87] transition-colors hover:text-white"
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
