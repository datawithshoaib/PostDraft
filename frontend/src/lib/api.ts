export interface GeneratePayload {
  topic: string;
  tone?: string;
  audience?: string;
  custom_instructions?: string;
  use_search?: boolean;
  groq_api_key?: string;
  tavily_api_key?: string;
  model_name?: string;
  max_attempts?: number;
}

export interface AttemptHistoryItem {
  attempt: number;
  draft: string;
  is_approved: boolean;
  verdict: string;
  feedback: string;
  word_count: number;
}

export interface GenerateResponse {
  success: boolean;
  draft: string;
  is_approved: boolean;
  attempts: number;
  history: AttemptHistoryItem[];
  error?: string;
}

export interface ConfigStatus {
  groq_configured: boolean;
  tavily_configured: boolean;
  default_model: string;
  available_models: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchConfig(): Promise<ConfigStatus> {
  const res = await fetch(`${API_BASE}/api/config`);
  if (!res.ok) {
    throw new Error(`Failed to load server config: ${res.statusText}`);
  }
  return res.json();
}

export async function generatePost(payload: GeneratePayload): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || `Generation failed with status ${res.status}`);
  }

  return res.json();
}

export function streamPostGeneration(
  payload: GeneratePayload,
  onEvent: (event: any) => void,
  onError: (err: Error) => void,
  onFinish: () => void
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/generate/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `Streaming failed with status ${res.status}`);
      }

      if (!res.body) {
        throw new Error("ReadableStream not supported on this response.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.replace("data:", "").trim();
            if (jsonStr) {
              try {
                const parsed = JSON.parse(jsonStr);
                onEvent(parsed);
              } catch (parseErr) {
                console.warn("Failed to parse SSE line:", jsonStr);
              }
            }
          }
        }
      }

      if (buffer.trim().startsWith("data:")) {
        try {
          const parsed = JSON.parse(buffer.trim().replace("data:", "").trim());
          onEvent(parsed);
        } catch {
          // ignore trailing
        }
      }

      onFinish();
    } catch (err: any) {
      if (err.name !== "AbortError") {
        onError(err);
      }
    }
  })();

  return () => {
    controller.abort();
  };
}
