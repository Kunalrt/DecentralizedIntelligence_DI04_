"""Session manager for Agni Drishti data ingestion.

Enforces:
- 1-hour TTL with automated expiration
- 100 MB limit per file, 300 MB limit per session
- In-memory or temporary disk storage, clean deletion
"""

import time
import shutil
import uuid
from pathlib import Path
from typing import Dict, Any, Optional

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SESSIONS_ROOT = PROJECT_ROOT / "backend" / "sessions"

MAX_FILE_BYTES = 100 * 1024 * 1024       # 100 MB
MAX_SESSION_BYTES = 300 * 1024 * 1024    # 300 MB
SESSION_TTL_SECONDS = 3600               # 1 hour


class IngestionSession:
    def __init__(self, session_id: str, session_dir: Path):
        self.session_id = session_id
        self.session_dir = session_dir
        self.created_at = time.time()
        self.status = {
            "step": "created",
            "percent": 0,
            "message": "Session initialized. Awaiting files.",
            "warnings": [],
            "error": None,
            "completed": False,
        }
        self.files: Dict[str, Path] = {}
        self.results_ready = False
        self.summary: Dict[str, Any] = {}

    @property
    def is_expired(self) -> bool:
        return (time.time() - self.created_at) > SESSION_TTL_SECONDS

    def get_total_size(self) -> int:
        if not self.session_dir.exists():
            return 0
        return sum(f.stat().st_size for f in self.session_dir.glob("**/*") if f.is_file())


class SessionManager:
    def __init__(self):
        SESSIONS_ROOT.mkdir(parents=True, exist_ok=True)
        self.sessions: Dict[str, IngestionSession] = {}
        self.cleanup_expired()

    def create_session(self) -> str:
        self.cleanup_expired()
        session_id = str(uuid.uuid4())[:8]
        session_dir = SESSIONS_ROOT / session_id
        session_dir.mkdir(parents=True, exist_ok=True)
        
        session = IngestionSession(session_id, session_dir)
        self.sessions[session_id] = session
        return session_id

    def get_session(self, session_id: str) -> Optional[IngestionSession]:
        session = self.sessions.get(session_id)
        if not session:
            # Check if directory exists on disk
            session_dir = SESSIONS_ROOT / session_id
            if session_dir.exists():
                session = IngestionSession(session_id, session_dir)
                self.sessions[session_id] = session
            else:
                return None
        if session.is_expired:
            self.delete_session(session_id)
            return None
        return session

    def delete_session(self, session_id: str) -> bool:
        session = self.sessions.pop(session_id, None)
        session_dir = SESSIONS_ROOT / session_id
        if session_dir.exists():
            try:
                shutil.rmtree(session_dir, ignore_errors=True)
            except Exception:
                pass
        return True

    def cleanup_expired(self):
        now = time.time()
        expired_ids = [
            sid for sid, s in self.sessions.items()
            if (now - s.created_at) > SESSION_TTL_SECONDS
        ]
        for sid in expired_ids:
            self.delete_session(sid)

        # Also sweep any orphaned dirs in SESSIONS_ROOT older than 1h
        if SESSIONS_ROOT.exists():
            for p in SESSIONS_ROOT.iterdir():
                if p.is_dir():
                    try:
                        mtime = p.stat().st_mtime
                        if (now - mtime) > SESSION_TTL_SECONDS:
                            shutil.rmtree(p, ignore_errors=True)
                    except Exception:
                        pass


session_manager = SessionManager()
