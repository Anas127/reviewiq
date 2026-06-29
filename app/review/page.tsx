"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { createClient } from "@/lib/supabase/client";

const ROLES = [
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "Data Engineer",
];
const LANGUAGES = ["Python", "TypeScript", "JavaScript", "Java", "Go"];
const SENIORITIES = ["Junior", "Mid-level", "Senior"];

type Bug = { id: number; line: string; description: string };
type Grade = {
  score: number;
  caught: number[];
  missed: number[];
  feedback: string;
};
type Session = {
  id: string;
  title: string;
  language: string;
  seniority: string;
  score: number;
};

export default function ReviewPage() {
  const [role, setRole] = useState(ROLES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [seniority, setSeniority] = useState(SENIORITIES[1]);
  const [code, setCode] = useState("");
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [userReview, setUserReview] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState("");

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => setCredits(d.credits));
  }, [grade]);

  function handleBuyCredits(pack: "10" | "30") {
    const url =
      pack === "10"
        ? process.env.NEXT_PUBLIC_LS_10_REVIEWS_URL
        : process.env.NEXT_PUBLIC_LS_30_REVIEWS_URL;
    window.open(url, "_blank");
  }

  async function handleGenerate() {
    setGenerating(true);
    setGrade(null);
    setUserReview("");
    setCode("");
    setBugs([]);
    setGenerateError("");

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, language, seniority }),
    });

    if (res.status === 402) {
      setGenerateError("No credits left.");
      setGenerating(false);
      return;
    }

    const data = await res.json();
    setCode(data.code);
    setBugs(data.bugs);
    setGenerating(false);
  }

  async function handleGrade() {
    if (!userReview.trim()) return;
    setGrading(true);
    const res = await fetch("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        bugs,
        userReview,
        role,
        language,
        seniority,
      }),
    });
    const data = await res.json();
    setGrade(data);
    const title =
      code
        .split("\n")
        .find(
          (l) =>
            l.includes("def ") ||
            l.includes("class ") ||
            l.includes("function "),
        )
        ?.trim() ?? "Review";
    setSessions((prev) => [
      {
        id: Date.now().toString(),
        title,
        language,
        seniority,
        score: data.score,
      },
      ...prev,
    ]);
    setGrading(false);
  }

  return (
    <div className="h-screen bg-[#0f0f0f] text-white flex flex-col overflow-hidden">
      {/* NAV */}
      <nav className="border-b border-[#252525] px-8 h-16 flex items-center justify-between flex-shrink-0 bg-[#0f0f0f]">
        <div className="flex items-center gap-8">
          {/* LOGO — big, bold, dominant */}
          <Link
            href="/"
            className="text-[18px] font-black tracking-[-0.5px] text-white"
          >
            Review<span className="text-indigo-400">IQ</span>
          </Link>
          {/* DIVIDER */}
          <div className="w-px h-5 bg-[#2a2a2a]" />
          {/* NAV LINKS — clearly readable, not timid */}
          <div className="flex items-center gap-1">
            {[
              { label: "Review", href: "/review" },
              { label: "History", href: "/history" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={`text-[13px] font-semibold cursor-pointer transition-all px-3 py-1.5 rounded-md ${
                  label === "Review"
                    ? "text-white bg-[#222]"
                    : "text-[#777] hover:text-white hover:bg-[#1a1a1a]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-[#2a2a2a] rounded-md px-3 py-2 bg-[#141414]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            <span className="text-[12px] text-[#ccc] font-medium">
              {credits === null
                ? "..."
                : `${credits} review${credits === 1 ? "" : "s"} left`}
            </span>
          </div>
          <button
            onClick={() => handleBuyCredits("10")}
            className="bg-white text-black text-[13px] font-bold px-5 py-2 rounded-md hover:bg-[#e4e4e7] transition-colors tracking-tight"
          >
            Buy Credits
          </button>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="text-[13px] font-semibold text-[#555] hover:text-white transition-colors px-3 py-2"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-60 border-r border-[#222] flex flex-col flex-shrink-0 overflow-y-auto bg-[#0f0f0f]">
          <div className="p-4 space-y-4">
            <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">
              Configuration
            </p>
            <div className="space-y-3">
              {[
                { label: "Role", value: role, setter: setRole, options: ROLES },
                {
                  label: "Language",
                  value: language,
                  setter: setLanguage,
                  options: LANGUAGES,
                },
                {
                  label: "Seniority",
                  value: seniority,
                  setter: setSeniority,
                  options: SENIORITIES,
                },
              ].map(({ label, value, setter, options }) => (
                <div key={label}>
                  <p className="text-[11px] font-semibold text-[#777] mb-1.5">
                    {label}
                  </p>
                  <select
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2e2e2e] rounded-md px-3 py-2 text-[12px] text-[#e4e4e7] focus:outline-none focus:border-[#555] transition-colors appearance-none cursor-pointer"
                  >
                    {options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-white text-black text-[13px] font-bold py-2.5 rounded-md hover:bg-[#e4e4e7] transition-colors disabled:opacity-40 tracking-tight"
            >
              {generating ? "Generating..." : "Generate PR →"}
            </button>
          </div>

          {sessions.length > 0 && (
            <div className="border-t border-[#222] p-4">
              <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-3">
                Recent
              </p>
              <div className="space-y-1.5">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-md border border-[#222] bg-[#161616]"
                  >
                    <p className="text-[12px] text-[#ccc] truncate">
                      {s.title}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-[#555]">
                        {s.language} · {s.seniority}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.score >= 7 ? "bg-[#14532d] text-[#4ade80]" : "bg-[#713f12] text-[#fb923c]"}`}
                      >
                        {s.score}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MAIN */}
        <div className="flex flex-1 overflow-hidden">
          {/* CODE PANEL */}
          <div className="flex-1 flex flex-col border-r border-[#222] overflow-hidden">
            <div className="h-10 border-b border-[#222] px-5 flex items-center justify-between flex-shrink-0 bg-[#0f0f0f]">
              <span className="text-[10px] font-bold text-[#444] uppercase tracking-widest">
                Code Snippet
              </span>
              {code && (
                <span className="text-[11px] text-[#777] border border-[#2a2a2a] px-2 py-0.5 rounded bg-[#181818]">
                  {language}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-5">
              {!code && !generating && (
                <div className="h-full flex items-center justify-center">
                  <div className="border border-dashed border-[#252525] rounded-xl p-12 text-center max-w-sm">
                    {generateError ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-[#1a0808] border border-[#7f1d1d] flex items-center justify-center mb-5 mx-auto">
                          <span className="text-[#ef4444] text-xl font-bold">
                            ✕
                          </span>
                        </div>
                        <p className="text-white text-[15px] font-bold mb-2">
                          Out of reviews
                        </p>
                        <p className="text-[#555] text-[12px] leading-relaxed mb-6 max-w-[200px] mx-auto">
                          You've used all your credits. Buy a pack to keep
                          going.
                        </p>
                        <button
                          onClick={() => handleBuyCredits("10")}
                          className="bg-white text-black text-[13px] font-bold px-6 py-2.5 rounded-md hover:bg-[#e4e4e7] transition-colors"
                        >
                          Buy Credits →
                        </button>
                        <p className="text-[#777] text-[12px] mt-3 font-medium">
                          9€ for 10 reviews · 19€ for 30 reviews
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-[#2a2a2a] text-4xl mb-4 font-mono">
                          {"{ }"}
                        </div>
                        <p className="text-[#555] text-sm font-semibold mb-1">
                          No snippet generated yet
                        </p>
                        <p className="text-[#333] text-xs leading-relaxed">
                          Pick your role, language, and seniority — then hit
                          Generate PR to get a buggy diff to review.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
              {generating && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-[#333] text-4xl font-mono mb-4">
                      {"{ }"}
                    </div>
                    <p className="text-[#555] text-sm">Generating your PR...</p>
                  </div>
                </div>
              )}
              {code && (
                <div className="text-[12px] font-mono leading-7">
                  {code.split("\n").map((line, i) => (
                    <div
                      key={i}
                      className="flex gap-4 hover:bg-[#ffffff08] rounded px-1 -mx-1 group"
                    >
                      <span className="text-[#2e2e2e] group-hover:text-[#444] w-6 text-right flex-shrink-0 select-none mt-0.5">
                        {i + 1}
                      </span>
                      <SyntaxHighlighter
                        language={
                          language.toLowerCase() === "typescript"
                            ? "typescript"
                            : language.toLowerCase() === "javascript"
                              ? "javascript"
                              : language.toLowerCase() === "java"
                                ? "java"
                                : language.toLowerCase() === "go"
                                  ? "go"
                                  : "python"
                        }
                        style={vscDarkPlus}
                        customStyle={{
                          background: "transparent",
                          padding: 0,
                          margin: 0,
                          fontSize: "12px",
                          lineHeight: "1.75rem",
                        }}
                        codeTagProps={{ style: { background: "transparent" } }}
                        PreTag="span"
                      >
                        {line}
                      </SyntaxHighlighter>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="w-[420px] flex flex-col flex-shrink-0 overflow-hidden bg-[#0f0f0f]">
            {/* REVIEW INPUT */}
            <div className="border-b border-[#222] p-5 flex-shrink-0">
              <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-3">
                Your Review
              </p>
              <textarea
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                disabled={!code}
                placeholder="Describe every bug you find. Explain why it's a problem and how you'd fix it. Write like you're reviewing a teammate's PR."
                rows={5}
                className="review-textarea w-full bg-[#141414] border border-[#2e2e2e] rounded-md px-4 py-3 text-[12px] text-[#d4d4d8] focus:outline-none focus:border-[#555] transition-colors resize-none leading-relaxed disabled:opacity-40"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-[#777]">
                  {userReview.length} / 2000
                </span>
                <button
                  onClick={handleGrade}
                  disabled={grading || !userReview.trim() || !code}
                  className="bg-white text-black text-[12px] font-bold px-4 py-2 rounded-md hover:bg-[#e4e4e7] transition-colors disabled:opacity-40 tracking-tight"
                >
                  {grading ? "Grading..." : "Submit Review →"}
                </button>
              </div>
            </div>

            {/* RESULT */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {!grade && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-[#444] text-sm font-semibold mb-1">
                      No review submitted yet
                    </p>
                    <p className="text-[#333] text-xs">
                      Write your review and hit Submit.
                    </p>
                  </div>
                </div>
              )}

              {grade && (
                <>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-[48px] font-black tracking-tight leading-none ${grade.score >= 7 ? "text-emerald-400" : grade.score >= 5 ? "text-amber-400" : "text-red-400"}`}
                      >
                        {grade.score}
                      </span>
                      <span className="text-[20px] text-[#333] font-bold">
                        /10
                      </span>
                    </div>
                    <p className="text-[12px] text-[#555] mt-1">
                      {grade.caught.length} of {bugs.length} bugs caught
                    </p>
                    <div className="h-[2px] bg-[#1f1f1f] rounded-full mt-3">
                      <div
                        className={`h-full rounded-full transition-all ${grade.score >= 7 ? "bg-emerald-500" : grade.score >= 5 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${(grade.score / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-3">
                      Bug Breakdown
                    </p>
                    <div className="space-y-2">
                      {bugs.map((bug) => {
                        const caught = grade.caught.includes(bug.id);
                        return (
                          <div
                            key={bug.id}
                            className={`rounded-lg border p-3 flex gap-3 ${caught ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 ${caught ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                            >
                              {caught ? "✓" : "✗"}
                            </div>
                            <div>
                              <p
                                className={`text-[12px] font-semibold mb-0.5 ${caught ? "text-emerald-300" : "text-red-300"}`}
                              >
                                Bug {bug.id} — {caught ? "Caught" : "Missed"}
                              </p>
                              <p className="text-[11px] text-[#71717a] leading-relaxed">
                                {bug.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border border-[#222] rounded-md p-4 bg-[#111]">
                    <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-2">
                      Interviewer Feedback
                    </p>
                    <p className="text-[12px] text-[#777] leading-relaxed">
                      {grade.feedback}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
