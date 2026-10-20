"use client";

import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import ProductHeader from "@/app/components/ProductHeader";
import { captureProductEvent, captureProductEventOnce, identifyProductUser } from "@/lib/analytics";
import { PRO_CREDITS_PER_BILLING_CYCLE, PRO_PRICE_USD } from "@/lib/credit-config";
import { LANGUAGES, ROLES, SENIORITIES } from "@/lib/practice-options";

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
  creditsRemaining?: number;
  reviewNumber?: number;
  bugs: {
    id: number;
    description: string;
  }[];
};

function Spinner({
  dark = false,
  size = "sm",
}: {
  dark?: boolean;
  size?: "sm" | "md";
}) {
  const dimensions = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";

  return (
    <span
      aria-hidden="true"
      className={`${dimensions} inline-block animate-spin rounded-full border-2 ${
        dark
          ? "border-[#171310]/25 border-t-[#171310]"
          : "border-[#ff765f]/25 border-t-[#ff765f]"
      }`}
    />
  );
}

export default function ReviewPage() {
  const [role, setRole] = useState<string>(ROLES[0]);
  const [language, setLanguage] = useState<string>(LANGUAGES[0]);
  const [seniority, setSeniority] = useState<string>(SENIORITIES[1]);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [exerciseToken, setExerciseToken] = useState("");
  const [userReview, setUserReview] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);

  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);

  const [completedReviews, setCompletedReviews] = useState(0);
  const [reviewCountLoaded, setReviewCountLoaded] = useState(false);
  const [userId, setUserId] = useState("");

  const [generateError, setGenerateError] = useState("");
  const [outOfCredits, setOutOfCredits] = useState(false);
  const [gradeError, setGradeError] = useState("");


  useEffect(() => {
    fetch("/api/credits")
      .then((response) => response.json())
      .then((data) => {
        if (data.userId) identifyProductUser(data.userId, data.userCreatedAt, data.userConfirmedAt);
        setCompletedReviews(data.completedReviews ?? 0);
        setUserId(data.userId ?? "");
        setReviewCountLoaded(true);
      })
      .catch(() => {});
  }, [grade]);

  useEffect(() => {
    if (code && exerciseToken && completedReviews === 0 && userId) {
      captureProductEventOnce(`first-exercise-started-${userId}`, "first_exercise_started", { role, language, seniority });
    }
  }, [code, exerciseToken, completedReviews, userId, role, language, seniority]);

  useEffect(() => {
    if (grade?.reviewNumber === 1 && userId) {
      captureProductEventOnce(`first-result-viewed-${userId}`, "first_result_viewed", {
        score: grade.score,
        issues_caught: grade.caught.length,
        total_issues: grade.bugs.length,
      });
    }
  }, [grade, userId]);

  async function handleGenerate() {
    if (generating || grading) return;

    const reviewCount = Math.max(completedReviews, grade?.reviewNumber ?? 0);
    if (reviewCount === 1 && userId) {
      captureProductEventOnce(`second-review-started-${userId}`, "second_review_started");
    }

    setGenerating(true);

    setGrade(null);
    setUserReview("");
    setCode("");
    setDescription("");
    setExerciseToken("");
    setGenerateError("");
    setOutOfCredits(false);
    setGradeError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          language,
          seniority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOutOfCredits(response.status === 402);
        setGenerateError(
          response.status === 402
            ? `Keep practicing with ${PRO_CREDITS_PER_BILLING_CYCLE} more reviews each billing cycle for ${PRO_PRICE_USD}/month.`
            : (data.error ?? "Couldn't generate an exercise. Try again."),
        );

        return;
      }

      setCode(data.code);
      setDescription(data.description ?? "");
      setExerciseToken(data.exerciseToken);
      captureProductEvent("exercise_generated", {
        role,
        language,
        seniority,
      });
    } catch {
      setGenerateError(
        "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleGrade() {
    if (
      grading ||
      generating ||
      !userReview.trim() ||
      !code ||
      !exerciseToken ||
      grade
    ) {
      return;
    }

    setGrading(true);
    setGradeError("");

    if (completedReviews === 0 && userId) {
      captureProductEventOnce(`first-review-submitted-${userId}`, "first_review_submitted", { role, language, seniority });
    }

    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exerciseToken,
          userReview,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGradeError(data.error ?? "Couldn't grade this review. Try again.");

        return;
      }

      setGrade(data);
      window.dispatchEvent(new Event("reviewiq:credits-updated"));

      captureProductEvent("review_graded", {
        role,
        language,
        seniority,
        score: data.score,
        issues_caught: data.caught?.length ?? 0,
        total_issues: data.bugs?.length ?? 3,
        credits_remaining: data.creditsRemaining,
        review_number: data.reviewNumber,
      });
    } catch {
      setGradeError(
        "Couldn't reach the server. Your review is still here. Try again.",
      );
    } finally {
      setGrading(false);
    }
  }

  const syntaxLanguage =
    language.toLowerCase() === "typescript"
      ? "typescript"
      : language.toLowerCase() === "javascript"
        ? "javascript"
        : language.toLowerCase() === "java"
          ? "java"
          : language.toLowerCase() === "go"
            ? "go"
            : "python";

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#101418] text-[#f4f5f6] lg:h-screen lg:min-h-0">
      <ProductHeader active="review" />

      {!grade && <section className="flex flex-wrap items-center justify-between gap-4 border-b border-[#273039] bg-[#14191e] px-5 py-3 sm:px-7">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          {[
            {
              label: "Role",
              value: role,
              setter: setRole,
              options: ROLES,
            },
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
            <label key={label} className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8d989f]">
                {label}
              </span>

              <select
                value={value}
                disabled={generating || grading}
                onChange={(event) => setter(event.target.value)}
                className="min-w-32 cursor-pointer rounded border border-[#343e47] bg-[#1a2025] px-2.5 py-1.5 text-[12px] text-[#e7eaec] outline-none transition-colors focus:border-[#ff765f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || grading}
          className="inline-flex items-center gap-2 rounded-md bg-[#ff765f] px-4 py-2.5 text-[13px] font-bold text-[#171310] transition-colors hover:bg-[#ff927f] disabled:cursor-wait disabled:opacity-60"
        >
          {generating && <Spinner dark />}

          {generating
            ? "Generating exercise..."
            : code
              ? "New exercise"
              : "Start review"}
        </button>
      </section>}

      {grade ? (
        <main aria-label="Review result" className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#273039] pb-7">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#ff9a87]">Your review result</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-1px] sm:text-[36px]">Here’s what your judgment caught.</h1><p className="mt-2 text-[13px] text-[#aab4ba]">{role} · {seniority} · {language}</p></div>
              <div className="flex items-end gap-5"><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#aab4ba]">Review score</p><p className="mt-1 text-[48px] font-bold leading-none text-[#ff8b76]">{grade.score}<span className="ml-1 text-[21px] font-medium text-[#a4adb3]">/10</span></p></div><p className="pb-1 text-[13px] font-medium text-[#d6dcdf]">{grade.caught.length} of {grade.bugs.length} issues caught</p></div>
            </div>
            <p className="mt-5 text-[12px] leading-5 text-[#aab4ba]">Your score combines issue detection and how clearly you explained your findings. Use the breakdown to guide your next review.</p>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {grade.bugs.map((bug) => {
                const caught = grade.caught.some((item) => item.bug === bug.id);
                const reason = caught ? grade.caught.find((item) => item.bug === bug.id)?.reason : grade.missed.find((item) => item.bug === bug.id)?.reason;
                return <article key={bug.id} className={`rounded-lg border p-5 ${caught ? "border-emerald-300/25 bg-emerald-300/[.045]" : "border-[#ff806a40] bg-[#ff806a0a]"}`}>
                  <p className={`text-[12px] font-semibold ${caught ? "text-[#a9dfbc]" : "text-[#ffab98]"}`}>{caught ? "Caught" : "Missed"} · Issue {bug.id}</p>
                  <h2 className="mt-2 text-[14px] font-semibold text-[#edf0f1]">{bug.description}</h2>
                  <p className="mt-2 text-[12px] leading-6 text-[#c0c8cd]">{reason || "This planted issue was not identified in the review."}</p>
                </article>;
              })}
            </div>
            {grade.extraFindings.length > 0 && <section className="mt-7 rounded-lg border border-[#ffffff18] bg-[#13191e] p-5"><h2 className="text-[12px] font-semibold text-[#e7eaec]">Additional findings</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-[12px] leading-5 text-[#c0c8cd]">{grade.extraFindings.map((finding, index) => <li key={index}>{finding}</li>)}</ul></section>}
            <section className="mt-7 rounded-lg border border-[#ffffff18] bg-[#13191e] p-5 sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#aab4ba]">Feedback for your next review</p><p className="mt-3 text-[14px] leading-7 text-[#e0e4e6]">{grade.feedback}</p></section>
            <details className="mt-4 rounded-lg border border-[#ffffff14] bg-[#12181d] p-4"><summary className="cursor-pointer text-[12px] font-semibold text-[#c7cfd3] focus-visible:outline-2 focus-visible:outline-[#ff9a87]">Read the review you submitted</summary><p className="mt-3 whitespace-pre-wrap text-[12px] leading-6 text-[#aeb8be]">{userReview}</p></details>
            <div className="mt-8 flex flex-wrap items-center gap-4"><button onClick={handleGenerate} disabled={generating} className="rounded-md bg-[#ff806a] px-5 py-3 text-[13px] font-bold text-[#201715] transition hover:bg-[#ff9a87] disabled:opacity-50">{generating ? "Starting another review…" : "Try another review"}</button><a href="/history" className="rounded-md border border-[#ffffff28] px-4 py-3 text-[12px] font-semibold text-[#d0d6da] hover:border-[#ff806a]">Review history</a>{grade.creditsRemaining === 0 && <a href={process.env.NEXT_PUBLIC_GUMROAD_URL ? "/api/checkout" : "/pricing"} target={process.env.NEXT_PUBLIC_GUMROAD_URL ? "_blank" : undefined} rel={process.env.NEXT_PUBLIC_GUMROAD_URL ? "noopener noreferrer" : undefined} onClick={() => {captureProductEvent("upgrade_clicked"); if (process.env.NEXT_PUBLIC_GUMROAD_URL) {captureProductEvent("pro_plan_cta_clicked", {provider:"gumroad"});captureProductEvent("checkout_started", {provider:"gumroad"});}}} className="text-[12px] font-semibold text-[#ff9a87] hover:text-white">Continue with Pro <span aria-hidden="true">↗</span></a>}</div>
            {grade.creditsRemaining === 0 && <div className="mt-4"><h2 className="text-[15px] font-semibold text-[#e7eaec]">Ready for your next review?</h2><p className="mt-1 text-[12px] leading-5 text-[#aab4ba]">Keep practicing with {PRO_CREDITS_PER_BILLING_CYCLE} more reviews each billing cycle for {PRO_PRICE_USD}/month.</p></div>}
            {gradeError && <p role="alert" className="mt-4 text-[12px] text-[#ff9a86]">{gradeError}</p>}
          </div>
        </main>
      ) : (
      <main className="flex flex-1 flex-col overflow-y-auto lg:min-h-0 lg:flex-row lg:overflow-hidden">
        <section
          aria-label="Code change"
          className="flex min-h-[420px] flex-1 flex-col border-b border-[#273039] lg:min-w-0 lg:border-b-0 lg:border-r"
        >
          <div className="flex min-h-14 items-center justify-between border-b border-[#273039] px-5 sm:px-7">
            <div>
              <p className="text-[14px] font-semibold text-[#edf0f1]">
                Code change
              </p>

              <p className="mt-0.5 text-[11px] text-[#89949c]">
                Review the diff and leave clear, actionable feedback.
              </p>
            </div>

            {code && (
              <span className="rounded border border-[#39434c] bg-[#1a2025] px-2.5 py-1 text-[11px] text-[#c5cdd2]">
                {language}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-auto bg-[#101418] px-4 py-5 sm:px-7">
            {!code && !generating && (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <p className="mb-2 text-[15px] font-semibold text-[#e7eaec]">
                  {generateError
                    ? outOfCredits ? "Ready for your next review?" : "Exercise generation failed"
                    : !reviewCountLoaded
                      ? "Ready to review?"
                      : completedReviews === 0
                        ? "Your first review is ready."
                        : "Ready for another review?"}
                </p>

                <p className="max-w-sm text-[13px] leading-6 text-[#9aa4ab]">
                  {generateError ||
                    "Choose your role, language, and experience level above, then start the review."}
                </p>

                {generateError && !outOfCredits && <button onClick={handleGenerate} disabled={generating} className="mt-5 rounded-md bg-[#ff765f] px-4 py-2.5 text-[13px] font-bold text-[#171310] hover:bg-[#ff927f] disabled:opacity-50">Try again</button>}
              </div>
            )}

            {generating && (
              <div
                role="status"
                aria-live="polite"
                className="flex min-h-72 flex-col items-center justify-center text-center"
              >
                <Spinner size="md" />

                <p className="mt-4 text-[14px] font-semibold text-[#e7eaec]">
                  Generating your pull request...
                </p>

                <p className="mt-2 max-w-sm text-[12px] leading-5 text-[#9aa4ab]">
                  Planting issues for your role and experience level.
                </p>
              </div>
            )}

            {description && <p className="mb-5 max-w-3xl text-[13px] leading-6 text-[#b9c3c9]">{description}</p>}
            {code && (
              <div className="min-w-max font-mono text-[13px] leading-7 sm:text-[14px]">
                {code.split("\n").map((line, index) => (
                  <div
                    key={index}
                    className="group flex gap-4 rounded px-1 hover:bg-white/[0.035]"
                  >
                    <span className="w-8 flex-shrink-0 select-none text-right text-[#66717a]">
                      {index + 1}
                    </span>

                    <SyntaxHighlighter
                      language={syntaxLanguage}
                      style={vscDarkPlus}
                      customStyle={{
                        background: "transparent",
                        padding: 0,
                        margin: 0,
                        fontSize: "inherit",
                        lineHeight: "inherit",
                      }}
                      codeTagProps={{
                        style: {
                          background: "transparent",
                        },
                      }}
                      PreTag="span"
                    >
                      {line || " "}
                    </SyntaxHighlighter>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          aria-label="Write your review"
          className="flex min-h-[560px] flex-1 flex-col bg-[#13181d] lg:min-w-0"
        >
          <div className="border-b border-[#273039] px-5 py-5 sm:px-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[18px] font-bold tracking-[-0.3px] text-[#f4f5f6]">
                  Write your code review
                </p>

                <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#a8b1b7]">
                  Explain what could go wrong, why it matters, and how you would
                  fix it.
                </p>
              </div>

              <div className="text-right text-[11px] leading-5 text-[#b2bbc0]">
                <p>{role}</p>
                <p>
                  {seniority} · {language}
                </p>
              </div>
            </div>
          </div>

          <textarea
            aria-label="Your code review"
            value={userReview}
            onChange={(event) =>
              setUserReview(event.target.value.slice(0, 2000))
            }
            disabled={!code || grading || Boolean(grade)}
            placeholder={
              code
                ? "Share your feedback on this change…\n\nCall out specific lines, explain the impact, and suggest a fix."
                : "Your review editor will be ready when you generate an exercise."
            }
            className="review-textarea min-h-56 flex-1 resize-none bg-transparent px-5 py-5 text-[14px] leading-7 text-[#edf0f1] outline-none placeholder:text-[#78838b] focus:ring-0 disabled:opacity-75 sm:px-7"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#273039] px-5 py-4 sm:px-7">
            <span className="text-[11px] text-[#8e999f]">
              {userReview.length} / 2,000 characters
            </span>

            <button
              onClick={handleGrade}
              disabled={
                grading ||
                generating ||
                !userReview.trim() ||
                !code ||
                !exerciseToken ||
                Boolean(grade)
              }
              className="inline-flex items-center gap-2 rounded-md bg-[#ff765f] px-4 py-2.5 text-[13px] font-bold text-[#171310] transition-colors hover:bg-[#ff927f] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {grading && <Spinner dark />}

              {grading ? "Grading review..." : "Submit review"}
            </button>
          </div>

          {grading && (
            <div
              role="status"
              aria-live="polite"
              className="border-t border-[#273039] px-5 py-5 sm:px-7"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Spinner />
                </div>

                <div>
                  <p className="text-[13px] font-semibold text-[#e7eaec]">
                    Reviewing your findings...
                  </p>

                  <p className="mt-1 text-[12px] leading-5 text-[#9aa4ab]">
                    Comparing your review against the planted issues.
                  </p>
                </div>
              </div>
            </div>
          )}

          {gradeError && !grading && (
            <div
              role="alert"
              className="border-t border-[#273039] px-5 py-4 sm:px-7"
            >
              <p className="text-[12px] leading-5 text-[#ff9a86]">
                {gradeError}
              </p>

              <p className="mt-1 text-[11px] text-[#8e999f]">
                Your written review has been preserved. You can submit it again.
              </p>
            </div>
          )}

        </section>
      </main>
      )}
    </div>
  );
}
