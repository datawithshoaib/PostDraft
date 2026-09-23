import os
from typing import TypedDict, Annotated, List, Dict, Any, AsyncGenerator
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_groq import ChatGroq
from langchain_tavily import TavilySearch
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from backend.config import GROQ_API_KEY, TAVILY_API_KEY, DEFAULT_GROQ_MODEL
from backend.schemas import GenerateRequest, GenerateResponse, AttemptHistoryItem

class AgentState(TypedDict):
    topic: str
    tone: str
    audience: str
    custom_instructions: str
    use_search: bool
    max_attempts: int
    attempt: int
    messages: Annotated[list, add_messages]
    draft: str
    review_feedback: str
    is_approved: bool
    history: list

WRITER_SYSTEM_PROMPT_TEMPLATE = (
    "You are an expert LinkedIn content writer and ghostwriter. Your job is to write "
    "engaging, high-performing, professional LinkedIn posts about the given topic.\n"
    "Tone style: {tone}\n"
    "Target audience: {audience}\n"
    "{custom_instructions_block}\n"
    "If the topic requires up-to-date information, statistics, or current trends, "
    "use the web search tool to gather fresh context before writing.\n"
    "If you have already received feedback on a previous draft, carefully address every "
    "point in the new draft.\n\n"
    "Essential rules for great LinkedIn posts:\n"
    "1. Strong, captivating hook in the first 1-2 lines (no clickbait, but scroll-stopping).\n"
    "2. Exactly 1 clear, valuable takeaway or thesis.\n"
    "3. Easy to skim with clean white space and short paragraphs (1-3 sentences each).\n"
    "4. Length: roughly 150–200 words.\n"
    "5. Ends with an engaging question or call-to-action to invite discussion in the comments.\n"
    "6. Professional, authentic, human voice — avoid corporate buzzwords and robotic phrases.\n"
    "7. DO NOT use hashtags.\n"
    "8. Output ONLY the LinkedIn post text. Do not include introductory remarks like 'Here is your post:' or meta-commentary."
)

REVIEWER_SYSTEM_PROMPT = (
    "You are a strict, senior LinkedIn editorial reviewer. You judge whether a "
    "post is publish-ready and meets high standards for engagement and clarity.\n\n"
    "Evaluate strictly against these 7 criteria:\n"
    "1. Strong hook in the first line\n"
    "2. One clear, valuable takeaway\n"
    "3. Easy to skim — uses short paragraphs and good spacing\n"
    "4. Roughly 150-200 words\n"
    "5. Ends with an engaging question or call-to-action (CTA)\n"
    "6. Professional but human tone (not corporate-robotic or generic AI fluff)\n"
    "7. No hashtags\n\n"
    "You MUST respond in exactly this format:\n"
    "VERDICT: APPROVED or REJECTED\n"
    "FEEDBACK: <one concise paragraph explaining why it passed or what specific improvements must be made>\n\n"
    "Be strict but fair. Approve only if the post genuinely meets all 7 criteria. "
    "Reject if even one criterion is missing."
)


