"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FREE_REVIEW_CREDITS } from "@/lib/credit-config";
import { captureProductEvent, captureProductEventOncePerSession, identifyProductUser, markSignupIntent } from "@/lib/analytics";

export default function LoginForm({ initialMode, returnTo, authError = false }: { initialMode: "signup" | "signin" | "reset"; returnTo?: string; authError?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(authError ? "Sign-in could not finish. Please try again." : "");
  const [message, setMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [isReset, setIsReset] = useState(initialMode === "reset");
  const [isForgot, setIsForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const signupViewTracked = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    if (!isSignUp || signupViewTracked.current) return;
    signupViewTracked.current = true;
    captureProductEventOncePerSession("signup-viewed", "signup_viewed");
  }, [isSignUp]);

  function switchMode(signUp: boolean) {
    setError(""); setMessage(""); setIsReset(false); setIsForgot(false); setIsSignUp(signUp);
    const path = signUp ? "/login?mode=signup" : "/login";
    window.history.replaceState(null, "", returnTo ? `${path}${signUp ? "&" : "?"}redirect=${encodeURIComponent(returnTo)}` : path);
  }

  function markSignupStarted() {
    if (isSignUp) {
      markSignupIntent();
      captureProductEventOncePerSession("signup-started", "signup_started");
    }
  }

  async function continueWithGoogle() {
    markSignupStarted();
    setLoading(true); setError(""); setMessage("");
    const next = returnTo || "/review";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (googleError) {
      setError(googleError.message);
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(""); setMessage("");
    if (isForgot) {
      await sendPasswordReset();
      return;
    }
    if (isReset) {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(updateError.message); setLoading(false); return; }
      setMessage("Password updated. You can continue to your reviews.");
      setLoading(false); setIsReset(false); setPassword("");
      window.history.replaceState(null, "", "/login");
      return;
    }
    if (isSignUp) {
      markSignupStarted();
      const emailRedirectTo = returnTo
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`
        : undefined;
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo } });
      if (signUpError) { setError(signUpError.message); setLoading(false); return; }
      if (!data.session) {
        setMessage("Your account is ready. Check your email to confirm it, then sign in to start your first review.");
        setLoading(false); setIsSignUp(false);
        window.history.replaceState(null, "", returnTo ? `/login?redirect=${encodeURIComponent(returnTo)}` : "/login");
        return;
      }
      if (data.user) identifyProductUser(data.user.id, data.user.created_at);
      router.push(returnTo || "/review");
      return;
    }
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError(signInError.message); setLoading(false); return; }
    if (data.user) identifyProductUser(data.user.id, data.user.created_at);
    captureProductEvent("signin_completed");
    router.push(returnTo || "/review");
  }

  async function sendPasswordReset() {
    setLoading(true); setError(""); setMessage("");
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/login?mode=reset")}`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (resetError) setError(resetError.message);
    else setMessage("If an account exists for that email, a password reset link is on its way.");
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#101418] text-[#f4f5f6]">
      <nav className="flex h-[76px] items-center justify-between border-b border-[#ffffff14] px-6 sm:px-10">
        <Link href="/" className="text-[21px] font-extrabold tracking-[-1.2px] text-white">Review<span className="text-[#ff765f]">IQ</span></Link>
        {!isReset && !isForgot && <span className="text-[12px] text-[#aab4ba]">{isSignUp ? "Already have an account?" : "New to ReviewIQ?"} <button type="button" onClick={() => switchMode(!isSignUp)} className="ml-1 text-[#ff9a87] hover:text-white">{isSignUp ? "Sign in" : "Create an account"}</button></span>}
      </nav>
      <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-4 py-12 lg:grid-cols-[1fr_.85fr] lg:px-8">
        <section className="mx-auto w-full max-w-[480px] rounded-xl border border-[#ffffff20] bg-[#151b20] p-6 shadow-2xl sm:p-9">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff927e]">{isReset || isForgot ? "ACCOUNT RECOVERY" : isSignUp ? "YOUR FIRST REVIEW" : "REVIEWIQ ACCOUNT"}</p>
          <h1 className="text-[29px] font-semibold tracking-tight text-white">{isReset ? "Choose a new password" : isForgot ? "Reset your password" : isSignUp ? "Start your first review" : "Welcome back"}</h1>
          <p className="mt-2 text-[13px] leading-6 text-[#b2bbc1]">{isReset ? "Set a new password to get back to your review practice." : isForgot ? "Enter the email for your account and we’ll send a reset link." : isSignUp ? <>Create your account to save your results. Get {FREE_REVIEW_CREDITS} free reviews. No card required.</> : "Sign in to continue reviewing."}</p>
          {!isReset && !isForgot && <>
            <button type="button" onClick={continueWithGoogle} disabled={loading} className="mt-7 flex w-full items-center justify-center gap-3 rounded-md border border-[#ffffff30] bg-[#f5f7f8] px-4 py-3 text-[13px] font-semibold text-[#20272b] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a87] disabled:cursor-wait disabled:opacity-50">
              <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6.1C12.2 13.8 17.7 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.9 24.5c0-1.6-.2-3.1-.4-4.5H24v9h12.8c-.6 3-2.3 5.6-4.9 7.3l7.7 6C44.1 38.1 46.9 31.9 46.9 24.5Z"/><path fill="#FBBC05" d="M10.4 28.6a14.4 14.4 0 0 1 0-9.2l-7.8-6.1a24 24 0 0 0 0 21.4l7.8-6.1Z"/><path fill="#34A853" d="M24 48c6.2 0 11.5-2.1 15.3-5.7l-7.7-6c-2.1 1.4-4.7 2.2-7.6 2.2-6.3 0-11.8-4.3-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48Z"/></svg>
              Continue with Google
            </button>
            <div className="mt-5 flex items-center gap-3 text-[11px] text-[#849098]"><span className="h-px flex-1 bg-[#ffffff20]"/><span>or use email</span><span className="h-px flex-1 bg-[#ffffff20]"/></div>
          </>}
          <form onSubmit={handleSubmit} className={`${isReset || isForgot ? "mt-7" : "mt-5"} space-y-4`}>
            {!isReset && <div><label htmlFor="email" className="mb-1.5 block text-[12px] font-medium text-[#d0d6da]">Email address</label><input id="email" type="email" required value={email} autoComplete="email" onChange={(e) => { setEmail(e.target.value); markSignupStarted(); }} className="w-full rounded-md border border-[#ffffff25] bg-[#101519] px-4 py-3 text-[14px] text-white outline-none placeholder:text-[#849098] focus:border-[#ff806a] focus-visible:ring-2 focus-visible:ring-[#ff806a]/40" placeholder="you@example.com" /></div>}
            {!isReset && !isForgot && <div><div className="mb-1.5 flex items-center justify-between"><label htmlFor="password" className="text-[12px] font-medium text-[#d0d6da]">Password</label>{!isSignUp && <button type="button" onClick={() => {setError("");setMessage("");setIsForgot(true);}} className="text-[11px] text-[#ff9a87] hover:text-white">Forgot password?</button>}</div><div className="flex rounded-md border border-[#ffffff25] bg-[#101519] focus-within:border-[#ff806a] focus-within:ring-2 focus-within:ring-[#ff806a]/30"><input id="password" type={showPassword ? "text" : "password"} required value={password} autoComplete={isSignUp ? "new-password" : "current-password"} onChange={(e) => { setPassword(e.target.value); markSignupStarted(); }} className="min-w-0 flex-1 rounded-md bg-transparent px-4 py-3 text-[14px] text-white outline-none placeholder:text-[#849098]" placeholder={isSignUp ? "Create a password" : "Your password"} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="px-3 text-[11px] text-[#aab4ba] hover:text-white">{showPassword ? "Hide" : "Show"}</button></div></div>}
            {isReset && <div><label htmlFor="new-password" className="mb-1.5 block text-[12px] font-medium text-[#d0d6da]">New password</label><input id="new-password" type={showPassword ? "text" : "password"} required minLength={8} value={password} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-[#ffffff25] bg-[#101519] px-4 py-3 text-[14px] text-white outline-none focus:border-[#ff806a] focus-visible:ring-2 focus-visible:ring-[#ff806a]/40" /></div>}
            {error && <p role="alert" className="text-[12px] leading-5 text-[#ff9a86]">{error}</p>}
            {message && <p role="status" className="text-[12px] leading-5 text-[#a9dfbc]">{message}</p>}
            {!isReset && isSignUp && <p className="text-[11px] leading-5 text-[#9ba6ad]">Your first review can start as soon as your account is ready.</p>}
            <button type="submit" disabled={loading || (isReset && !password) || (isForgot && !email) || (!isReset && !isForgot && (!email || !password))} className="w-full rounded-md bg-[#ff806a] py-3.5 text-[13px] font-bold tracking-tight text-[#201715] transition-colors hover:bg-[#ff9a87] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9a87] disabled:cursor-wait disabled:opacity-50">{loading ? "Please wait…" : isReset ? "Update password" : isForgot ? "Send reset link" : isSignUp ? "Start my first review" : "Sign in"}</button>
            {(isReset || isForgot) && <button type="button" onClick={() => {setIsReset(false);setIsForgot(false);setPassword("");setError("");setMessage("");window.history.replaceState(null,"","/login");}} className="w-full py-2 text-[12px] text-[#aab4ba] hover:text-white">Back to sign in</button>}
          </form>
        </section>
        <aside className="hidden rounded-xl border border-[#ffffff16] bg-[#13191e] p-7 lg:block"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#ff927e]">Your first challenge</p><h2 className="mt-3 text-[22px] font-semibold">A realistic review, matched to you.</h2><div className="mt-6 rounded-lg border border-[#ffffff14] bg-[#101519] p-4"><div className="flex items-center justify-between gap-3"><span className="text-[12px] font-semibold">Backend Engineer</span><span className="text-[11px] text-[#aab4ba]">Python</span></div><p className="mt-2 text-[11px] text-[#909ca3]">Mid-level · 3 planted issues</p><div className="mt-5 flex items-center gap-2 text-[11px] text-[#c9d0d4]"><span>Read the PR</span><span className="text-[#ff806a]">→</span><span>Write your review</span><span className="text-[#ff806a]">→</span><span>See what you missed</span></div></div><p className="mt-5 text-[12px] leading-6 text-[#aab4ba]">No setup tour. Choose your context, review the change, and get actionable feedback on what you caught and missed.</p></aside>
      </div>
    </main>
  );
}
