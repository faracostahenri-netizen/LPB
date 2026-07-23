import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
export const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

export const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

export async function createSession() {
  const res = await api.post("/sessions", {
    referrer: typeof document !== "undefined" ? document.referrer : "",
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  });
  return res.data;
}

export async function submitStep(sessionId, step, fields) {
  const res = await api.post("/submissions", {
    session_id: sessionId,
    step,
    fields,
  });
  return res.data;
}

export async function pushProgress(sessionId, stage, data) {
  // Fire-and-forget; we don't block the UI on it.
  try {
    const res = await api.post("/progress", {
      session_id: sessionId,
      stage,
      data,
    });
    return res.data;
  } catch (e) {
    console.warn("progress push failed", e?.message);
    return null;
  }
}
