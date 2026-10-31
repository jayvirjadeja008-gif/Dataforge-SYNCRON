import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root or parent directory
backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(backend_dir / ".env")

class Settings:
    PROJECT_NAME: str = "PatchPilot"
    TEAM_NAME: str = "Devforge-SYNCRON"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # GitHub Integration Credentials
    DEFAULT_GITHUB_USER: str = os.getenv("DEFAULT_GITHUB_USER", "jayvirjadeja008-gif")
    GITHUB_PROFILE_URL: str = f"https://github.com/{DEFAULT_GITHUB_USER}"
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    GITHUB_WEBHOOK_SECRET: str = os.getenv("GITHUB_WEBHOOK_SECRET", "")
    
    # AI Engine
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    
    # Local LLM: Ollama & Qwen2.5-Coder
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5-coder")
    LLM_TIMEOUT: float = float(os.getenv("LLM_TIMEOUT", "45.0"))
    
    # Storage
    DATABASE_PATH: Path = backend_dir / "patchpilot.db"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()
