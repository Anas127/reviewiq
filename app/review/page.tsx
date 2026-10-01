"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { createClient } from "@/lib/supabase/client";

const ROLES = ["Backend Engineer", "Frontend Engineer", "Full Stack Engineer", "Data Engineer"];
const LANGUAGES = ["Python", "TypeScript", "JavaScript", "Java", "Go"];
const SENIORITIES = ["Junior", "Mid-level", "Senior"];

type Grade = {
  score: number;
  caught: {
    bug: number;
    reason: string;
  }[];
  missed: {
    bug: number;
    description: string;
    reason: string;
  }[];
  extraFindings: string[];
  feedback: string;
  bugs: { id: number; description: string }[];
};

export default function ReviewPage() {
  const [role, setRole] = useState(ROLES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [seniority, setSeniority] = useState(SENIORITIES[1]);
  const [code, setCode] = useState("");
  const [exerciseToken, setExerciseToken] = useState("");
  const [userReview, setUserReview] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState("");
  const [gradeError, setGradeError] = useState("");

  useEffect(() => {
    fetch("/api/credits").then((response) => response.json()).then((data) => setCredits(data.credits));
  }, [grade]);

  function handleUpgrade() {
    const url = process.env.NEXT_PUBLIC_GUMROAD_URL;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleGenerate() {
    setGenerating(true);
    setGrade(null);
    setUserReview("");
    setCode("");
    setExerciseToken("");
    setGenerateError("");
    setGradeError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, language, seniority }),
      });
      const data = await response.json();
      if (!response.ok) {
        setGenerateError(response.status === 402 ? "No credits left. Upgrade to ReviewIQ Pro to continue." : data.error ?? "Couldn't generate an exercise. Try again.");
        return;
      }
      setCode(data.code);
      setExerciseToken(data.exerciseToken);
    } catch {
      setGenerateError("Couldn't reach the server. Check your connection.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGrade() {
    if (!userReview.trim()) return;
    setGrading(true);
    setGradeError("");
    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseToken, userReview }),
      });
      const data = await response.json();
      if (!response.ok) {
        setGradeError(data.error ?? "Couldn't grade this review. Try again.");
        return;
      }
      setGrade(data);
    } catch {
      setGradeError("Couldn't reach the server. Check your connection.");
    } finally {
      setGrading(false);
    }
  }

  const syntaxLanguage = language.toLowerCase() === "typescript" ? "typescript" : language.toLowerCase() === "javascript" ? "javascript" : language.toLowerCase() === "java" ? "java" : language.toLowerCase() === "go" ? "go" : "python";

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#101418] text-[#f4f5f6] lg:h-screen lg:min-h-0">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[#273039] bg-[#0d1115] px-5 py-3 sm:px-7">
        <div className="flex items-center gap-7">
          <Link href="/" className="text-[21px] font-extrabold tracking-[-1.1px] text-[#f4f5f6]">Review<span className="text-[#ff765f]">IQ</span></Link>
          <div className="hidden h-6 w-px bg-[#303840] sm:block" />
          <nav aria-label="Main navigation" className="flex items-center gap-1">
            <Link href="/review" aria-current="page" className="rounded px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#20262b]">Practice</Link>
            <Link href="/history" className="rounded px-3 py-2 text-[13px] font-medium text-[#a4adb4] transition-colors hover:bg-[#20262b] hover:text-white">History</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 text-[12px] text-[#b8c0c6] sm:flex"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#ff765f]" />{credits === null ? "Loading credits" : `${credits} practice credit${credits === 1 ? "" : "s"} left`}</span>
          <button onClick={handleUpgrade} className="rounded-md border border-[#48515a] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:border-[#ff765f] hover:text-[#ff9a86]">Upgrade to Pro</button>
          <button onClick={async () => { const supabase = createClient(); await supabase.auth.signOut(); window.location.href = "/"; }} className="rounded-md px-2 py-2 text-[12px] font-medium text-[#9ba5ad] transition-colors hover:text-white">Sign out</button>
        </div>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-[#273039] bg-[#14191e] px-5 py-3 sm:px-7">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          {[
            { label: "Role", value: role, setter: setRole, options: ROLES },
            { label: "Language", value: language, setter: setLanguage, options: LANGUAGES },
            { label: "Seniority", value: seniority, setter: setSeniority, options: SENIORITIES },
          ].map(({ label, value, setter, options }) => (
            <label key={label} className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8d989f]">{label}</span>
              <select value={value} onChange={(event) => setter(event.target.value)} className="min-w-32 cursor-pointer rounded border border-[#343e47] bg-[#1a2025] px-2.5 py-1.5 text-[12px] text-[#e7eaec] outline-none transition-colors focus:border-[#ff765f]">{options.map((option) => <option key={option}>{option}</option>)}</select>
            </label>
          ))}
        </div>
        <button onClick={handleGenerate} disabled={generating} className="rounded-md bg-[#ff765f] px-4 py-2.5 text-[13px] font-bold text-[#171310] transition-colors hover:bg-[#ff927f] disabled:cursor-wait disabled:opacity-60">{generating ? "Generating exercise…" : code ? "New exercise" : "Generate exercise"}</button>
      </section>

      <main className="flex flex-1 flex-col overflow-y-auto lg:min-h-0 lg:flex-row lg:overflow-hidden">
        <section aria-label="Code change" className="flex min-h-[420px] flex-1 flex-col border-b border-[#273039] lg:min-w-0 lg:border-b-0 lg:border-r">
          <div className="flex min-h-14 items-center justify-between border-b border-[#273039] px-5 sm:px-7">
            <div><p className="text-[14px] font-semibold text-[#edf0f1]">Code change</p><p className="mt-0.5 text-[11px] text-[#89949c]">Review the diff and leave clear, actionable feedback.</p></div>
            {code && <span className="rounded border border-[#39434c] bg-[#1a2025] px-2.5 py-1 text-[11px] text-[#c5cdd2]">{language}</span>}
          </div>
          <div className="flex-1 overflow-auto bg-[#101418] px-4 py-5 sm:px-7">
            {!code && !generating && <div className="flex min-h-72 flex-col items-center justify-center text-center"><p className="mb-2 text-[15px] font-semibold text-[#e7eaec]">{generateError ? "Ready when you are" : "Start a practice review"}</p><p className="max-w-sm text-[13px] leading-6 text-[#9aa4ab]">{generateError || "Choose your interview setup above, then generate a pull request to review."}</p>{!generateError && <button onClick={handleGenerate} className="mt-5 rounded-md bg-[#ff765f] px-4 py-2.5 text-[13px] font-bold text-[#171310] hover:bg-[#ff927f]">Generate exercise</button>}</div>}
            {generating && <div role="status" className="flex min-h-72 items-center justify-center text-[14px] text-[#abb4ba]">Preparing your exercise…</div>}
            {code && <div className="min-w-max font-mono text-[13px] leading-7 sm:text-[14px]">{code.split("\n").map((line, index) => <div key={index} className="group flex gap-4 rounded px-1 hover:bg-white/[0.035]"><span className="w-8 flex-shrink-0 select-none text-right text-[#66717a]">{index + 1}</span><SyntaxHighlighter language={syntaxLanguage} style={vscDarkPlus} customStyle={{ background: "transparent", padding: 0, margin: 0, fontSize: "inherit", lineHeight: "inherit" }} codeTagProps={{ style: { background: "transparent" } }} PreTag="span">{line || " "}</SyntaxHighlighter></div>)}</div>}
          </div>
        </section>

        <section aria-label="Write your review" className="flex min-h-[560px] flex-1 flex-col bg-[#13181d] lg:min-w-0">
          <div className="border-b border-[#273039] px-5 py-5 sm:px-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[18px] font-bold tracking-[-0.3px] text-[#f4f5f6]">Write your code review</p><p className="mt-2 max-w-xl text-[13px] leading-5 text-[#a8b1b7]">Explain what could go wrong, why it matters, and how you would fix it.</p></div><div className="text-right text-[11px] leading-5 text-[#b2bbc0]"><p>{role}</p><p>{seniority} · {language}</p></div></div></div>
          <textarea value={userReview} onChange={(event) => setUserReview(event.target.value.slice(0, 2000))} disabled={!code || grading || Boolean(grade)} placeholder={code ? "Share your feedback on this change…\n\nCall out specific lines, explain the impact, and suggest a fix." : "Your review editor will be ready when you generate an exercise."} className="review-textarea min-h-56 flex-1 resize-none bg-transparent px-5 py-5 text-[14px] leading-7 text-[#edf0f1] outline-none placeholder:text-[#78838b] focus:ring-0 disabled:opacity-75 sm:px-7" />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#273039] px-5 py-4 sm:px-7"><span className="text-[11px] text-[#8e999f]">{userReview.length} / 2,000 characters</span><button onClick={handleGrade} disabled={grading || !userReview.trim() || !code || Boolean(grade)} className="rounded-md bg-[#ff765f] px-4 py-2.5 text-[13px] font-bold text-[#171310] transition-colors hover:bg-[#ff927f] disabled:cursor-not-allowed disabled:opacity-45">{grading ? "Grading review…" : "Submit review"}</button></div>
          {gradeError && <p role="alert" className="px-5 pb-4 text-[12px] text-[#ff9a86] sm:px-7">{gradeError}</p>}
          {grade && (
            <div aria-live="polite" className="max-h-[42vh] space-y-5 overflow-y-auto border-t border-[#273039] px-5 py-5 sm:px-7">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ba6ad]">Review score</p>
                  <p className="mt-1 text-[34px] font-bold leading-none text-[#ff8b76]">{grade.score}<span className="ml-1 text-[17px] font-medium text-[#a4adb3]">/10</span></p>
                </div>
                <p className="text-[12px] text-[#b8c0c5]">{grade.caught.length} of {grade.bugs.length} issues caught</p>
              </div>
              <div className="space-y-3">
                {grade.bugs.map((bug) => {
                  const caught = grade.caught.some((item) => item.bug === bug.id);
                  const feedback = caught
                    ? grade.caught.find((item) => item.bug === bug.id)?.reason
                    : grade.missed.find((item) => item.bug === bug.id)?.reason;
                  return (
                    <div key={bug.id} className="border-l-2 border-[#43505a] pl-3">
                      <p className={`text-[12px] font-semibold ${caught ? "text-[#a9dfbc]" : "text-[#ff9a86]"}`}>Issue {bug.id} · {caught ? "Caught" : "Missed"}</p>
                      <p className="mt-1 text-[12px] leading-5 text-[#b1bbc1]">{feedback || bug.description}</p>
                    </div>
                  );
                })}
              </div>
              {grade.extraFindings.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ba6ad]">Additional findings</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] leading-5 text-[#b1bbc1]">
                    {grade.extraFindings.map((finding, index) => <li key={index}>{finding}</li>)}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ba6ad]">Interviewer feedback</p>
                <p className="mt-2 text-[13px] leading-6 text-[#d0d5d8]">{grade.feedback}</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
