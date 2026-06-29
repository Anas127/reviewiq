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
    <main className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <nav className="border-b border-[#252525] px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-[22px] font-black tracking-tight text-white"
        >
          ReviewIQ
        </Link>
        <span className="text-[12px] text-[#555]">
          {isSignUp ? "Already have an account?" : "No account yet?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#aaa] hover:text-white transition-colors"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </span>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-[20px] font-bold text-white tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-[13px] text-[#555] mt-1">
              {isSignUp
                ? "Start with 1 free review. No card required."
                : "Sign in to continue reviewing."}
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#141414] border border-[#2e2e2e] rounded-md px-4 py-3 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#555] transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-[#141414] border border-[#2e2e2e] rounded-md px-4 py-3 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#555] transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-[12px]">{error}</p>}
          {message && <p className="text-green-400 text-[12px]">{message}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full bg-white text-black font-bold py-3 rounded-md text-[13px] hover:bg-[#e4e4e7] transition-colors disabled:opacity-40 tracking-tight"
          >
            {loading ? "..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}
