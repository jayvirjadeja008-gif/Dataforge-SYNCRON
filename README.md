# Dataforge-SYNCRON

# DATAFORGE

A local AI companion that helps you take your first step into open source, and keeps you in control of what happens next.

---

Why DATAFORGE?
  
Contributing to open source often means piecing together an issue, a README, and unfamiliar code before you know where to begin. DATAFORGE makes that first step clearer.

It reads project materials and issue context to help you:

- **Find** the files relevant to a task
- **Understand** what the issue is really asking
- **Work through** Git and GitHub workflows with confidence

--------

# Key Features

| Feature | What it does |

| **Agent Core** | Uses Ollama with Qwen2.5-Coder to give direct, understandable guidance |
| **Project Knowledge Base** | Keeps relevant project materials close, retrieved with cosine similarity over 1536-dimensional embeddings |
| **Learning Memory** | Adapts explanations to the contributor's experience level |
| **Mission Manager** | Coordinates task execution and runs safety checks along the way |
| **Safety Layer** | Manages permissions, protects secrets, and keeps contributors in control |
| **Real-time Streaming** | Streams AI responses live over Server-Sent Events (SSE) |

---------

# Your Learning Path

DATAFORGE builds confidence over time, moving you from guided exploration toward independent work:

```
Explorer → Apprentice → Contributor → Developer → Maintainer → Independent Engineer
```

---------

# Safety First

Safety is part of the workflow, not an afterthought. The Safety Layer:

- Manages permissions and records meaningful actions
- Protects secrets and privacy
- Checks license compatibility
- Validates task input against project guidance
- Provides a sandbox for safe experimentation

# Permission Model

| Action | Approval needed |


| Reading, explanations, viewing history | None, always allowed |
| Modifying, creating, or installing | Approval required |
| Pushing changes or opening a pull request | **Explicit approval required** |

-------

## Technology Stack

| Layer | Technologies |


| **Frontend** | React 19, TypeScript 7, Vite 8, Three.js, React Three Fiber, Tailwind CSS v4, Framer Motion, Lucide React, Web Audio API |
| **Backend** | Python 3.12, FastAPI, Uvicorn, Pydantic v2, Requests, Python-dotenv |
| **Database & Storage** | SQLite3 with WAL mode |
| **AI & ML** | Ollama with Qwen2.5-Coder, cosine similarity with 1536-dimensional embeddings, SSE for real-time AI streaming |

---------

# Getting Started

# Prerequisites

- Python 3.12+
- Node.js (current LTS)
- [Ollama](https://ollama.com) installed and running

# Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/dataforge.git
cd dataforge

# 2. Pull the local model
ollama pull qwen2.5-coder

# 3. Start the backend
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload

# 4. Start the frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

---------

# How It Works

1. Read: Ingests the project README, docs, and issue context into the knowledge base.
2. Understand: The Agent Core explains the task at your experience level.
3. Plan: The Mission Manager breaks the work into steps, with safety checks at each one.
4. Act with approval: Any change, install, push, or PR waits for your sign-off.
5. Grow:  Learning memory tracks your progress along the path.

----------

# Team

**PSYNCRON**

---------

> **DATAFORGE helps people understand a project, make informed contributions, and grow into confident open source contributors.**

