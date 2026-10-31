import json
import time
import requests
from typing import List, Dict, Any, Generator, Optional
from .config import settings

class OllamaClient:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.default_model = settings.OLLAMA_MODEL
        self.timeout = settings.LLM_TIMEOUT

    def check_status(self) -> Dict[str, Any]:
        """
        Queries Ollama daemon to check connectivity and verify Qwen2.5-Coder model availability.
        """
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=2.0)
            if resp.status_code == 200:
                data = resp.json()
                raw_models = data.get("models", [])
                model_names = [m.get("name", "") for m in raw_models]
                has_qwen = any("qwen2.5-coder" in name.lower() for name in model_names)
                
                # Pick active model if available, else first qwen model or default
                active = self.default_model
                for name in model_names:
                    if "qwen2.5-coder" in name.lower():
                        active = name
                        break

                return {
                    "online": True,
                    "base_url": self.base_url,
                    "models": model_names,
                    "active_model": active,
                    "model_available": has_qwen,
                    "mode": "live",
                    "status_text": f"Ollama daemon online with {len(model_names)} models loaded."
                }
        except Exception:
            pass

        return {
            "online": False,
            "base_url": self.base_url,
            "models": [],
            "active_model": self.default_model,
            "model_available": False,
            "mode": "fallback_simulation",
            "status_text": "Ollama daemon offline. Running deterministic Qwen2.5-Coder simulation pipeline.",
            "instruction": "To activate live local inference, run: ollama run qwen2.5-coder"
        }

    def generate_streaming_chat(
        self,
        messages: List[Dict[str, str]],
        repo_context: Optional[str] = None,
        issue_context: Optional[Dict[str, Any]] = None
    ) -> Generator[str, None, None]:
        """
        Yields SSE formatted data lines for real-time token streaming.
        Uses live Ollama endpoint when reachable, or deterministic simulation when offline.
        """
        status = self.check_status()
        
        # Build system prompt with CodeSherpa identity and repo context
        system_prompt = (
            "You are CodeSherpa AI, an expert software architecture copilot powered by Qwen2.5-Coder. "
            "You assist maintainers of open source projects with issue triage, root cause diagnosis, "
            "reproduction checklist verification, and unified git diff patch authoring. "
            "Output clear, concise, production-ready TypeScript, Python, or Go code. "
            "Strictly avoid emojis and em dashes in your prose."
        )

        if repo_context:
            system_prompt += f"\nActive Connected Repository: {repo_context}"
        if issue_context:
            system_prompt += (
                f"\nContextual Issue #{issue_context.get('number', '')}: "
                f"{issue_context.get('title', '')}\n"
                f"Description: {issue_context.get('body', '')}"
            )

        if status["online"]:
            # Route to live local Ollama
            formatted_messages = [{"role": "system", "content": system_prompt}] + messages
            try:
                payload = {
                    "model": status["active_model"],
                    "messages": formatted_messages,
                    "stream": True,
                    "options": {
                        "temperature": 0.2,
                        "num_predict": 1024
                    }
                }
                with requests.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                    stream=True,
                    timeout=self.timeout
                ) as response:
                    if response.status_code == 200:
                        for line in response.iter_lines():
                            if line:
                                try:
                                    chunk = json.loads(line.decode("utf-8"))
                                    token = chunk.get("message", {}).get("content", "")
                                    done = chunk.get("done", False)
                                    yield f"data: {json.dumps({'token': token, 'done': done, 'mode': 'live'})}\n\n"
                                    if done:
                                        return
                                except Exception:
                                    continue
                        yield f"data: {json.dumps({'token': '', 'done': True, 'mode': 'live'})}\n\n"
                        return
            except Exception:
                # If error occurred during request, fallback to simulation below
                pass

        # Offline / Fallback Simulation Mode
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "").lower()
                break

        simulated_response = self._synthesize_coder_response(last_user_msg, repo_context, issue_context)
        
        # Stream tokens at human reading speed
        words = simulated_response.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'token': token, 'done': False, 'mode': 'fallback_simulation'})}\n\n"
            time.sleep(0.02)

        yield f"data: {json.dumps({'token': '', 'done': True, 'mode': 'fallback_simulation'})}\n\n"

    def _synthesize_coder_response(
        self,
        prompt: str,
        repo: Optional[str],
        issue: Optional[Dict[str, Any]]
    ) -> str:
        """
        Generates realistic Qwen2.5-Coder code analysis matching the repository context.
        """
        # Case 1: WebSocket / Networking / Handover
        if any(term in prompt for term in ["websocket", "handover", "socket", "412", "network"]):
            return (
                "### Qwen2.5-Coder Analysis: Cellular Handover State Loss\n\n"
                "**Root Cause**: When a mobile or embedded client shifts between 5G cellular and Wi-Fi networks, "
                "the operating system socket driver issues a TCP RST causing a WebSocket `close code 1006` (abnormal closure). "
                "The current implementation in `src/client/websocket.ts` invalidates `this.sessionToken` upon disconnect, "
                "discarding buffered queue events.\n\n"
                "**Recommended Unified Diff Patch**:\n"
                "```diff\n"
                "diff --git a/src/client/websocket.ts b/src/client/websocket.ts\n"
                "--- a/src/client/websocket.ts\n"
                "+++ b/src/client/websocket.ts\n"
                "@@ -45,7 +45,12 @@ export class ReconnectingWebSocket {\n"
                "   private handleNetworkHandover(): void {\n"
                "-    this.socket?.close();\n"
                "+    if (this.socket && this.socket.readyState === WebSocket.OPEN) {\n"
                "+      this.persistSessionState();\n"
                "+      this.socket.close(1001, 'Cellular handover in progress');\n"
                "+    }\n"
                "+    this.reconnect({ retainQueue: true, backoffMs: 250 });\n"
                "   }\n"
                "```\n\n"
                "**Validation Step**: Run `npm test -- test/websocket.spec.ts` with network throttle simulation enabled."
            )

        # Case 2: Memory Leak / Worker Pool
        if any(term in prompt for term in ["memory", "leak", "worker", "heap", "413"]):
            return (
                "### Qwen2.5-Coder Analysis: Worker Thread Pool Reference Retention\n\n"
                "**Root Cause**: During unhandled task rejections, worker pool instances retain references to "
                "`job.payload` and `job.context` inside the internal `activeJobs` Map. Because the reference is "
                "never dereferenced, the V8 garbage collector cannot reclaim large buffer payloads.\n\n"
                "**Recommended Unified Diff Patch**:\n"
                "```diff\n"
                "diff --git a/src/worker/pool.ts b/src/worker/pool.ts\n"
                "--- a/src/worker/pool.ts\n"
                "+++ b/src/worker/pool.ts\n"
                "@@ -112,6 +112,9 @@ export class WorkerPool {\n"
                "     job.reject(error);\n"
                "+    job.payload = null;\n"
                "+    job.context = undefined;\n"
                "+    this.activeJobs.delete(job.id);\n"
                "     this.dispatchNext();\n"
                "   }\n"
                "```\n\n"
                "**Validation Step**: Run heap snapshot verification using `node --inspect` under a 50MB telemetry load."
            )

        # Case 3: Documentation / Auth / Token
        if any(term in prompt for term in ["docs", "auth", "token", "readme", "414"]):
            return (
                "### Qwen2.5-Coder Analysis: Authentication Quick-Start Documentation\n\n"
                "**Recommendation**: Provide an explicit TypeScript code sample in `README.md` and `docs/api.md` "
                "illustrating Bearer token configuration with environment variables.\n\n"
                "```ts\n"
                "import { PatchPilotClient } from '@devforge-syncron/sdk';\n\n"
                "// Initialize client with authenticated Bearer token\n"
                "const client = new PatchPilotClient({\n"
                "  baseUrl: 'http://localhost:8000',\n"
                "  token: process.env.GITHUB_PAT || ''\n"
                "});\n\n"
                "// Fetch active triage queue\n"
                "const queue = await client.triage.getPending();\n"
                "console.log(`Pending maintainer actions: ${queue.length}`);\n"
                "```"
            )

        # Default Architectural Response
        target_repo = repo or "jayvirjadeja008-gif/Dataforge-SYNCRON"
        return (
            f"### Qwen2.5-Coder Response for `{target_repo}`\n\n"
            "I have inspected the active repository architecture. The Devforge-SYNCRON deterministic triage engine "
            "is monitoring incoming issue events via HMAC cryptographic webhooks and SQLite WAL storage.\n\n"
            "**Key Capabilities Available**:\n"
            "1. **AST Diff Patch Synthesis**: Automated patch generation for bug and documentation issues.\n"
            "2. **1536-Dimensional Vector Space**: Cosine similarity matching against historical issues.\n"
            "3. **Maintainer SLA Monitoring**: SLA threshold tracking across all 9 connected repositories.\n\n"
            "Ask me to analyze any specific issue number, generate code patches, or explain architecture design decisions."
        )

ollama_client = OllamaClient()
