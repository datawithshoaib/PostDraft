import os
import sys
import argparse
from dotenv import load_dotenv

load_dotenv()

def run_cli():
    from backend.agent import run_agent_sync
    from backend.schemas import GenerateRequest
    from backend.config import GROQ_API_KEY, DEFAULT_GROQ_MODEL

    print("=" * 60)
    print("PostDraft: Agentic LinkedIn Post Generator (Groq + LangGraph)")
    print("=" * 60)
    print("\nThis tool will draft a LinkedIn post, review it against strict")
    print("editorial criteria, and iterate until publish-ready.\n")
    print("=" * 60)

    if not GROQ_API_KEY:
        print("\n[ERROR] GROQ_API_KEY is not set.")
        print("Please set your GROQ_API_KEY in the .env file or environment.")
        return

    topic = input("\nEnter post topic:\n> ").strip()
    if not topic:
        print("No topic provided. Exiting.")
        return

    tone = input("Enter tone style (press Enter for 'Thought Leadership'):\n> ").strip() or "Thought Leadership"
    audience = input("Enter target audience (press Enter for 'Industry Professionals'):\n> ").strip() or "Industry Professionals"
    
    print("\nGenerating post with Groq...")
    req = GenerateRequest(
        topic=topic,
        tone=tone,
        audience=audience,
        model_name=DEFAULT_GROQ_MODEL,
        max_attempts=3
    )

    response = run_agent_sync(req)

    if not response.success:
        print(f"\n[ERROR]: {response.error}")
        return

    print("\n" + "=" * 60)
    print("FINAL APPROVED LINKEDIN POST")
    print("=" * 60)
    print(response.draft)
    print("=" * 60)
    print(f"Total attempts: {response.attempts}")
    print(f"Status: {'Approved' if response.is_approved else 'Completed (max attempts)'}")

    if response.history:
        print("\nAttempt History:")
        for item in response.history:
            print(f"- Attempt {item.attempt}: Verdict [{item.verdict}] | Words: {item.word_count}")
            print(f"  Feedback: {item.feedback}\n")

def run_server(host: str = "0.0.0.0", port: int = 8000, reload: bool = True):
    import uvicorn
    print(f"Starting PostDraft FastAPI backend on http://{host}:{port}...")
    uvicorn.run("backend.main:app", host=host, port=port, reload=reload)

def main():
    parser = argparse.ArgumentParser(description="PostDraft LinkedIn Post Generator")
    parser.add_argument("--server", "-s", action="store_true", help="Start the FastAPI backend server")
    parser.add_argument("--cli", "-c", action="store_true", help="Run the interactive CLI tool")
    parser.add_argument("--host", default="0.0.0.0", help="FastAPI host (default: 0.0.0.0)")
    parser.add_argument("--port", default=8000, type=int, help="FastAPI port (default: 8000)")
    args = parser.parse_args()

    if args.server:
        run_server(host=args.host, port=args.port)
    elif args.cli:
        run_cli()
    else:
        # Default behavior: run CLI if terminal input is available, otherwise show help
        run_cli()

if __name__ == "__main__":
    main()
