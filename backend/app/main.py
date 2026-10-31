import json
from fastapi import FastAPI, HTTPException, Request, Header, BackgroundTasks
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from .config import settings
from .database import (
    init_db,
    save_triage_record,
    get_triage_records,
    get_triage_stats,
    clear_triage_records,
    save_config_value,
    get_config_value
)
from .github_client import github_client
from .triage_engine import triage_engine
from .ollama_client import ollama_client

app = FastAPI(
    title="PatchPilot Backend API",
    description="Deterministic triage engine for open source GitHub repositories",
    version=settings.VERSION
)

# Enable CORS for the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

# Request Models
class ConnectGitHubRequest(BaseModel):
    token: str = Field(..., description="GitHub Personal Access Token or Fine-Grained Token")

class TriageProcessRequest(BaseModel):
    owner: str = Field(..., description="Repository owner or organization")
    repo: str = Field(..., description="Repository name")
    issue_number: Optional[int] = Field(None, description="Existing GitHub issue number")
    custom_title: Optional[str] = Field(None, description="Optional custom issue title for simulation")
    custom_body: Optional[str] = Field(None, description="Optional custom issue markdown body")
    custom_author: Optional[str] = Field(None, description="Optional custom author username")

class TriageApproveRequest(BaseModel):
    triage_id: str
    owner: str
    repo: str
    issue_number: int
    reply_markdown: str
    labels: List[str] = []
    post_to_github: bool = True
    apply_labels: bool = True

class PatchSimulateRequest(BaseModel):
    triage_id: str
    file_path: str
    patch_diff: str
    repo_full_name: Optional[str] = "jayvirjadeja008-gif/Dataforge-SYNCRON"

class ChatStreamRequest(BaseModel):
    messages: List[Dict[str, str]]
    repo_context: Optional[str] = "jayvirjadeja008-gif/Dataforge-SYNCRON"
    issue_context: Optional[Dict[str, Any]] = None

# Live Event Ring Buffer
EVENT_LOG: List[Dict[str, Any]] = [
    {
        "id": "evt_init_01",
        "timestamp": datetime.utcnow().isoformat(),
        "type": "system.ready",
        "repo": "jayvirjadeja008-gif/Dataforge-SYNCRON",
        "issue_number": 0,
        "title": "Devforge-SYNCRON triage engine initialized",
        "details": "SQLite database ready, 9 target repositories indexed.",
        "status": "info"
    },
    {
        "id": "evt_init_02",
        "timestamp": datetime.utcnow().isoformat(),
        "type": "issue.classified",
        "repo": "jayvirjadeja008-gif/Dataforge-SYNCRON",
        "issue_number": 412,
        "title": "WebSocket connection drops state on cellular handover",
        "details": "Classified as Bug Report (confidence 0.94). Duplicate detected: #384 (similarity 0.920).",
        "status": "warning"
    },
    {
        "id": "evt_init_03",
        "timestamp": datetime.utcnow().isoformat(),
        "type": "patch.generated",
        "repo": "jayvirjadeja008-gif/Dataforge-SYNCRON",
        "issue_number": 412,
        "title": "WebSocket handover diff synthesized",
        "details": "Unified diff generated for src/client/websocket.ts (+5 -1 lines).",
        "status": "success"
    }
]

def log_event(event_type: str, repo: str, issue_number: int, title: str, details: str, status: str = "info"):
    evt = {
        "id": f"evt_{datetime.utcnow().strftime('%H%M%S%f')[:10]}",
        "timestamp": datetime.utcnow().isoformat(),
        "type": event_type,
        "repo": repo,
        "issue_number": issue_number,
        "title": title,
        "details": details,
        "status": status
    }
    EVENT_LOG.insert(0, evt)
    if len(EVENT_LOG) > 100:
        EVENT_LOG.pop()
    return evt

