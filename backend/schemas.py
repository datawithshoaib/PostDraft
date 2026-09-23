from typing import Optional, List
from pydantic import BaseModel, Field

class GenerateRequest(BaseModel):
    topic: str = Field(..., description="Topic or subject for the LinkedIn post")
    tone: Optional[str] = Field("Thought Leadership", description="Tone of the post")
    audience: Optional[str] = Field("Industry Professionals", description="Target audience")
    custom_instructions: Optional[str] = Field("", description="Any special guidelines or constraints")
    use_search: Optional[bool] = Field(True, description="Whether to use Tavily web search for fresh context")
    groq_api_key: Optional[str] = Field(None, description="Optional override for Groq API key")
    tavily_api_key: Optional[str] = Field(None, description="Optional override for Tavily API key")
    model_name: Optional[str] = Field("llama-3.3-70b-versatile", description="Groq model to use")
    max_attempts: Optional[int] = Field(3, ge=1, le=5, description="Maximum review/revision attempts")

class AttemptHistoryItem(BaseModel):
    attempt: int
    draft: str
    is_approved: bool
    verdict: str
    feedback: str
    word_count: int

class GenerateResponse(BaseModel):
    success: bool
    draft: str
    is_approved: bool
    attempts: int
    history: List[AttemptHistoryItem] = []
    error: Optional[str] = None

class ConfigStatusResponse(BaseModel):
    groq_configured: bool
    tavily_configured: bool
    default_model: str
    available_models: List[str]
