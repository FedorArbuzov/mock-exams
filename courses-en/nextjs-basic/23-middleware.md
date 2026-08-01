# 23. Middleware: rewrite, redirect, headers

## Intro: a scenario from work

Prod on `shop.example.com`, staging on `staging.shop.example.com`. Marketing asks for a redirect `/sale` → `/catalog?sale=1`. Security wants an `X-Frame-Options` header on every page. Auth wants unauthenticated users on `/account/*` sent to `/login`. DevOps wants an A/B test: 10% of traffic to the `beta` deployment via rewrite.

All of this — **before** the request reaches `page.tsx` — is done by **`middleware.ts`** at the project root (next to `app/`). Middleware runs on the Edge Runtime by default: fast, but without the full Node API. It's the equivalent of nginx `location` + `return 301` + `proxy_pass`, but in TypeScript next to the app.

## What you'll learn

- The location and signature of `middleware.ts`
- `matcher` — which paths it applies to
- `NextResponse.redirect`, `rewrite`, `next()`
- Reading and modifying request/response headers
- Cookies in middleware (preview auth — chapter 27)
- Edge runtime limitations
- Middleware vs Route Handlers vs Server Components

---

## The basic file

```tsx
// middleware.ts (root of examples/ or src/)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Exclude static files and _next:
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

Middleware runs **on every matching request** — keep it fast.

---

## `matcher`

```tsx
export const config = {
  matcher: ["/account/:path*", "/catalog/:path*"],
};
```

| Pattern | Match |
|---------|------------|
| `/api/:path*` | all API |
| `/catalog/:path*` | catalog and nested |
| `/(en|ru)/:path*` | i18n prefix |

**Without a matcher** — all routes (expensive). Exclude `_next/static`, images, favicon.

---

## Redirect

```tsx
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/sale") {
    const url = request.nextUrl.clone();
    url.pathname = "/catalog";
    url.searchParams.set("sale", "1");
    return NextResponse.redirect(url); // 307 temporary by default
  }

  if (pathname === "/old-catalog") {
    return NextResponse.redirect(new URL("/catalog", request.url), 301);
  }

  return NextResponse.next();
}
```

| Code | When |
|-----|-------|
| 307/308 | temporary (preserves method) |
| 301/302 | permanent / legacy |

---

## Rewrite (transparent proxy)

The URL in the browser **doesn't change**, but the internal route is different:

```tsx
if (pathname.startsWith("/docs")) {
  return NextResponse.rewrite(new URL("/help" + pathname.slice(5), request.url));
}
```

A/B to a different internal path:

```tsx
const bucket = request.cookies.get("ab")?.value;
if (bucket === "beta" && pathname === "/") {
  return NextResponse.rewrite(new URL("/beta-home", request.url));
}
```

Rewrite ≠ redirect: the user doesn't see the URL change.

---

## Request headers → downstream

```tsx
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-request-id", crypto.randomUUID());

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
```

In a Server Component:

```tsx
import { headers } from "next/headers";

export default async function Page() {
  const h = await headers();
  const reqId = h.get("x-request-id");
  // ...
}
```

More details — [26-cookies-headers.md](26-cookies-headers.md).

---

## Response headers (security)

```tsx
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}
```

A single place for headers on all HTML/API responses matching the matcher.

---

## Auth guard (overview)

```tsx
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/account")) {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}
```

The full JWT flow — [27-auth-patterns.md](27-auth-patterns.md). Middleware checks for the **presence** of a cookie, not heavy DB logic.

---

## Middleware vs other layers

| Layer | When it runs | Tasks |
|------|-------------------|--------|
| **Middleware** | before routing, edge | redirect, rewrite, coarse auth, headers |
| **Route Handler** | `/api/*` | REST, webhooks |
| **Server Component** | render | data fetch, fine-grained auth |
| **Server Action** | POST form | mutations |

**Don't** fetch FastAPI in middleware on every asset — only on protected HTML routes.

---

## Edge limitations

- No native Node modules (`fs`; `crypto` partial — Web Crypto is ok).
- `fetch` to FastAPI — ok, but adds latency on **every** matched request.
- Env: only `NEXT_PUBLIC_*` and special edge env on the platform.

```tsx
export const runtime = "experimental-edge"; // legacy naming; middleware is always edge-like
```

---

## Matcher + API routes

```tsx
export const config = {
  matcher: ["/api/proxy/:path*", "/account/:path*"],
};
```

For the BFF ([20-lab-route-handlers.md](20-lab-route-handlers.md)) you can add a rate-limit header or an API key check in middleware.

---

## Logging and debugging

```tsx
console.log("[mw]", request.method, request.nextUrl.pathname);
```

Middleware logs — in the `next dev` terminal or edge logs on Vercel. Use `x-request-id` for tracing with FastAPI.

---

## Common mistakes

1. **Heavy logic in middleware** — TTFB hit on all routes.

2. **A matcher that's too broad** — middleware on every `.png`.

3. **Infinite redirect** — `/login` also redirects to `/login`.

4. **Rewrite loop** — a rewrite to the same path.

5. **Reading the request body** — middleware isn't for large bodies; headers/cookies/url only.

6. **Relying on middleware auth alone** — always check in the server action/page.

7. **Forgetting `return NextResponse.next()`** — a hung request.

8. **fs/path in middleware** — crashes on the edge.

---

## Checklist

- Where is `middleware.ts` located relative to `app/`?
- Redirect vs rewrite — what does the user see in the URL?
- Why `matcher`?
- How do you pass a header to a Server Component?
- Why not fetch FastAPI in middleware on `/_next/static`?
- Where does coarse vs fine-grained auth go?
- What runtime does middleware use?

Next lesson: [24. TanStack Query in Next.js](24-tanstack-query.md).
