/**
 * Client-side attribution + identity helpers.
 *
 * ref       — short traffic source from ?ref=yt|ig (session-scoped)
 * visitorId — stable id in localStorage (same browser ≈ same person)
 * sessionId — one browser tab-session
 */

const REF_KEY = "exallenge_ref";
const LANDING_KEY = "exallenge_landing";
const VISITOR_KEY = "exallenge_visitor_id";
const SESSION_KEY = "exallenge_session_id";

const ALLOWED_REFS = new Set(["yt", "ig"]);

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function readStorage(storage: Storage, key: string): string {
  try {
    return storage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeStorage(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // private mode / quota — ignore
  }
}

export function getVisitorId(): string {
  let id = readStorage(localStorage, VISITOR_KEY);
  if (!id) {
    id = randomId();
    writeStorage(localStorage, VISITOR_KEY, id);
  }
  return id;
}

export function getSessionId(): string {
  let id = readStorage(sessionStorage, SESSION_KEY);
  if (!id) {
    id = randomId();
    writeStorage(sessionStorage, SESSION_KEY, id);
  }
  return id;
}

/** Capture ?ref= on first hit and remember for the tab session. */
export function captureRefFromUrl(): string {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  const raw = (params.get("ref") ?? "").trim().toLowerCase();
  if (raw && ALLOWED_REFS.has(raw)) {
    writeStorage(sessionStorage, REF_KEY, raw);
  }

  if (!readStorage(sessionStorage, LANDING_KEY)) {
    writeStorage(
      sessionStorage,
      LANDING_KEY,
      `${window.location.pathname}${window.location.search}`.slice(0, 512),
    );
  }

  return getRef();
}

export function getRef(): string {
  return readStorage(sessionStorage, REF_KEY);
}

export function getLanding(): string {
  return readStorage(sessionStorage, LANDING_KEY);
}

export function clientContext() {
  let timezone = "";
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    timezone = "";
  }

  return {
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    ref: getRef(),
    landing: getLanding(),
    referrer: typeof document !== "undefined" ? document.referrer.slice(0, 512) : "",
    language:
      typeof navigator !== "undefined"
        ? (navigator.language || "").slice(0, 64)
        : "",
    timezone: timezone.slice(0, 64),
    screen:
      typeof window !== "undefined"
        ? `${window.screen.width}x${window.screen.height}`
        : "",
  };
}

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/$/, "");

export async function trackVisit(): Promise<void> {
  captureRefFromUrl();
  const ctx = clientContext();
  const body = JSON.stringify({
    ...ctx,
    path: window.location.pathname || "/",
  });

  const url = `${API_BASE}/api/visit`;

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // analytics must never break the page
  }
}

export async function submitWaitlist(input: {
  email: string;
  placement: string;
}): Promise<{ ok: boolean; message?: string; error?: string }> {
  captureRefFromUrl();
  const ctx = clientContext();
  const url = `${API_BASE}/api/waitlist`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      placement: input.placement,
      ...ctx,
    }),
  });

  const data = (await response.json()) as {
    ok?: boolean;
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    return { ok: false, error: data.error ?? "Something went wrong. Try again." };
  }
  return {
    ok: true,
    message:
      data.message ??
      "Thanks — check your inbox. We'll send access instructions soon.",
  };
}
