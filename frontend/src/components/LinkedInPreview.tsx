"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Send,
  Copy,
  Check,
  Globe,
  Edit3,
  CheckCheck,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkedInPreviewProps {
  draft: string;
  isApproved: boolean;
  attempt: number;
  isGenerating: boolean;
  onDraftChange?: (newDraft: string) => void;
}

export function LinkedInPreview({
  draft,
  isApproved,
  attempt,
  isGenerating,
  onDraftChange,
}: LinkedInPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState(draft);

  // Sync draft
  React.useEffect(() => {
    setEditableText(draft);
  }, [draft]);

  const handleCopy = () => {
    const textToCopy = isEditing ? editableText : draft;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    if (onDraftChange) {
      onDraftChange(editableText);
    }
  };

  const wordCount = (isEditing ? editableText : draft)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const isWordCountOptimal = wordCount >= 140 && wordCount <= 220;

  return (
    <div className="space-y-3">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            LinkedIn Post Preview
          </h3>
          {draft && (
            <Badge
              variant={isApproved ? "success" : "secondary"}
              className="text-[11px] font-semibold"
            >
              {isApproved ? "✓ Editorial Approved" : `Attempt ${attempt}`}
            </Badge>
          )}
        </div>

        {draft && (
          <div className="flex items-center space-x-2">
            {/* Word Count Badge */}
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-mono font-medium",
                isWordCountOptimal
                  ? "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                  : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"
              )}
            >
              {wordCount} words {isWordCountOptimal && "(Optimal)"}
            </Badge>

            {/* Edit Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isEditing) handleSaveEdit();
                else setIsEditing(true);
              }}
              className="h-8 text-xs gap-1 border-slate-300 dark:border-slate-700"
            >
              {isEditing ? (
                <>
                  <CheckCheck className="h-3.5 w-3.5 text-blue-600" /> Save
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" /> Edit
                </>
              )}
            </Button>

            {/* Copy Button */}
            <Button
              size="sm"
              onClick={handleCopy}
              disabled={!draft}
              className={cn(
                "h-8 text-xs font-medium gap-1.5 transition-all shadow-sm",
                copied
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-[#0a66c2] hover:bg-[#004182] text-white"
              )}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy Post
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* LinkedIn Post Card */}
      <Card className="overflow-hidden border-slate-200/90 shadow-md transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-0">
          {/* Post Header (User Profile) */}
          <div className="flex items-start justify-between p-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 font-bold text-white shadow-inner text-base">
                PD
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:underline cursor-pointer">
                    Your Name
                  </span>
                  <span className="text-xs text-slate-400">• 1st</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  Founder & Tech Leader • Exploring AI, Systems & Engineering Growth
                </p>
                <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-0.5">
                  <span>Just now</span>
                  <span>•</span>
                  <Globe className="h-3 w-3 inline text-slate-400" />
                </div>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Post Content Body */}
          <div className="p-5">
            {isEditing ? (
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-blue-400 bg-white p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-500 dark:bg-slate-950 dark:text-slate-100 font-sans leading-relaxed"
                placeholder="Edit your post draft here..."
              />
            ) : draft ? (
              <div className="whitespace-pre-wrap font-sans text-[14.5px] leading-relaxed text-slate-900 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-950 dark:selection:text-blue-200">
                {draft}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-slate-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-3 dark:bg-slate-800/80">
                  <Edit3 className="h-7 w-7 text-slate-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Ready to draft your LinkedIn post
                </h4>
                <p className="text-xs max-w-sm mt-1 text-slate-500 dark:text-slate-400">
                  Enter your topic on the left and click <strong>Generate Post</strong>. Groq will draft, review against editorial standards, and iterate automatically.
                </p>
              </div>
            )}
          </div>

          {/* Engagement Mock Metrics */}
          {draft && (
            <>
              <div className="flex items-center justify-between px-5 py-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center space-x-1">
                  <span className="flex -space-x-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] text-white">
                      👍
                    </span>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white">
                      ❤️
                    </span>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] text-white">
                      💡
                    </span>
                  </span>
                  <span className="ml-1 text-[11px]">348 reactions</span>
                </div>
                <div className="text-[11px] space-x-2">
                  <span>52 comments</span>
                  <span>•</span>
                  <span>14 reposts</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 border-t border-slate-100 dark:border-slate-800/80 p-1">
                <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                  <ThumbsUp className="h-4 w-4" />
                  <span>Like</span>
                </button>
                <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                  <MessageSquare className="h-4 w-4" />
                  <span>Comment</span>
                </button>
                <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                  <Repeat2 className="h-4 w-4" />
                  <span>Repost</span>
                </button>
                <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
