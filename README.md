# PostDraft

PostDraft generates LinkedIn posts, reviews them against a fixed checklist,
and revises rejected drafts up to three times. It can use Tavily to gather
current information before drafting.

## Requirements

- Python 3.13
- OpenAI, Groq, and Tavily API keys

## Setup

Create and activate a virtual environment, then install the pinned
dependencies:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Create a `.env` file in the project directory:

```text
OPENAI_API_KEY=your-openai-key
GROQ_API_KEY=your-groq-key
TAVILY_API_KEY=your-tavily-key
```

Run the generator:

```powershell
python main.py
```

Enter a topic when prompted. The final approved draft and review status are
printed in the terminal.