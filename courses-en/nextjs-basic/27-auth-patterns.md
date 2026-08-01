# 27. Auth patterns: JWT, session (overview)

## Intro: a scenario from work

The shop adds `/account/orders`. A junior puts the JWT in `localStorage` and sends `Authorization: Bearer` from a Client Component — security review: "XSS = full account takeover." The alternative is an **httpOnly cookie** with the access token, refresh via a Route Handler, and **middleware** that blocks `/account/*` without the cookie. A full-blown Auth.js / Clerk is out of scope for this course; here we give an **architectural overview** without vendor lock-in, with the FastAPI sandbox `:8090` as the resource server.

The goal is to understand **where** to check auth in the Next.js App Router and **how** not to leak the token into the client bundle. Refresh rotation details — [react-intermediate](../react-intermediate/README.md).

## What you'll learn

- The session vs JWT mental model
- The httpOnly cookie flow for an SPA/Next hybrid
- Middleware coarse guard
- Server Component / Action fine-grained check
- Route Handler login/logout/refresh
- What **not** to do (localStorage JWT)
- Integration with FastAPI (Bearer vs cookie BFF)

---

## Authentication models

| Model | Where the state lives | Pros | Cons |
|--------|-----------|-------|--------|
| **Server session** | Redis/DB, cookie = session id | revoke instantly | state on the server |
| **JWT access** | self-contained, cookie or header | stateless API | harder to revoke |
| **OAuth social** | provider + your session | UX | complexity |

A Next.js BFF often uses: **JWT in an httpOnly cookie**, FastAPI validates the Bearer that the BFF adds server-side.

---

## Recommended flow (simplified)

```text
Browser                    Next.js BFF                 FastAPI :8090
   │                            │                            │
   │ POST /api/auth/login       │                            │
   │ email/password────────────►│ POST /auth/login──────────►│
   │                            │◄──── access + refresh ─────│
   │◄── Set-Cookie httpOnly ────│                            │
   │                            │                            │
   │ GET /account (cookie)      │                            │
   │───────────────────────────►│ middleware: cookie exists?   │
   │                            │ RSC: verify JWT / session    │
   │                            │ GET /me/orders + Bearer────►│
   │◄── HTML ───────────────────│                            │
```

---

## Login Route Handler

```tsx
// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ detail: "Invalid body" }, { status: 400 });
  }

  const upstream = await fetch(
    `${process.env.FASTAPI_URL}/api/v1/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    },
  );

  if (!upstream.ok) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { access_token, expires_in } = await upstream.json();

  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expires_in ?? 3600,
    path: "/",
  });

  return res;
}
```

On the minimal course sandbox the auth endpoint may not exist — use a mock token for local practice.

---

## Logout

```tsx
// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  return res;
}
```

The Server Action alternative — `cookies().delete('access_token')`.

---

## Middleware guard

```tsx
// middleware.ts (fragment)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/account", "/checkout"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }
    // optional: a lightweight JWT exp check without verifying the signature
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*"],
};
```

Middleware is **not** a substitute for verifying the signature; only "the cookie exists and isn't obviously expired."

---

## Fine-grained check in a Server Component

```tsx
// app/account/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function getCurrentUser() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;

  const res = await fetch(`${process.env.FASTAPI_URL}/api/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <h1>Hi, {user.email}</h1>;
}
```

**Defense in depth:** middleware + server verify.

---

## Server Action authorization

```tsx
"use server";

import { cookies } from "next/headers";

export async function cancelOrder(orderId: string) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(
    `${process.env.FASTAPI_URL}/api/v1/orders/${orderId}/cancel`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.ok) throw new Error("Failed");
  revalidatePath("/account/orders");
}
```

Never accept a `userId` from a hidden form field alone — trust the server session.

---

## Anti-patterns

| ❌ | Why |
|----|--------|
| JWT in `localStorage` | XSS → steal |
| JWT in `NEXT_PUBLIC_*` | ends up in the client bundle |
| Auth only in a client `useEffect` | flash + bypass |
| Trusting a client `isAdmin` flag | trivial to forge |
| A long-lived access token without refresh | large theft window |

---

## Refresh token (overview)

- **Refresh** — a separate httpOnly cookie, path `/api/auth/refresh` only.
- Access short (15 min), refresh long (7 d).
- Rotation: a new refresh on each use, detect reuse.

Route Handler `POST /api/auth/refresh` — server-only, called from the client via a same-origin fetch or silent middleware (advanced).

---

## CSRF

Same-site cookies + `sameSite: lax` — the baseline. Server Actions — a built-in origin check. For cookie-based API mutations — a CSRF token or the double-submit cookie pattern ([browser-platform](../javascript-path.md)).

---

## RBAC overview

```tsx
type Role = "user" | "admin";

function requireRole(user: { role: Role }, role: Role) {
  if (user.role !== role) redirect("/403");
}
```

Admin routes — a separate matcher in middleware + a server-side check of the role claim in the JWT.

---

## Relation to FastAPI

FastAPI expects `Authorization: Bearer` ([fastapi](../../deploy/fastapi/README.md) JWT lessons in the Python track). The Next BFF:

1. Browser → cookie only.
2. Next server → Bearer to FastAPI.
3. FastAPI isn't exposed publicly in prod (internal network).

---

## Common mistakes

1. **Verifying the JWT only in middleware** — without a crypto verify on the server page.

2. **Access token in the URL query** — logs, referrer leak.

3. **Logout on the client only** — the cookie remains.

4. **Static cache for /account** — cookies() makes it dynamic — ok.

5. **Forwarding the raw cookie to FastAPI** when the API expects a Bearer — format mismatch.

6. **Skipping auth on Server Actions** — public POST vulnerability.

7. **Mock auth in production** — remove the dev bypass.

8. **A one-year access token** — the refresh pattern is ignored.

---

## Checklist

- Where do you store the access token for a web app?
- The role of middleware vs an RSC auth check?
- How does Next call FastAPI on behalf of the user?
- Why is a localStorage JWT bad?
- Where does logout delete the cookie?
- What does a Server Action check before a mutation?
- Why is the refresh token separate from the access token?

Next lesson: [28. Environment variables and config](28-env-config.md).