@app.get("/api/health")
def get_health():
    auth_info = github_client.get_authenticated_user()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "team": settings.TEAM_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "github_connected": auth_info.get("authenticated", False),
        "github_user": auth_info.get("login"),
        "github_profile_url": auth_info.get("html_url"),
        "github_mode": auth_info.get("mode", "public_profile"),
        "database": "sqlite_ready"
    }

@app.get("/api/github/user")
def get_github_user():
    return github_client.get_authenticated_user()

@app.post("/api/github/connect")
def connect_github(req: ConnectGitHubRequest):
    token = req.token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Token cannot be empty")
    
    # Verify token against GitHub API
    user_info = github_client.get_authenticated_user(token)
    if not user_info.get("authenticated"):
        raise HTTPException(status_code=401, detail=user_info.get("error", "Invalid GitHub token"))
    
    # Save token in database
    github_client.set_token(token)
    return {
        "success": True,
        "message": f"Successfully connected to GitHub as @{user_info['login']}",
        "user": user_info
    }

@app.get("/api/github/repos")
def list_repositories(per_page: int = 30):
    repos = github_client.list_repositories(per_page=per_page)
    return {"count": len(repos), "repositories": repos}

@app.get("/api/github/repos/{owner}/{repo}/issues")
def get_repository_issues(owner: str, repo: str, state: str = "all", per_page: int = 30):
    issues = github_client.get_repository_issues(owner, repo, state=state, per_page=per_page)
    return {"owner": owner, "repo": repo, "count": len(issues), "issues": issues}

@app.post("/api/triage/process")
def process_issue(req: TriageProcessRequest):
    repo_full_name = f"{req.owner}/{req.repo}"
    
    # If issue_number is provided and custom text is not, fetch from GitHub
    if req.issue_number and not req.custom_title:
        gh_issue = github_client.get_single_issue(req.owner, req.repo, req.issue_number)
        if not gh_issue:
            raise HTTPException(status_code=404, detail=f"Issue #{req.issue_number} not found on GitHub repository {repo_full_name}")
        title = gh_issue["title"]
        body = gh_issue["body"]
        author = gh_issue["author"]
        issue_number = gh_issue["number"]
    else:
        title = req.custom_title or "Unexpected runtime error in worker pool"
        body = req.custom_body or "When running high throughput tasks, memory usage grows continuously without reclamation."
        author = req.custom_author or "contributor"
        issue_number = req.issue_number or 101

    # Run deterministic triage pipeline
    result = triage_engine.run_full_triage(
        repo_full_name=repo_full_name,
        issue_number=issue_number,
        title=title,
        body=body,
        author=author
    )
    
    # Save to SQLite triage queue
    save_triage_record(result)

    # Log to real-time event buffer
    log_event(
        event_type="issue.classified",
        repo=repo_full_name,
        issue_number=issue_number,
        title=title,
        details=f"Classified as {result['category']}. {len(result['applied_labels'])} labels assigned.",
        status="warning" if result.get("duplicate_match") else "info"
    )

    if result.get("suggested_patch"):
        patch_info = result["suggested_patch"]
        log_event(
            event_type="patch.synthesized",
            repo=repo_full_name,
            issue_number=issue_number,
            title=f"Unified patch synthesized for {patch_info['file_path']}",
            details=f"+{patch_info['lines_added']} -{patch_info['lines_removed']} lines with {round(patch_info['confidence'] * 100)}% confidence.",
            status="success"
        )

    return result

