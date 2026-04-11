import hashlib
import os
import sqlite3
from datetime import datetime


def _connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str, default_users: dict) -> None:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    with _connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sync_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider TEXT NOT NULL,
                status TEXT NOT NULL,
                detail TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        for username, data in default_users.items():
            cur = conn.execute("SELECT username FROM users WHERE username=?", (username,))
            if cur.fetchone() is None:
                conn.execute(
                    "INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
                    (username, data["hash"], data["role"], datetime.utcnow().isoformat()),
                )
        conn.commit()


def list_users(db_path: str) -> list[dict]:
    with _connect(db_path) as conn:
        rows = conn.execute("SELECT username, role FROM users ORDER BY username").fetchall()
    return [{"username": r["username"], "role": r["role"]} for r in rows]


def get_user(db_path: str, username: str) -> dict | None:
    with _connect(db_path) as conn:
        row = conn.execute(
            "SELECT username, password_hash, role FROM users WHERE username=?", (username,)
        ).fetchone()
    if row is None:
        return None
    return {
        "username": row["username"],
        "hash": row["password_hash"],
        "role": row["role"],
    }


def verify_user(db_path: str, username: str, password: str) -> dict | None:
    user = get_user(db_path, username)
    if not user:
        return None
    candidate = hashlib.sha256(password.encode("utf-8")).hexdigest()
    if candidate == user["hash"]:
        return user
    return None


def save_sync_run(db_path: str, provider: str, status: str, detail: str = "") -> None:
    with _connect(db_path) as conn:
        conn.execute(
            "INSERT INTO sync_runs (provider, status, detail, created_at) VALUES (?, ?, ?, ?)",
            (provider, status, detail, datetime.utcnow().isoformat()),
        )
        conn.commit()


def list_sync_runs(db_path: str, limit: int = 20) -> list[dict]:
    with _connect(db_path) as conn:
        rows = conn.execute(
            "SELECT id, provider, status, detail, created_at FROM sync_runs ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [
        {
            "id": r["id"],
            "provider": r["provider"],
            "status": r["status"],
            "detail": r["detail"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]
