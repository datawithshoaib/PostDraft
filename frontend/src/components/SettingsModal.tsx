"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key, Globe, Cpu, Check, AlertCircle } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groqKey: string;
  setGroqKey: (key: string) => void;
  tavilyKey: string;
  setTavilyKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  availableModels: string[];
  serverGroqConfigured: boolean;
  serverTavilyConfigured: boolean;
}

export function SettingsModal({
  isOpen,
  onClose,
  groqKey,
  setGroqKey,
  tavilyKey,
  setTavilyKey,
  model,
  setModel,
  availableModels,
  serverGroqConfigured,
  serverTavilyConfigured,
}: SettingsModalProps) {
  const [localGroq, setLocalGroq] = useState(groqKey);
  const [localTavily, setLocalTavily] = useState(tavilyKey);
  const [localModel, setLocalModel] = useState(model);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setGroqKey(localGroq);
    setTavilyKey(localTavily);
    setModel(localModel);
    
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("postdraft_groq_key", localGroq);
      localStorage.setItem("postdraft_tavily_key", localTavily);
      localStorage.setItem("postdraft_model", localModel);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agent & API Configuration"
      description="Configure your Groq LLM model and optional Tavily search API key."
    >
      <div className="space-y-4 py-2">
        {/* Groq Model Selector */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-blue-600" />
            Groq LLM Model
          </label>
          <select
            value={localModel}
            onChange={(e) => setLocalModel(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
            {availableModels.length > 0 ? (
              availableModels.map((m) => (
                <option key={m} value={m}>
                  {m} {m === "llama-3.3-70b-versatile" ? "(Recommended)" : ""}
                </option>
              ))
            ) : (
              <>
                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fastest)</option>
                <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
              </>
            )}
          </select>
          <p className="text-[11px] text-slate-500">
            Powered by Groq's LPUs for ultra-low latency inference and native tool calling.
          </p>
        </div>

        {/* Groq API Key */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Key className="h-3.5 w-3.5 text-amber-500" />
              Groq API Key
            </label>
            {serverGroqConfigured && (
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <Check className="h-3 w-3" /> Configured in backend .env
              </span>
            )}
          </div>
          <Input
            type="password"
            placeholder={serverGroqConfigured ? "Using backend key (leave empty or override)" : "gsk_..."}
            value={localGroq}
            onChange={(e) => setLocalGroq(e.target.value)}
          />
          <p className="text-[11px] text-slate-500">
            Get a free Groq API key from{" "}
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              console.groq.com
            </a>
          </p>
        </div>

        {/* Tavily API Key */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Globe className="h-3.5 w-3.5 text-indigo-500" />
              Tavily Search API Key (Optional)
            </label>
            {serverTavilyConfigured && (
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <Check className="h-3 w-3" /> Configured in backend .env
              </span>
            )}
          </div>
          <Input
            type="password"
            placeholder={serverTavilyConfigured ? "Using backend key (leave empty or override)" : "tvly-..."}
            value={localTavily}
            onChange={(e) => setLocalTavily(e.target.value)}
          />
          <p className="text-[11px] text-slate-500">
            Used for real-time web search. If omitted, the writer uses its pre-trained knowledge.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5">
            {savedSuccess ? (
              <>
                <Check className="h-4 w-4" /> Saved!
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