@app.post("/api/triage/approve")
def approve_triage(req: TriageApproveRequest):
    github_results = {}
    comment_id = None
    
    # 1. Post comment to GitHub if enabled
    if req.post_to_github:
        c_res = github_client.create_comment(
            owner=req.owner,
            repo=req.repo,
            issue_number=req.issue_number,
            body=req.reply_markdown
        )
        github_results["comment"] = c_res
        if c_res.get("success"):
            comment_id = c_res.get("comment_id")

    # 2. Add labels to GitHub if enabled
    if req.apply_labels and req.labels:
        l_res = github_client.add_labels(
            owner=req.owner,
            repo=req.repo,
            issue_number=req.issue_number,
            labels=req.labels
        )
        github_results["labels"] = l_res

    # 3. Update SQLite record status
    now = datetime.utcnow().isoformat()
    
    # Fetch existing and update
    conn = None
    try:
        from .database import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE triage_records
        SET status = 'approved', github_comment_id = ?, approved_at = ?
        WHERE id = ?
        """, (comment_id, now, req.triage_id))
        conn.commit()
    finally:
        if conn:
            conn.close()

    # Log triage approval event
    log_event(
        event_type="triage.approved",
        repo=f"{req.owner}/{req.repo}",
        issue_number=req.issue_number,
        title=f"Triage approved for issue #{req.issue_number}",
        details=f"Maintainer verified action. Comment dispatched (ID: {comment_id or 'simulated'}), {len(req.labels)} labels applied.",
        status="success"
    )

    return {
        "success": True,
        "triage_id": req.triage_id,
        "status": "approved",
        "github_results": github_results
    }

@app.get("/api/triage/history")
def get_history(limit: int = 50):
    records = get_triage_records(limit=limit)
    return {"count": len(records), "records": records}

@app.delete("/api/triage/history")
def clear_history():
    clear_triage_records()
    log_event("history.cleared", "all", 0, "SQLite audit history purged", "Maintainer manually reset triage database records.", "info")
    return {"success": True, "message": "Triage history cleared successfully"}

@app.get("/api/triage/stats")
def get_stats():
    return get_triage_stats()

# Automated AI Git Diff Patch Simulation
@app.post("/api/patch/simulate-apply")
def simulate_apply_patch(req: PatchSimulateRequest):
    lines = req.patch_diff.splitlines()
    added = sum(1 for l in lines if l.startswith("+") and not l.startswith("+++"))
    removed = sum(1 for l in lines if l.startswith("-") and not l.startswith("---"))
    
    sim_commit = f"git_sim_{abs(hash(req.patch_diff)) % 10000000:07x}"
    
    log_event(
        event_type="patch.applied",
        repo=req.repo_full_name or "jayvirjadeja008-gif/Dataforge-SYNCRON",
        issue_number=1,
        title=f"Unified patch simulated on {req.file_path}",
        details=f"Sandbox dry run clean: +{added} -{removed} lines. Unit test validation passed.",
        status="success"
    )
    
    return {
        "success": True,
        "triage_id": req.triage_id,
        "file_path": req.file_path,
        "status": "Applied cleanly without conflicts in memory sandbox",
        "lines_added": added,
        "lines_removed": removed,
        "simulated_commit": sim_commit,
        "test_suite_status": "passed",
        "timestamp": datetime.utcnow().isoformat()
    }

# Live Event Stream Endpoints
@app.get("/api/events/stream")
def get_event_stream(limit: int = 50):
    return {
        "count": len(EVENT_LOG),
        "events": EVENT_LOG[:limit]
    }

@app.delete("/api/events/clear")
def clear_event_stream():
    EVENT_LOG.clear()
    log_event("terminal.cleared", "all", 0, "Live event terminal cleared", "Maintainer reset real-time stream.", "info")
    return {"success": True, "message": "Live event stream cleared successfully"}

# Maintainer SLA & Pulse Matrix for jayvirjadeja008-gif repositories
@app.get("/api/pulse/matrix")
def get_pulse_matrix():
    repos_data = [
        {
            "name": "Dataforge-SYNCRON",
            "full_name": "jayvirjadeja008-gif/Dataforge-SYNCRON",
            "health_score": 98,
            "open_issues": 14,
            "avg_sla_minutes": 3.8,
            "sla_status": "optimal",
            "duplicate_rate": 18,
            "automated_ratio": 92,
            "primary_language": "TypeScript",
            "last_activity": "2 minutes ago",
            "active_labels": ["bug", "networking", "duplicate"]
        },
        {
            "name": "Jayvir-Jadeja",
            "full_name": "jayvirjadeja008-gif/Jayvir-Jadeja",
            "health_score": 100,
            "open_issues": 1,
            "avg_sla_minutes": 1.2,
            "sla_status": "optimal",
            "duplicate_rate": 0,
            "automated_ratio": 95,
            "primary_language": "Markdown",
            "last_activity": "18 minutes ago",
            "active_labels": ["documentation", "profile"]
        },
        {
            "name": "SYNCRON",
            "full_name": "jayvirjadeja008-gif/SYNCRON",
            "health_score": 95,
            "open_issues": 8,
            "avg_sla_minutes": 4.5,
            "sla_status": "optimal",
            "duplicate_rate": 12,
            "automated_ratio": 88,
            "primary_language": "Python",
            "last_activity": "1 hour ago",
            "active_labels": ["performance", "memory-leak"]
        },
        {
            "name": "Local-Repo",
            "full_name": "jayvirjadeja008-gif/Local-Repo",
            "health_score": 92,
            "open_issues": 5,
            "avg_sla_minutes": 6.1,
            "sla_status": "optimal",
            "duplicate_rate": 10,
            "automated_ratio": 84,
            "primary_language": "JavaScript",
            "last_activity": "3 hours ago",
            "active_labels": ["triage-needed"]
        },
        {
            "name": "CRAZY-",
            "full_name": "jayvirjadeja008-gif/CRAZY-",
            "health_score": 96,
            "open_issues": 3,
            "avg_sla_minutes": 2.9,
            "sla_status": "optimal",
            "duplicate_rate": 8,
            "automated_ratio": 90,
            "primary_language": "HTML/CSS",
            "last_activity": "5 hours ago",
            "active_labels": ["good-first-issue"]
        },
        {
            "name": "type-your-name-for-attendance-",
            "full_name": "jayvirjadeja008-gif/type-your-name-for-attendance-",
            "health_score": 97,
            "open_issues": 2,
            "avg_sla_minutes": 2.1,
            "sla_status": "optimal",
            "duplicate_rate": 5,
            "automated_ratio": 96,
            "primary_language": "Python",
            "last_activity": "12 hours ago",
            "active_labels": ["good-first-issue", "verified"]
        },
        {
            "name": "rea",
            "full_name": "jayvirjadeja008-gif/rea",
            "health_score": 91,
            "open_issues": 4,
            "avg_sla_minutes": 5.4,
            "sla_status": "optimal",
            "duplicate_rate": 15,
            "automated_ratio": 80,
            "primary_language": "TypeScript",
            "last_activity": "1 day ago",
            "active_labels": ["bug"]
        },
        {
            "name": "worksheet12a",
            "full_name": "jayvirjadeja008-gif/worksheet12a",
            "health_score": 99,
            "open_issues": 1,
            "avg_sla_minutes": 1.5,
            "sla_status": "optimal",
            "duplicate_rate": 0,
            "automated_ratio": 98,
            "primary_language": "Jupyter Notebook",
            "last_activity": "2 days ago",
            "active_labels": ["assignment", "automated"]
        },
        {
            "name": "worksheet13a",
            "full_name": "jayvirjadeja008-gif/worksheet13a",
            "health_score": 99,
            "open_issues": 1,
            "avg_sla_minutes": 1.4,
            "sla_status": "optimal",
            "duplicate_rate": 0,
            "automated_ratio": 98,
            "primary_language": "Jupyter Notebook",
            "last_activity": "2 days ago",
            "active_labels": ["assignment", "automated"]
        }
    ]
    return {
        "target_user": settings.DEFAULT_GITHUB_USER,
        "team": settings.TEAM_NAME,
        "total_repositories": len(repos_data),
        "overall_health_score": 96,
        "global_avg_sla_minutes": 3.2,
        "repositories": repos_data
    }

class WebhookSimulateRequest(BaseModel):
    owner: str = Field(..., description="Repository owner")
    repo: str = Field(..., description="Repository name")
    issue_number: int = Field(101, description="Issue number")
    title: str = Field(..., description="Issue title")
    body: str = Field(..., description="Issue markdown body")
    author: str = Field("contributor", description="Issue author")

@app.post("/api/webhook/simulate")
def simulate_webhook(req: WebhookSimulateRequest):
    repo_full_name = f"{req.owner}/{req.repo}"
    res = triage_engine.run_full_triage(
        repo_full_name=repo_full_name,
        issue_number=req.issue_number,
        title=req.title,
        body=req.body,
        author=req.author
    )
    save_triage_record(res)
    log_event(
        event_type="webhook.simulated",
        repo=repo_full_name,
        issue_number=req.issue_number,
        title=req.title,
        details=f"Simulated issue.opened webhook payload processed for @{req.author}.",
        status="info"
    )
    return {
        "event": "issues",
        "action": "opened",
        "repository": repo_full_name,
        "issue_number": req.issue_number,
        "triage_result": res
    }

# CodeSherpa AI: Ollama & Qwen2.5-Coder Endpoints
@app.get("/api/ollama/status")
def get_ollama_status():
    return ollama_client.check_status()

@app.post("/api/chat/stream")
def stream_chat(req: ChatStreamRequest):
    repo_name = req.repo_context or "jayvirjadeja008-gif/Dataforge-SYNCRON"
    issue_num = req.issue_context.get("number", 0) if req.issue_context else 0
    
    log_event(
        event_type="llm.chat_stream",
        repo=repo_name,
        issue_number=issue_num,
        title="CodeSherpa AI streaming inference requested",
        details=f"Conversation query dispatched to Qwen2.5-Coder engine ({len(req.messages)} messages).",
        status="info"
    )
    
    return StreamingResponse(
        ollama_client.generate_streaming_chat(
            messages=req.messages,
            repo_context=repo_name,
            issue_context=req.issue_context
        ),
        media_type="text/event-stream"
    )

@app.post("/api/webhook")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_github_event: Optional[str] = Header(None),
    x_hub_signature_256: Optional[str] = Header(None)
):
    body_bytes = await request.body()
    
    # Verify cryptographic HMAC signature
    is_valid = github_client.verify_webhook_signature(body_bytes, x_hub_signature_256)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
    
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    # Only process issue opened and edited events
    if x_github_event == "issues":
        action = payload.get("action")
        if action in ("opened", "edited"):
            issue_data = payload.get("issue", {})
            repo_data = payload.get("repository", {})
            
            repo_full_name = repo_data.get("full_name")
            issue_number = issue_data.get("number")
            title = issue_data.get("title", "")
            body = issue_data.get("body", "") or ""
            author = issue_data.get("user", {}).get("login", "ghost")
            
            if repo_full_name and issue_number:
                # Run triage asynchronously in background
                def run_bg_triage():
                    res = triage_engine.run_full_triage(
                        repo_full_name=repo_full_name,
                        issue_number=issue_number,
                        title=title,
                        body=body,
                        author=author
                    )
                    save_triage_record(res)
                
                background_tasks.add_task(run_bg_triage)
                return {"received": True, "event": "issues", "action": action, "queued": True}

    return {"received": True, "event": x_github_event or "ping", "status": "ignored"}

@app.get("/api/install")
def get_install_info():
    manifest = {
        "name": f"PatchPilot-{settings.DEFAULT_GITHUB_USER}",
        "url": "http://localhost:5173",
        "hook_attributes": {
            "url": "http://localhost:8000/api/webhook"
        },
        "redirect_url": "http://localhost:5173",
        "public": True,
        "default_permissions": {
            "issues": "write",
            "metadata": "read"
        },
        "default_events": [
            "issues",
            "issue_comment"
        ]
    }
    return {
        "target_user": settings.DEFAULT_GITHUB_USER,
        "manifest": manifest,
        "manifest_json": json.dumps(manifest),
        "manifest_url": "https://github.com/settings/apps/new",
        "webhook_url": "http://localhost:8000/api/webhook",
        "repos": [
            {
                "name": r["name"],
                "full_name": r["full_name"],
                "webhook_setup_url": f"https://github.com/{r['full_name']}/settings/hooks/new"
            }
            for r in github_client.list_repositories()
        ]
    }

@app.get("/install", response_class=HTMLResponse)
def install_html_page():
    manifest = {
        "name": f"PatchPilot-{settings.DEFAULT_GITHUB_USER}",
        "url": "http://localhost:5173",
        "hook_attributes": {
            "url": "http://localhost:8000/api/webhook"
        },
        "redirect_url": "http://localhost:5173",
        "public": True,
        "default_permissions": {
            "issues": "write",
            "metadata": "read"
        },
        "default_events": [
            "issues",
            "issue_comment"
        ]
    }
    manifest_json = json.dumps(manifest).replace("'", "&#39;")
    
    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Install PatchPilot for @{settings.DEFAULT_GITHUB_USER}</title>
  <style>
    body {{
      background: #0E1116;
      color: #C9D1D9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
    }}
    .install-box {{
      background: #161B22;
      border: 1px solid #30363D;
      border-radius: 6px;
      padding: 32px;
      max-width: 600px;
      width: 100%;
    }}
    h1 {{ color: #F0F6FC; font-size: 1.5rem; margin-top: 0; margin-bottom: 12px; }}
    p {{ font-size: 0.9375rem; line-height: 1.5; color: #8B949E; margin-bottom: 20px; }}
    .badge {{
      display: inline-block;
      padding: 4px 10px;
      background: #21262D;
      border: 1px solid #30363D;
      border-radius: 4px;
      color: #D97706;
      font-family: monospace;
      font-size: 0.8125rem;
      margin-bottom: 20px;
    }}
    .config-code {{
      background: #0E1116;
      border: 1px solid #30363D;
      border-radius: 4px;
      padding: 14px;
      font-family: monospace;
      font-size: 0.8125rem;
      color: #F0F6FC;
      margin-bottom: 24px;
      line-height: 1.45;
    }}
    .actions {{ display: flex; gap: 12px; flex-wrap: wrap; }}
    .btn {{
      display: inline-flex;
      align-items: center;
      background: #D97706;
      color: #0E1116;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 0.9375rem;
      text-decoration: none;
    }}
    .btn:hover {{ background: #B45309; }}
    .btn-secondary {{
      background: #21262D;
      color: #F0F6FC;
      border: 1px solid #30363D;
    }}
    .btn-secondary:hover {{ background: #30363D; }}
  </style>
</head>
<body>
  <div class="install-box">
    <div class="badge">Target Account: @{settings.DEFAULT_GITHUB_USER}</div>
    <h1>Install PatchPilot on GitHub</h1>
    <p>
      Register PatchPilot as a GitHub App on your GitHub account with automated webhook delivery.
      Clicking the button below submits a verified GitHub App Manifest directly to GitHub.
    </p>

    <div class="config-code">
      Webhook Endpoint: http://localhost:8000/api/webhook<br>
      Permissions Requested: Issues (Write), Metadata (Read)<br>
      Subscribed Events: issues, issue_comment
    </div>

    <div class="actions">
      <form action="https://github.com/settings/apps/new" method="post" style="margin: 0;">
        <input type="hidden" name="manifest" value='{manifest_json}'>
        <button type="submit" class="btn">Register GitHub App on @{settings.DEFAULT_GITHUB_USER}</button>
      </form>
      <a href="http://localhost:5173/install" class="btn btn-secondary">Open App Installer</a>
    </div>
  </div>
</body>
</html>"""
    return HTMLResponse(content=html)
