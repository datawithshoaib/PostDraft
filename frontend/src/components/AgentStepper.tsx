"use client";

import React from "react";
import { Search, PenTool, ClipboardCheck, RefreshCw, CheckCircle2, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgentStepType = "idle" | "researching" | "drafting" | "reviewing" | "revising" | "approved" | "rejected_max" | "error";

interface AgentStepperProps {
  currentStep: AgentStepType;
  currentAttempt: number;
  maxAttempts: number;
  statusMessage: string;
  isStreaming: boolean;
  error?: string | null;
}

export function AgentStepper({
  currentStep,
  currentAttempt,
  maxAttempts,
  statusMessage,
  isStreaming,
  error,
}: AgentStepperProps) {
  if (currentStep === "idle") return null;

  const steps = [
    {
      id: "researching",
      label: "Live Research",
      icon: Search,
      sub: "Tavily Search Tool",
    },
    {
      id: "drafting",
      label: "Writer LLM",
      icon: PenTool,
      sub: "Groq Generation",
    },
    {
      id: "reviewing",
      label: "Strict Reviewer",
      icon: ClipboardCheck,
      sub: "7 Quality Gates",
    },
    {
      id: "revising",
      label: "Revision Loop",
      icon: RefreshCw,
      sub: `Attempt ${currentAttempt}/${maxAttempts}`,
    },
    {
      id: "approved",
      label: "Publication Ready",
      icon: CheckCircle2,
      sub: "Approved Post",
    },
  ];

  const getStepStatus = (stepId: string) => {
    if (error && currentStep === "error") return "error";

    if (currentStep === "approved") return "completed";
    if (currentStep === "rejected_max" && stepId !== "approved") return "completed";

    if (stepId === "researching") {
      if (currentStep === "researching") return "active";
      return "completed";
    }

    if (stepId === "drafting") {
      if (currentStep === "drafting") return "active";
      if (["reviewing", "revising", "approved", "rejected_max"].includes(currentStep)) return "completed";
      return "pending";
    }

    if (stepId === "reviewing") {
      if (currentStep === "reviewing") return "active";
      if (["revising", "approved", "rejected_max"].includes(currentStep)) return "completed";
      return "pending";
    }

    if (stepId === "revising") {
      if (currentStep === "revising") return "active";
      if (["approved", "rejected_max"].includes(currentStep) && currentAttempt > 1) return "completed";
      return "pending";
    }

    if (stepId === "approved") {
      return "pending";
    }

    return "pending";
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center space-x-2">
          <div className="relative flex h-3 w-3">
            {isStreaming && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            )}
            <span
              className={cn(
                "relative inline-flex rounded-full h-3 w-3",
                error
                  ? "bg-red-500"
                  : currentStep === "approved"
                  ? "bg-emerald-500"
                  : isStreaming
                  ? "bg-blue-600"
                  : "bg-slate-400"
              )}
            ></span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            LangGraph Multi-Agent Workflow
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Attempt {Math.max(1, currentAttempt)} of {maxAttempts}</span>
        </div>
      </div>

      {/* Stepper Graph */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={cn(
                "relative flex flex-col items-center text-center p-3 rounded-xl border transition-all duration-300",
                status === "active" &&
                  "border-blue-500/80 bg-blue-50/70 shadow-sm shadow-blue-500/10 dark:border-blue-500/50 dark:bg-blue-950/40",
                status === "completed" &&
                  "border-emerald-500/40 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-950/20",
                status === "pending" &&
                  "border-slate-200/60 bg-white/50 opacity-60 dark:border-slate-800/60 dark:bg-slate-900/40",
                status === "error" &&
                  "border-red-500/50 bg-red-50/50 dark:border-red-500/30 dark:bg-red-950/20"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg mb-2 transition-colors",
                  status === "active" && "bg-blue-600 text-white animate-pulse",
                  status === "completed" && "bg-emerald-600 text-white",
                  status === "pending" && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                  status === "error" && "bg-red-600 text-white"
                )}
              >
                <Icon className={cn("h-4 w-4", status === "active" && step.id === "revising" && "animate-spin")} />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {step.label}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {step.sub}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live Status Message Banner */}
      <div
        className={cn(
          "mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-medium border",
          error
            ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            : currentStep === "approved"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
            : "border-blue-100 bg-blue-50/80 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
        )}
      >
        {error ? (
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
        ) : currentStep === "approved" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        ) : (
          <Sparkles className="h-4 w-4 text-blue-600 shrink-0 animate-spin" />
        )}
        <span className="truncate">{error || statusMessage}</span>
      </div>
    </div>
  );
}
