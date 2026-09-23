# PostDraft

**PostDraft** is an agentic AI LinkedIn post generator and automated editorial reviewer. Built with **LangGraph**, **Groq** (`llama-3.3-70b-versatile`), a **FastAPI** backend, and a modern **Next.js** + **shadcn/ui** frontend.

It drafts LinkedIn posts, gathers real-time search context using Tavily when needed, evaluates drafts against a strict 7-point editorial checklist, and iterates through up to 3-5 revisions until publish-ready.

---

## Key Features

- ⚡ **100% OpenAI-free**: Powered entirely by **LangChain Groq** (`ChatGroq`) using ultra-fast models such as `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`.
- 🔄 **LangGraph Multi-Agent Architecture**:
  - **Writer Agent**: Composes high-performing posts tailored to your selected tone, audience, and custom constraints.
  - **Tavily Search Tool**: Integrates real-time web search for fresh facts, statistics, and industry news.
  - **Editorial Reviewer Agent**: Evaluates drafts strictly against the 7 LinkedIn quality criteria:
    1. Scroll-stopping hook in first 1–2 lines
    2. One clear, valuable takeaway
    3. High skimmability (short paragraphs, 1–3 sentences each)
    4. Optimal length (~150–200 words)
    5. Engaging closing question or CTA
    6. Authentic, human voice (no robotic AI fluff)
    7. Zero hashtags
  - **Automated Revision Loop**: If rejected, the reviewer provides constructive feedback and the writer creates an improved draft fixing every issue.
- 🚀 **FastAPI Backend**:
  - Full REST API + Server-Sent Events (SSE) streaming for real-time progress updates.
  - Interactive Swagger API documentation at `/docs`.
- 🎨 **Next.js & shadcn/ui Frontend**:
  - Authentic LinkedIn desktop post preview with realistic formatting and social metrics.
  - Live agent stepper visualizing graph execution (Research → Writer → Reviewer → Revisions → Approved).
  - Reviewer rubric scorecard and attempt revision history with exact critique notes.
  - One-click copy, word count sweet spot indicator, and inline editing.
  - In-app API key and model configuration modal.

---

## Tech Stack

- **LLM Engine**: [Groq](https://groq.com/) via `langchain-groq` (`llama-3.3-70b-versatile`)
- **Agent Orchestration**: [LangGraph](https://github.com/langchain-ai/langgraph)
- **Backend**: FastAPI, Uvicorn, Pydantic, SSE Starlette
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui design system, Lucide Icons

---

## Quickstart Guide

### 🚀 One-Command Launch (Recommended)

Start both the FastAPI backend and Next.js frontend together with a single command:

```powershell
python run.py
```

This starts:
- **FastAPI Backend**: `http://127.0.0.1:8000` (Docs: `http://127.0.0.1:8000/docs`)
- **Next.js Web UI**: `http://localhost:3000`

---

### Manual Setup & Step-by-Step Launch

#### 1. Backend Setup

1. Create and activate a Python virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install backend dependencies:

```powershell
pip install -r requirements.txt
```

3. Configure your environment variables in `.env`:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
TAVILY_API_KEY=tvly_your_tavily_key_optional
GROQ_MODEL=llama-3.3-70b-versatile
```

> **Note**: A free Groq API key can be obtained from [Groq Console](https://console.groq.com/keys). Tavily search is optional; if omitted, the writer generates drafts without web search.

4. Start the FastAPI backend server:

```powershell
python -m uvicorn backend.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

1. Open a new terminal in the `frontend` folder:

```powershell
cd frontend
npm install
```

2. Run the Next.js development server:

```powershell
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 3. Running via CLI (Optional)

You can also run PostDraft directly in your terminal:

```powershell
python main.py --cli
```

Or start the FastAPI server via the CLI entrypoint:

```powershell
python main.py --server
```

---

## API Reference

### `GET /api/config`
Returns configured services and available Groq models.

### `POST /api/generate`
Generates a post synchronously.

**Request Body:**
```json
{
  "topic": "Why simple architecture beats clever complexity",
  "tone": "Thought Leadership",
  "audience": "Tech Leaders & Engineers",
  "custom_instructions": "Focus on real-world maintenance cost",
  "use_search": true,
  "max_attempts": 3,
  "model_name": "llama-3.3-70b-versatile"
}
```

### `POST /api/generate/stream`
Streams agent events via Server-Sent Events (SSE) in real time.