"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Review = {
  id: string;
  role: string;
  language: string;
  seniority: string;
  score: number;
  caught: number[];
  missed: number[];
  feedback: string;
  bugs: { id: number; description: string }[];
  user_review: string;
  created_at: string;
};

export default function HistoryPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selected, setSelected] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="h-screen bg-[#0f0f0f] text-white flex flex-col overflow-hidden">
      {/* NAV */}
      <nav className="border-b border-[#252525] px-8 h-16 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-[18px] font-black tracking-[-0.5px] text-white"
          >
            Review<span className="text-indigo-400">IQ</span>
          </Link>
          <div className="flex items-center gap-1">
            {[
              { label: "Review", href: "/review" },
              { label: "History", href: "/history" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={`text-[13px] font-semibold cursor-pointer transition-all px-3 py-1.5 rounded-md ${
                  label === "History"
                    ? "text-white bg-[#222]"
                    : "text-[#777] hover:text-white hover:bg-[#1a1a1a]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <Link
          href="/review"
          className="bg-white text-black text-[13px] font-bold px-5 py-2 rounded-md hover:bg-[#e4e4e7] transition-colors tracking-tight"
        >
          New Review
        </Link>
      </nav>

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
              Complete your first review to see your history.
            </p>
            <Link
              href="/review"
              className="bg-white text-black text-[13px] font-bold px-6 py-2.5 rounded-md hover:bg-[#e4e4e7] transition-colors"
            >
              Start reviewing →
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* LIST */}
          <div className="w-72 border-r border-[#222] overflow-y-auto flex-shrink-0 bg-[#0a0a0a]">
            <div className="p-4">
              <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-3">
                {reviews.length} session{reviews.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-1.5">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`p-3 rounded-md border cursor-pointer transition-all ${
                      selected?.id === r.id
                        ? "border-[#3f3f46] bg-[#18181b]"
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
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DETAIL */}
          {selected && (
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#0f0f0f]">
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
                    {selected.caught.length} of {selected.bugs.length} bugs
                    caught
                  </p>
                </div>
              </div>

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

              {/* Bug breakdown */}
              <div>
                <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-3">
                  Bug Breakdown
                </p>
                <div className="space-y-2">
                  {selected.bugs.map((bug) => {
                    const caught = selected.caught.includes(bug.id);
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
                            Bug {bug.id} — {caught ? "Caught" : "Missed"}
                          </p>
                          <p className="text-[12px] text-[#71717a] leading-relaxed">
                            {bug.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-[#111] border border-[#222] rounded-lg p-5">
                <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-3">
                  Interviewer Feedback
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
