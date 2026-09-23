"use client";

import React from "react";
import { Sparkles, Settings2, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  backendConnected: boolean;
  groqConfigured: boolean;
  selectedModel: string;
  onOpenSettings: () => void;
}

export function Header({
  backendConnected,
  groqConfigured,
  selectedModel,
  onOpenSettings,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0a66c2] to-[#004182] text-white shadow-md shadow-blue-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                PostDraft
              </h1>
              <Badge variant="secondary" className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                v2.0 • Groq
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Agentic LinkedIn Post Generator & Strict Editorial Reviewer
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Backend Connection status */}
          <div className="hidden sm:flex items-center space-x-2 text-xs">
            {backendConnected ? (
              <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Backend Live
              </span>
            ) : (
              <span className="flex items-center text-amber-600 dark:text-amber-400 font-medium">
                <AlertCircle className="mr-1 h-3.5 w-3.5" />
                Backend Offline
              </span>
            )}
          </div>

          {/* Groq Model Badge */}
          <div className="hidden md:flex items-center">
            <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2.5 font-mono text-xs border-slate-300 dark:border-slate-700">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>{selectedModel}</span>
            </Badge>
          </div>

          {/* Settings Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Settings2 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