def create_agent_graph(groq_key: str, tavily_key: str = "", model_name: str = DEFAULT_GROQ_MODEL, enable_search: bool = True):
    if not groq_key:
        raise ValueError("GROQ_API_KEY is required to run the post generator.")

    # Initialize tools
    tools = []
    if enable_search and tavily_key:
        try:
            search_tool = TavilySearch(max_results=3, tavily_api_key=tavily_key)
            tools.append(search_tool)
        except Exception:
            pass

    # Writer LLM
    writer_llm = ChatGroq(
        model=model_name,
        temperature=0.7,
        groq_api_key=groq_key
    )

    if tools:
        writer_llm_runnable = writer_llm.bind_tools(tools)
    else:
        writer_llm_runnable = writer_llm

    # Reviewer LLM
    reviewer_llm = ChatGroq(
        model=model_name,
        temperature=0.2,
        groq_api_key=groq_key
    )

    # Nodes
    def writer_node(state: AgentState) -> dict:
        attempt = state.get("attempt", 0) + 1
        topic = state.get("topic", "")
        tone = state.get("tone", "Thought Leadership")
        audience = state.get("audience", "Industry Professionals")
        custom_instructions = state.get("custom_instructions", "")
        previous_feedback = state.get("review_feedback", "")

        custom_block = f"Additional constraints: {custom_instructions}" if custom_instructions else ""
        system_prompt = WRITER_SYSTEM_PROMPT_TEMPLATE.format(
            tone=tone,
            audience=audience,
            custom_instructions_block=custom_block
        )

        messages = [SystemMessage(content=system_prompt)]

        # If previous messages include tool responses, include message context
        existing_msgs = state.get("messages", [])
        if existing_msgs and attempt == state.get("attempt", 0):
            # Mid-turn tool followup
            messages.extend(existing_msgs)
        elif attempt == 1:
            user_prompt = f"Write a compelling LinkedIn post about: {topic}"
            if tools:
                user_prompt += ". If you need recent data, examples, or current context, search the web first."
            messages.append(HumanMessage(content=user_prompt))
        else:
            user_prompt = (
                f"Your previous draft on '{topic}' was rejected.\n\n"
                f"Reviewer Feedback:\n{previous_feedback}\n\n"
                f"Please write a fresh, improved LinkedIn post addressing every point in the feedback. "
                f"Ensure it strictly follows the rules (150-200 words, strong hook, no hashtags)."
            )
            messages.append(HumanMessage(content=user_prompt))

        response = writer_llm_runnable.invoke(messages)

        return {
            "messages": [messages[-1], response] if not (existing_msgs and attempt == state.get("attempt", 0)) else [response],
            "attempt": attempt
        }

    def extract_draft_node(state: AgentState) -> dict:
        messages = state.get("messages", [])
        last_message = messages[-1] if messages else None
        draft = last_message.content if last_message else ""
        # Clean up possible surrounding quotes or markdown code blocks
        if draft.startswith("```") and draft.endswith("```"):
            lines = draft.split("\n")
            if len(lines) > 2:
                draft = "\n".join(lines[1:-1]).strip()
        return {"draft": draft}

    def reviewer_node(state: AgentState) -> dict:
        draft = state.get("draft", "")
        review_prompt = (
            f"Review this LinkedIn post draft:\n\n"
            f"---\n{draft}\n---\n\n"
            f"Evaluate the draft against all 7 criteria and provide your VERDICT and FEEDBACK."
        )

        response = reviewer_llm.invoke([
            SystemMessage(content=REVIEWER_SYSTEM_PROMPT),
            HumanMessage(content=review_prompt)
        ])

        review_text = response.content.strip()
        verdict_part = review_text.split("FEEDBACK:")[0].upper()
        is_approved = "APPROVED" in verdict_part and "REJECTED" not in verdict_part

        if "FEEDBACK:" in review_text:
            feedback = review_text.split("FEEDBACK:", 1)[1].strip()
        else:
            feedback = review_text

        verdict = "APPROVED" if is_approved else "REJECTED"
        word_count = len(draft.split())

        history = list(state.get("history", []))
        history.append({
            "attempt": state.get("attempt", 1),
            "draft": draft,
            "is_approved": is_approved,
            "verdict": verdict,
            "feedback": feedback,
            "word_count": word_count
        })

        return {
            "review_feedback": feedback,
            "is_approved": is_approved,
            "history": history
        }

    # Routers
    def should_use_tool(state: AgentState):
        messages = state.get("messages", [])
        if messages:
            last_message = messages[-1]
            if getattr(last_message, "tool_calls", None) and len(last_message.tool_calls) > 0:
                return "tools"
        return "extract_draft"

    def should_stop_looping(state: AgentState):
        if state.get("is_approved", False):
            return END
        if state.get("attempt", 0) >= state.get("max_attempts", 3):
            return END
        return "writer"

    # Graph builder
    workflow = StateGraph(AgentState)
    workflow.add_node("writer", writer_node)
    workflow.add_node("extract_draft", extract_draft_node)
    workflow.add_node("reviewer", reviewer_node)

    if tools:
        tool_node = ToolNode(tools)
        workflow.add_node("tools", tool_node)
        # Conditional edge from writer: tools or extract_draft
        workflow.add_conditional_edges("writer", should_use_tool, {"tools": "tools", "extract_draft": "extract_draft"})
        # Tools routes back to writer so it can write the draft with search results
        workflow.add_edge("tools", "writer")
    else:
        workflow.add_edge("writer", "extract_draft")

    workflow.add_edge(START, "writer")
    workflow.add_edge("extract_draft", "reviewer")
    workflow.add_conditional_edges("reviewer", should_stop_looping, {END: END, "writer": "writer"})

    return workflow.compile()


