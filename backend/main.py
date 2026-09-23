import json
import asyncio
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from backend.config import GROQ_API_KEY, TAVILY_API_KEY, DEFAULT_GROQ_MODEL, AVAILABLE_MODELS
from backend.schemas import GenerateRequest, GenerateResponse, ConfigStatusResponse
from backend.agent import run_agent_sync, run_agent_generator

app = FastAPI(
    title="PostDraft API",
    description="Agentic LinkedIn Post Generator & Reviewer powered by LangGraph and Groq",
    version="2.0.0"
)

# Configure CORS for local development and frontend deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "PostDraft API is running",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "postdraft-backend"}

@app.get("/api/config", response_model=ConfigStatusResponse)
def get_config():
    return ConfigStatusResponse(
        groq_configured=bool(GROQ_API_KEY),
        tavily_configured=bool(TAVILY_API_KEY),
        default_model=DEFAULT_GROQ_MODEL,
        available_models=AVAILABLE_MODELS
    )

@app.post("/api/generate", response_model=GenerateResponse)
async def generate_post(request: GenerateRequest):
    try:
        response = run_agent_sync(request)
        if not response.success and response.error:
            raise HTTPException(status_code=400, detail=response.error)
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate/stream")
async def generate_post_stream(request: GenerateRequest):
    async def event_generator():
        try:
            async for event_data in run_agent_generator(request):
                yield f"data: {json.dumps(event_data)}\n\n"
                # brief sleep to allow buffer flushing
                await asyncio.sleep(0.01)
        except Exception as e:
            error_payload = {"event": "error", "message": str(e)}
            yield f"data: {json.dumps(error_payload)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
