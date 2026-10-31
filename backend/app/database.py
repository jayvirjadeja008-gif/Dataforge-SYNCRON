import sqlite3
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from .config import settings

def get_connection():
    conn = sqlite3.connect(str(settings.DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Store repository issue embeddings for duplicate detection
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS repo_embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_full_name TEXT NOT NULL,
        issue_number INTEGER NOT NULL,
        issue_title TEXT NOT NULL,
        issue_body_snippet TEXT,
        state TEXT DEFAULT 'open',
        embedding_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(repo_full_name, issue_number)
    )
    """)
    
    # Store triage records and maintainer approval queue
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS triage_records (
        id TEXT PRIMARY KEY,
        repo_full_name TEXT NOT NULL,
        issue_number INTEGER NOT NULL,
        issue_title TEXT NOT NULL,
        issue_author TEXT NOT NULL,
        category TEXT NOT NULL,
        labels_json TEXT NOT NULL,
        duplicate_match_json TEXT,
        draft_reply_markdown TEXT NOT NULL,
        checklist_json TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        github_comment_id INTEGER,
        created_at TEXT NOT NULL,
        approved_at TEXT
    )
    """)
    
    # App config key-value table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)
    
    conn.commit()
    conn.close()

def save_config_value(key: str, value: str):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT INTO app_config (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    """, (key, value, now))
    conn.commit()
    conn.close()

def get_config_value(key: str) -> Optional[str]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM app_config WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row["value"] if row else None

def save_issue_embedding(
    repo_full_name: str,
    issue_number: int,
    title: str,
    body_snippet: str,
    state: str,
    embedding: List[float]
):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT INTO repo_embeddings (
        repo_full_name, issue_number, issue_title, issue_body_snippet, state, embedding_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(repo_full_name, issue_number) DO UPDATE SET
        issue_title = excluded.issue_title,
        issue_body_snippet = excluded.issue_body_snippet,
        state = excluded.state,
        embedding_json = excluded.embedding_json,
        updated_at = excluded.updated_at
    """, (
        repo_full_name,
        issue_number,
        title,
        body_snippet[:500],
        state,
        json.dumps(embedding),
        now
    ))
    conn.commit()
    conn.close()

def get_repo_embeddings(repo_full_name: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT issue_number, issue_title, issue_body_snippet, state, embedding_json
    FROM repo_embeddings
    WHERE repo_full_name = ?
    """, (repo_full_name,))
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        results.append({
            "issue_number": r["issue_number"],
            "issue_title": r["issue_title"],
            "issue_body_snippet": r["issue_body_snippet"],
            "state": r["state"],
            "embedding": json.loads(r["embedding_json"])
        })
    return results

def save_triage_record(record: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO triage_records (
        id, repo_full_name, issue_number, issue_title, issue_author,
        category, labels_json, duplicate_match_json, draft_reply_markdown,
        checklist_json, status, github_comment_id, created_at, approved_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        github_comment_id = excluded.github_comment_id,
        approved_at = excluded.approved_at
    """, (
        record["id"],
        record["repo_full_name"],
        record["issue_number"],
        record["issue_title"],
        record["issue_author"],
        record["category"],
        json.dumps(record.get("applied_labels", [])),
        json.dumps(record.get("duplicate_match")),
        record["draft_reply_markdown"],
        json.dumps(record.get("checklist", [])),
        record.get("status", "pending"),
        record.get("github_comment_id"),
        record.get("created_at", datetime.utcnow().isoformat()),
        record.get("approved_at")
    ))
    conn.commit()
    conn.close()

def get_triage_records(limit: int = 20) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM triage_records ORDER BY created_at DESC LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    records = []
    for r in rows:
        records.append({
            "id": r["id"],
            "repo_full_name": r["repo_full_name"],
            "issue_number": r["issue_number"],
            "issue_title": r["issue_title"],
            "issue_author": r["issue_author"],
            "category": r["category"],
            "applied_labels": json.loads(r["labels_json"]),
            "duplicate_match": json.loads(r["duplicate_match_json"]) if r["duplicate_match_json"] else None,
            "draft_reply_markdown": r["draft_reply_markdown"],
            "checklist": json.loads(r["checklist_json"]) if r["checklist_json"] else [],
            "status": r["status"],
            "github_comment_id": r["github_comment_id"],
            "created_at": r["created_at"],
            "approved_at": r["approved_at"]
        })
    return records

def clear_triage_records():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM triage_records")
    conn.commit()
    conn.close()

def get_triage_stats() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as total FROM triage_records")
    total = cursor.fetchone()["total"]
    
    cursor.execute("SELECT COUNT(*) as approved FROM triage_records WHERE status = 'approved'")
    approved = cursor.fetchone()["approved"]
    
    cursor.execute("SELECT COUNT(*) as duplicates FROM triage_records WHERE duplicate_match_json IS NOT NULL AND duplicate_match_json != 'null'")
    duplicates = cursor.fetchone()["duplicates"]
    
    cursor.execute("SELECT labels_json FROM triage_records")
    rows = cursor.fetchall()
    conn.close()
    
    all_confidences = []
    for r in rows:
        try:
            labels = json.loads(r["labels_json"])
            for lbl in labels:
                if isinstance(lbl, dict) and "confidence" in lbl:
                    all_confidences.append(float(lbl["confidence"]))
        except Exception:
            pass
            
    avg_conf = (sum(all_confidences) / len(all_confidences)) if all_confidences else 0.92
    
    return {
        "total_triaged": total,
        "approved": approved,
        "pending": total - approved,
        "duplicates_flagged": duplicates,
        "avg_confidence": round(avg_conf, 2)
    }
