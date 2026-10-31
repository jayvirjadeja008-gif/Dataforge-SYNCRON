# Dataforge-SYNCRON

# DATAFORGE / CodeSherpa

A local AI companion and automated triage copilot that helps you take your first step into open source, and keeps maintainers in full control of what happens next.

---

## Why DATAFORGE?

Contributing to open source often means piecing together an issue, a README, and unfamiliar code before you know where to begin. DATAFORGE makes that first step clearer.

It reads project materials and issue context to help you:

- **Find** the files relevant to a task
- **Understand** what the issue is really asking
- **Work through** Git and GitHub workflows with confidence
- **Triage** incoming issues with automated label classification, duplicate detection, and draft replies

---

## Key Features

| Feature | What it does |
| :--- | :--- |
| **Agent Core** | Uses Ollama with Qwen2.5-Coder to give direct, understandable guidance and unified diff patches |
| **Project Knowledge Base** | Keeps relevant project materials close, retrieved with cosine similarity over 1536-dimensional embeddings |
| **3D Vector Space** | Interactive WebGL embedding space visualizing issue clustering and semantic distance |
| **Learning Memory** | Adapts explanations to the contributor experience level |
| **Mission Manager** | Coordinates task execution and runs safety checks along the way |
| **Safety Layer** | Manages permissions, protects secrets, and keeps contributors in control |
| **Real-time Streaming** | Streams AI responses live over Server-Sent Events (SSE) |

---

## Contributor Learning Path

DATAFORGE builds confidence over time, moving you from guided exploration toward independent work:

```
Explorer -> Apprentice -> Contributor -> Developer -> Maintainer -> Independent Engineer
```

---

## Safety First

Safety is part of the workflow, not an afterthought. The Safety Layer:

- Manages permissions and records meaningful actions
- Protects secrets and privacy
- Checks license compatibility
- Validates task input against project guidance
- Enforces human-in-the-loop review for all draft replies and actions

### Permission Model

| Action | Approval needed |
| :--- | :--- |
| Reading, explanations, viewing history | None, always allowed |
| Modifying, creating, or installing | Approval required |
| Pushing changes or opening a pull request | **Explicit approval required** |

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript 7, Three.js, React Three Fiber, Tailwind CSS v4, Framer Motion, Lucide React, Web Audio API |
| **Backend** | Python 3.12, FastAPI, Uvicorn, Pydantic v2, Requests, Python-dotenv |
| **Database & Storage** | SQLite3 with WAL mode |
| **AI & ML** | Ollama with Qwen2.5-Coder, cosine similarity with 1536-dimensional embeddings, SSE for real-time AI streaming |
| **Containerization** | Docker, Docker Compose |

---

## Quick Start (One Command)

To launch both backend and frontend concurrently:

```bash
chmod +x start.sh
./start.sh
```

- Web Application: http://localhost:3000
- REST API Gateway: http://localhost:8000
- Interactive OpenAPI Docs: http://localhost:8000/docs

---

## Manual Setup

### 1. Prerequisites

- Python 3.12+
- Node.js (current LTS)
- [Ollama](https://ollama.ai) installed and running

### 2. Pull Local Model

```bash
ollama run qwen2.5-coder
```

### 3. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

Backend runs on `http://localhost:8000`.

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run typecheck
npm run lint
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

## Team

**Devforge-SYNCRON**

GitHub Target: https://github.com/jayvirjadeja008-gif
License: MIT License
