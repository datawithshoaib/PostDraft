"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { SettingsModal } from "@/components/SettingsModal";
import { PostForm } from "@/components/PostForm";
import { AgentStepper, AgentStepType } from "@/components/AgentStepper";
import { LinkedInPreview } from "@/components/LinkedInPreview";
import { ReviewerPanel } from "@/components/ReviewerPanel";
import {
  fetchConfig,
  generatePost,
  streamPostGeneration,
  GeneratePayload,
  AttemptHistoryItem,
} from "@/lib/api";

export default function Home() {
  // Backend & Config state
  const [backendConnected, setBackendConnected] = useState(false);
  const [serverGroqConfigured, setServerGroqConfigured] = useState(false);
  const [serverTavilyConfigured, setServerTavilyConfigured] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [customGroqKey, setCustomGroqKey] = useState("");
  const [customTavilyKey, setCustomTavilyKey] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Agent State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<AgentStepType>("idle");
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [draft, setDraft] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [history, setHistory] = useState<AttemptHistoryItem[]>([]);

  const stopStreamRef = useRef<(() => void) | null>(null);

  // Load saved preferences & check backend connection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedGroq = localStorage.getItem("postdraft_groq_key") || "";
      const savedTavily = localStorage.getItem("postdraft_tavily_key") || "";
      const savedModel = localStorage.getItem("postdraft_model") || "llama-3.3-70b-versatile";

      if (savedGroq) setCustomGroqKey(savedGroq);
      if (savedTavily) setCustomTavilyKey(savedTavily);
      if (savedModel) setSelectedModel(savedModel);
    }

    const checkBackend = async () => {
      try {
        const config = await fetchConfig();
        setBackendConnected(true);
        setServerGroqConfigured(config.groq_configured);
        setServerTavilyConfigured(config.tavily_configured);
        if (config.available_models?.length) {
          setAvailableModels(config.available_models);
        }
        if (config.default_model && !localStorage.getItem("postdraft_model")) {
          setSelectedModel(config.default_model);
        }
      } catch (e) {
        console.warn("Backend not yet connected:", e);
        setBackendConnected(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStartGeneration = (payload: GeneratePayload) => {
    setIsGenerating(true);
    setError(null);
    setDraft("");
    setIsApproved(false);
    setHistory([]);
    setCurrentAttempt(1);
    setMaxAttempts(payload.max_attempts || 3);
    setCurrentStep("drafting");
    setStatusMessage("Connecting to LangGraph agent on Groq...");

    // Try SSE streaming first
    const stopFn = streamPostGeneration(
      payload,
      (event: any) => {
        if (event.event === "start") {
          setCurrentStep("drafting");
          setStatusMessage("Groq agent started drafting...");
        } else if (event.event === "step") {
          if (event.step === "researching") {
            setCurrentStep("researching");
            setStatusMessage(event.status);
            setCurrentAttempt(event.attempt);
          } else if (event.step === "drafting") {
            setCurrentStep("drafting");
            setStatusMessage(event.status);
            setCurrentAttempt(event.attempt);
          } else if (event.step === "research_complete") {
            setStatusMessage(event.status);
          }
        } else if (event.event === "draft_extracted") {
          setDraft(event.draft);
          setCurrentStep("reviewing");
          setStatusMessage(`Draft ${event.attempt} created (${event.word_count} words). Reviewer checking 7 criteria...`);
        } else if (event.event === "review_verdict") {
          setIsApproved(event.is_approved);
          if (event.history) {
            setHistory(event.history);
          }
          if (event.is_approved) {
            setCurrentStep("approved");
            setStatusMessage(`Post APPROVED by reviewer on Attempt ${event.attempt}!`);
          } else {
            setCurrentStep("revising");
            setStatusMessage(`Attempt ${event.attempt} rejected by reviewer. Revising draft...`);
          }
        } else if (event.event === "complete") {
          setDraft(event.draft);
          setIsApproved(event.is_approved);
          if (event.history) setHistory(event.history);
          setIsGenerating(false);
          if (event.is_approved) {
            setCurrentStep("approved");
            setStatusMessage("Post approved and ready to publish!");
          } else {
            setCurrentStep("rejected_max");
            setStatusMessage(`Finished maximum ${event.attempts} attempts.`);
          }
        } else if (event.event === "error") {
          setError(event.message);
          setCurrentStep("error");
          setIsGenerating(false);
        }
      },
      async (err: Error) => {
        console.warn("Stream error, falling back to sync generation:", err);
        // Fallback to sync endpoint
        try {
          setStatusMessage("Stream disconnected, running generation via REST endpoint...");
          const res = await generatePost(payload);
          if (res.success) {
            setDraft(res.draft);
            setIsApproved(res.is_approved);
            setHistory(res.history);
            setCurrentAttempt(res.attempts);
            setCurrentStep(res.is_approved ? "approved" : "rejected_max");
            setStatusMessage(
              res.is_approved
                ? "Post approved and ready to publish!"
                : `Completed ${res.attempts} attempts.`
            );
          } else {
            setError(res.error || "Generation failed.");
            setCurrentStep("error");
          }
        } catch (syncErr: any) {
          setError(syncErr.message || "Failed to generate post.");
          setCurrentStep("error");
        } finally {
          setIsGenerating(false);
        }
      },
      () => {
        setIsGenerating(false);
      }
    );

    stopStreamRef.current = stopFn;
  };

  const handleStop = () => {
    if (stopStreamRef.current) {
      stopStreamRef.current();
      stopStreamRef.current = null;
    }
    setIsGenerating(false);
    setStatusMessage("Generation stopped by user.");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100 flex flex-col font-sans">
      {/* Navbar Header */}
      <Header
        backendConnected={backendConnected}
        groqConfigured={serverGroqConfigured || Boolean(customGroqKey)}
        selectedModel={selectedModel}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Visual Multi-Agent Workflow Stepper */}
        {currentStep !== "idle" && (
          <AgentStepper
            currentStep={currentStep}
            currentAttempt={currentAttempt}
            maxAttempts={maxAttempts}
            statusMessage={statusMessage}
            isStreaming={isGenerating}
            error={error}
          />
        )}

        {/* 2-Column Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Controls (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            <PostForm
              onSubmit={handleStartGeneration}
              onStop={handleStop}
              isGenerating={isGenerating}
              serverTavilyConfigured={serverTavilyConfigured}
              customGroqKey={customGroqKey}
              customTavilyKey={customTavilyKey}
              selectedModel={selectedModel}
            />

            {/* Editorial Rubric scorecard always visible */}
            <ReviewerPanel
              history={history}
              isApproved={isApproved}
              activeDraft={draft}
            />
          </div>

          {/* Right Column: LinkedIn Post Card & Live Output (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            <LinkedInPreview
              draft={draft}
              isApproved={isApproved}
              attempt={currentAttempt}
              isGenerating={isGenerating}
              onDraftChange={(newDraft) => setDraft(newDraft)}
            />
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        groqKey={customGroqKey}
        setGroqKey={setCustomGroqKey}
        tavilyKey={customTavilyKey}
        setTavilyKey={setCustomTavilyKey}
        model={selectedModel}
        setModel={setSelectedModel}
        availableModels={availableModels}
        serverGroqConfigured={serverGroqConfigured}
        serverTavilyConfigured={serverTavilyConfigured}
      />
    </div>
  );
}