async def run_agent_generator(request: GenerateRequest) -> AsyncGenerator[Dict[str, Any], None]:
    groq_key = request.groq_api_key or GROQ_API_KEY
    tavily_key = request.tavily_api_key or TAVILY_API_KEY
    model_name = request.model_name or DEFAULT_GROQ_MODEL

    if not groq_key:
        yield {
            "event": "error",
            "message": "Groq API Key is not set. Please provide it in the settings or .env file."
        }
        return

    try:
        app = create_agent_graph(
            groq_key=groq_key,
            tavily_key=tavily_key,
            model_name=model_name,
            enable_search=bool(request.use_search and tavily_key)
        )
    except Exception as e:
        yield {"event": "error", "message": f"Failed to initialize agent: {str(e)}"}
        return

    initial_state: AgentState = {
        "topic": request.topic,
        "tone": request.tone or "Thought Leadership",
        "audience": request.audience or "Industry Professionals",
        "custom_instructions": request.custom_instructions or "",
        "use_search": bool(request.use_search and tavily_key),
        "max_attempts": request.max_attempts or 3,
        "attempt": 0,
        "messages": [],
        "draft": "",
        "review_feedback": "",
        "is_approved": False,
        "history": []
    }

    yield {
        "event": "start",
        "topic": request.topic,
        "model": model_name,
        "max_attempts": request.max_attempts,
        "search_enabled": bool(request.use_search and tavily_key)
    }

    try:
        # LangGraph async stream
        current_state = dict(initial_state)
        async for output in app.astream(initial_state, stream_mode="updates"):
            for node_name, node_update in output.items():
                if node_name == "writer":
                    current_attempt = node_update.get("attempt", current_state.get("attempt", 1))
                    current_state["attempt"] = current_attempt
                    messages = node_update.get("messages", [])
                    last_msg = messages[-1] if messages else None
                    if getattr(last_msg, "tool_calls", None) and len(last_msg.tool_calls) > 0:
                        yield {
                            "event": "step",
                            "step": "researching",
                            "attempt": current_attempt,
                            "status": f"Gathering context via web search for attempt {current_attempt}..."
                        }
                    else:
                        yield {
                            "event": "step",
                            "step": "drafting",
                            "attempt": current_attempt,
                            "status": f"Drafting post (Attempt {current_attempt})..."
                        }
                elif node_name == "tools":
                    yield {
                        "event": "step",
                        "step": "research_complete",
                        "attempt": current_state.get("attempt", 1),
                        "status": "Search completed. Synthesizing insights into draft..."
                    }
                elif node_name == "extract_draft":
                    draft = node_update.get("draft", "")
                    current_state["draft"] = draft
                    yield {
                        "event": "draft_extracted",
                        "attempt": current_state.get("attempt", 1),
                        "draft": draft,
                        "word_count": len(draft.split())
                    }
                elif node_name == "reviewer":
                    feedback = node_update.get("review_feedback", "")
                    is_approved = node_update.get("is_approved", False)
                    history = node_update.get("history", [])
                    current_state["review_feedback"] = feedback
                    current_state["is_approved"] = is_approved
                    current_state["history"] = history
                    verdict = "APPROVED" if is_approved else "REJECTED"
                    yield {
                        "event": "review_verdict",
                        "attempt": current_state.get("attempt", 1),
                        "verdict": verdict,
                        "is_approved": is_approved,
                        "feedback": feedback,
                        "history": history
                    }

        # Yield complete event
        yield {
            "event": "complete",
            "success": True,
            "draft": current_state.get("draft", ""),
            "is_approved": current_state.get("is_approved", False),
            "attempts": current_state.get("attempt", 1),
            "history": current_state.get("history", [])
        }

    except Exception as e:
        yield {
            "event": "error",
            "message": f"Execution error: {str(e)}"
        }


def run_agent_sync(request: GenerateRequest) -> GenerateResponse:
    groq_key = request.groq_api_key or GROQ_API_KEY
    tavily_key = request.tavily_api_key or TAVILY_API_KEY
    model_name = request.model_name or DEFAULT_GROQ_MODEL

    if not groq_key:
        return GenerateResponse(
            success=False,
            draft="",
            is_approved=False,
            attempts=0,
            history=[],
            error="Groq API Key is missing. Provide it in .env or request body."
        )

    try:
        app = create_agent_graph(
            groq_key=groq_key,
            tavily_key=tavily_key,
            model_name=model_name,
            enable_search=bool(request.use_search and tavily_key)
        )

        initial_state: AgentState = {
            "topic": request.topic,
            "tone": request.tone or "Thought Leadership",
            "audience": request.audience or "Industry Professionals",
            "custom_instructions": request.custom_instructions or "",
            "use_search": bool(request.use_search and tavily_key),
            "max_attempts": request.max_attempts or 3,
            "attempt": 0,
            "messages": [],
            "draft": "",
            "review_feedback": "",
            "is_approved": False,
            "history": []
        }

        final_state = app.invoke(initial_state)

        history_items = [
            AttemptHistoryItem(**item) for item in final_state.get("history", [])
        ]

        return GenerateResponse(
            success=True,
            draft=final_state.get("draft", ""),
            is_approved=final_state.get("is_approved", False),
            attempts=final_state.get("attempt", 0),
            history=history_items,
            error=None
        )
    except Exception as e:
        return GenerateResponse(
            success=False,
            draft="",
            is_approved=False,
            attempts=0,
            history=[],
            error=str(e)
        )
