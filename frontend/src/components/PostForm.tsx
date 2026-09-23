"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Globe,
  Users,
  MessageCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Square,
  Flame,
} from "lucide-react";
import { GeneratePayload } from "@/lib/api";

interface PostFormProps {
  onSubmit: (payload: GeneratePayload) => void;
  onStop: () => void;
  isGenerating: boolean;
  serverTavilyConfigured: boolean;
  customGroqKey: string;
  customTavilyKey: string;
  selectedModel: string;
}

const TOPIC_SUGGESTIONS = [
  "Why AI coding agents won't replace software engineers",
  "Hard lessons learned scaling a team from 5 to 25",
  "The death of cold LinkedIn outreach and what works now",
  "Why simple architecture beats clever complexity every time",
  "How to run high-leverage 1-on-1 meetings as an engineering manager",
];

const TONES = [
  { id: "Thought Leadership", label: "Thought Leadership", desc: "Authoritative, insightful, visionary" },
  { id: "Storytelling", label: "Storytelling", desc: "Narrative, relatable, personal" },
  { id: "Punchy & Contrarian", label: "Punchy & Contrarian", desc: "Bold, scroll-stopping hooks, high conviction" },
  { id: "Educational Breakdown", label: "Educational Breakdown", desc: "Frameworks, bulleted insights, actionable tips" },
  { id: "Casual & Conversational", label: "Casual & Conversational", desc: "Friendly, accessible, community-driven" },
];

export function PostForm({
  onSubmit,
  onStop,
  isGenerating,
  serverTavilyConfigured,
  customGroqKey,
  customTavilyKey,
  selectedModel,
}: PostFormProps) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Thought Leadership");
  const [audience, setAudience] = useState("Tech Leaders & Founders");
  const [useSearch, setUseSearch] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [customInstructions, setCustomInstructions] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isGenerating) return;

    onSubmit({
      topic: topic.trim(),
      tone,
      audience: audience.trim(),
      custom_instructions: customInstructions.trim(),
      use_search: useSearch,
      max_attempts: maxAttempts,
      model_name: selectedModel,
      groq_api_key: customGroqKey || undefined,
      tavily_api_key: customTavilyKey || undefined,
    });
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setTopic(suggestion);
  };

  return (
    <Card className="border-slate-200/90 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="pb-4 pt-5 px-5">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          Create New Post
        </CardTitle>
        <CardDescription className="text-xs">
          Provide a topic and let our Groq agent draft and refine your LinkedIn post.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Topic Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Topic or Angle <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Why senior engineers prioritize simplicity over clever architecture..."
              className="min-h-[85px] text-sm resize-none"
              disabled={isGenerating}
            />

            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Flame className="h-3 w-3 text-amber-500" /> Try a trending topic:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TOPIC_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    disabled={isGenerating}
                    className="rounded-md border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-blue-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-blue-600" />
              Tone & Voice
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={isGenerating}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              {TONES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} — {t.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Target Audience */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-600" />
              Target Audience
            </label>
            <Input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g., Early-stage founders, B2B sales reps, Senior engineers"
              disabled={isGenerating}
              className="text-xs h-9"
            />
          </div>

          {/* Tavily Web Search Toggle */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Tavily Web Search
                    </span>
                    {serverTavilyConfigured || customTavilyKey ? (
                      <Badge variant="outline" className="text-[10px] py-0 border-emerald-300 text-emerald-600">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] py-0 text-slate-400">
                        No Key
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Writer gathers fresh real-time facts before drafting.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={useSearch}
                onChange={(e) => setUseSearch(e.target.checked)}
                disabled={isGenerating}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Advanced collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <Sliders className="h-3 w-3" />
              <span>{showAdvanced ? "Hide Advanced Settings" : "Show Advanced Options"}</span>
              {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Max Review/Revision Attempts: {maxAttempts}
                    </label>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                    disabled={isGenerating}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 attempt</span>
                    <span>3 (recommended)</span>
                    <span>5 attempts</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Custom Rules & Constraints
                  </label>
                  <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g., Mention a specific metric, avoid technical jargon, focus on remote work culture..."
                    rows={2}
                    className="text-xs resize-none"
                    disabled={isGenerating}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit / Stop Buttons */}
          <div className="pt-2">
            {isGenerating ? (
              <Button
                type="button"
                variant="destructive"
                onClick={onStop}
                className="w-full font-semibold gap-2"
              >
                <Square className="h-4 w-4" /> Stop Generation
              </Button>
            ) : (
              <Button
                type="submit"
                variant="brand"
                disabled={!topic.trim()}
                className="w-full font-semibold gap-2 shadow-lg shadow-blue-500/20"
              >
                <Sparkles className="h-4 w-4" /> Generate LinkedIn Post
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
