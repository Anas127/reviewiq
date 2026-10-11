"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ProductHeader from "@/app/components/ProductHeader";
import { captureProductEvent } from "@/lib/analytics";

type Review = {
  id: string;
  role: string;
  language: string;
  seniority: string;
  exercise_description: string | null;
  score: number;
  caught: (number | { bug: number; reason: string })[];
  missed: (
    | number
    | { bug: number; description: string; reason: string }
  )[];
  feedback: string;
  bugs: { id: number; description: string }[];
  user_review: string;
  created_at: string;
};

export default function HistoryPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selected, setSelected] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const viewTracked = useRef(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      if (!viewTracked.current) {
        viewTracked.current = true;
        captureProductEvent("history_viewed");
      }

      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setReviews(data ?? []);
      if (data && data.length > 0) setSelected(data[0]);
      setLoading(false);
    }
    load();
  }, []);

  function formatDate(str: string) {
    return new Date(str).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-[#101418] text-[#f4f5f6] flex flex-col overflow-hidden lg:h-screen">
      <ProductHeader active="history" />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#444] text-sm">Loading...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white text-[15px] font-bold mb-2">
              No reviews yet
            </p>
            <p className="text-[#555] text-[13px] mb-6">
              Complete your first review to see what you caught and missed.
            </p>
            <Link
              href="/review"
              className="bg-white text-black text-[13px] font-bold px-6 py-2.5 rounded-md hover:bg-[#e4e4e7] transition-colors"
            >
              Start your first review →
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* LIST */}
          <div className="max-h-60 w-full flex-shrink-0 overflow-y-auto border-b border-[#ffffff14] bg-[#12181d] lg:max-h-none lg:w-72 lg:border-b-0 lg:border-r">
            <div className="p-4">
              <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-3">
                {reviews.length} session{reviews.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-1.5">
                {reviews.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    aria-pressed={selected?.id === r.id}
                    className={`block w-full rounded-md border p-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-[#ff9a87] ${
                      selected?.id === r.id
                        ? "border-[#ff806a66] bg-[#ff806a0d]"
                        : "border-transparent hover:border-[#27272a] hover:bg-[#111]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-white font-semibold">
                        {r.language} · {r.seniority}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          r.score >= 7
                            ? "bg-emerald-500/20 text-emerald-400"
                            : r.score >= 5
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {r.score}/10
                      </span>
                    </div>
                    <p className="text-[11px] text-[#71717a]">{r.role}</p>
                    <p className="text-[11px] text-[#3f3f46] mt-1">
                      {formatDate(r.created_at)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DETAIL */}
          {selected && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-[#101418]">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-white mb-1">
                    {selected.role}
                  </h2>
                  <p className="text-[13px] text-[#71717a]">
                    {selected.language} · {selected.seniority} ·{" "}
                    {formatDate(selected.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1.5 justify-end">
                    <span
                      className={`text-[56px] font-black tracking-tight leading-none ${
                        selected.score >= 7
                          ? "text-emerald-400"
                          : selected.score >= 5
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {selected.score}
                    </span>
                    <span className="text-[24px] text-[#3f3f46] font-bold">
                      /10
                    </span>
                  </div>
                  <p className="text-[12px] text-[#71717a] mt-1">
                    {selected.caught.length} of {selected.bugs.length} issues
                    caught
                  </p>
                </div>
              </div>

              {selected.exercise_description && (
                <section className="rounded-lg border border-[#ffffff18] bg-[#13191e] p-5">
                  <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#89959d]">Exercise context</h3>
                  <p className="text-[13px] leading-6 text-[#c2cbd0]">{selected.exercise_description}</p>
                </section>
              )}

              {/* Progress */}
              <div className="h-[3px] bg-[#1f1f1f] rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${
                    selected.score >= 7
                      ? "bg-emerald-500"
                      : selected.score >= 5
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${(selected.score / 10) * 100}%` }}
                />
              </div>

              {/* Your review */}
              <div>
                <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-3">
                  Your Review
                </p>
                <div className="bg-[#111] border border-[#222] rounded-lg p-5">
                  <p className="text-[13px] text-[#a1a1aa] leading-relaxed">
                    {selected.user_review}
                  </p>
                </div>
              </div>

              {/* Caught and missed issue breakdown */}
              <div>
                <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-3">
                  Issue breakdown
                </p>
                <div className="space-y-2">
                  {selected.bugs.map((bug) => {
                    const caught = selected.caught.some((item) =>
                      typeof item === "number" ? item === bug.id : item.bug === bug.id,
                    );
                    const detail = caught
                      ? selected.caught.find((item) => typeof item !== "number" && item.bug === bug.id)
                      : selected.missed.find((item) => typeof item !== "number" && item.bug === bug.id);
                    return (
                      <div
                        key={bug.id}
                        className={`rounded-lg border p-4 flex gap-3 ${
                          caught
                            ? "bg-emerald-500/5 border-emerald-500/20"
                            : "bg-red-500/5 border-red-500/20"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-0.5 ${
                            caught
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {caught ? "✓" : "✗"}
                        </div>
                        <div>
                          <p
                            className={`text-[13px] font-semibold mb-1 ${caught ? "text-emerald-300" : "text-red-300"}`}
                          >
                            Issue {bug.id} — {caught ? "Caught" : "Missed"}
                          </p>
                          <p className="text-[12px] text-[#b3bdc2] leading-relaxed">
                            {bug.description}
                          </p>
                          {detail && typeof detail !== "number" && <p className="mt-2 text-[12px] leading-relaxed text-[#89959d]">{detail.reason}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-[#111] border border-[#222] rounded-lg p-5">
                <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-3">
                  Review feedback
                </p>
                <p className="text-[13px] text-[#a1a1aa] leading-relaxed">
                  {selected.feedback}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
