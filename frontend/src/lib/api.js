import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

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
