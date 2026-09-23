"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  History,
  FileText,
} from "lucide-react";
import { AttemptHistoryItem } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ReviewerPanelProps {
  history: AttemptHistoryItem[];
  isApproved: boolean;
  activeDraft: string;
}

const CRITERIA = [
  { id: 1, label: "Strong hook in the first line", desc: "Scroll-stopping first 1-2 sentences" },
  { id: 2, label: "One clear, valuable takeaway", desc: "Focused thesis without scattered points" },
  { id: 3, label: "Easy to skim (short paragraphs)", desc: "1-3 sentences per paragraph, ample whitespace" },
  { id: 4, label: "Roughly 150-200 words", desc: "Optimal LinkedIn algorithm dwell time" },
  { id: 5, label: "Engaging question or CTA at the end", desc: "Invites meaningful comments and debate" },
  { id: 6, label: "Professional but human tone", desc: "Authentic voice, avoids generic robotic AI clichés" },
  { id: 7, label: "Zero hashtags", desc: "Clean reading experience (hashtags no longer boost LinkedIn reach)" },
];

export function ReviewerPanel({
  history,
  isApproved,
  activeDraft,
}: ReviewerPanelProps) {
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState<number | null>(
    history.length > 0 ? history.length - 1 : null
  );

  // Keep latest attempt selected when history updates
  React.useEffect(() => {
    if (history.length > 0) {
      setSelectedAttemptIndex(history.length - 1);
    }
  }, [history.length]);

  return (
    <div className="space-y-4">
      {/* 7-Criteria Checklist Card */}
      <Card className="border-slate-200/90 dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-bold tracking-tight">
                Strict Editorial Rubric
              </CardTitle>
            </div>
            <span className="text-[11px] text-slate-400">
              Evaluated by Groq Reviewer
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {CRITERIA.map((criterion) => (
              <div
                key={criterion.id}
                className={cn(
                  "flex items-start space-x-2 rounded-lg p-2 transition border",
                  isApproved
                    ? "border-emerald-100 bg-emerald-50/40 text-emerald-950 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300"
                    : "border-slate-100 bg-slate-50/50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                )}
              >
                {isApproved ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                    {criterion.id}
                  </span>
                )}
                <div>
                  <p className="font-semibold leading-snug">{criterion.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{criterion.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attempt History & Critique Logs */}
      {history.length > 0 && (
        <Card className="border-slate-200/90 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="h-4 w-4 text-indigo-600" />
                <CardTitle className="text-sm font-bold tracking-tight">
                  Review & Revision History
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono">
                {history.length} {history.length === 1 ? "Attempt" : "Attempts"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            {/* Attempt selector buttons */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAttemptIndex(idx)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border whitespace-nowrap",
                    selectedAttemptIndex === idx
                      ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-200"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                  )}
                >
                  {item.is_approved ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span>Attempt {item.attempt}</span>
                  <span className="text-[10px] text-slate-400">({item.word_count}w)</span>
                </button>
              ))}
            </div>

            {/* Selected Attempt Detail */}
            {selectedAttemptIndex !== null && history[selectedAttemptIndex] && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Attempt {history[selectedAttemptIndex].attempt} Verdict:
                    </span>
                    <Badge
                      variant={
                        history[selectedAttemptIndex].is_approved
                          ? "success"
                          : "destructive"
                      }
                      className="text-[11px] font-bold"
                    >
                      {history[selectedAttemptIndex].verdict}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {history[selectedAttemptIndex].word_count} words
                  </span>
                </div>

                {/* Reviewer Feedback Box */}
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-indigo-500" />
                    Reviewer Assessment:
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                    {history[selectedAttemptIndex].feedback}
                  </p>
                </div>

                {/* Draft snapshot expandable */}
                <details className="text-xs group">
                  <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 select-none">
                    <FileText className="h-3.5 w-3.5" />
                    <span>View Draft Snapshot for Attempt {history[selectedAttemptIndex].attempt}</span>
                  </summary>
                  <div className="mt-2.5 rounded-lg border border-slate-200 bg-white p-3 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    {history[selectedAttemptIndex].draft}
                  </div>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
