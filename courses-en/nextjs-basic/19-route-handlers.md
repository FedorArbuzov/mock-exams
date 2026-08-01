# 19. Route Handlers: REST inside `app/api`

## Introduction: a scenario from work

The mobile app and the web client hit FastAPI on `:8090` directly — and a security audit flags it: "API key baked into the mobile APK, CORS `*` on the backend, PII in the logs." The architect proposes a **BFF** (Backend for Frontend): the browser and mobile only talk to Next.js `/api/*`, and Next proxies to FastAPI server-side using secrets from env.

In the App Router, **Route Handlers** are files named `route.ts` that sit next to pages, but they **don't render HTML**. Think of them as your Express/FastAPI route living inside Next: `GET`, `POST`, JSON, headers, status codes. The lab in [20-lab-route-handlers.md](20-lab-route-handlers.md) builds a proxy to `:8090`.

## What you'll learn

- The `app/api/.../route.ts` structure
- Exporting `GET`, `POST`, `PUT`, `DELETE`, …
- `NextRequest`, `NextResponse`
- The BFF pattern: hiding the FastAPI URL
- Error handling and status forwarding
- Route Handlers vs Server Actions
- Dynamic/static behavior for API routes

---

## The file convention

```text
app/
  api/
    health/
      route.ts          → GET /api/health
    v1/
      items/
        route.ts        → GET/POST /api/v1/items
        [id]/
          route.ts      → GET /api/v1/items/:id
```

The file must be named **`route.ts`** (or `route.js`). A **`page.tsx`** in the same folder conflicts with it — you can't mix a UI page and a route handler in one segment.

---

## Minimal GET

```tsx
// app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "nextjs-bff",
    timestamp: new Date().toISOString(),
  });
}
```

To test it:

```bash
curl http://localhost:3000/api/health
```

---

## GET proxying to FastAPI

```tsx
// app/api/v1/items/route.ts
import { NextResponse } from "next/server";

function fastApiBase(): string {
  return process.env.FASTAPI_URL ?? "http://localhost:8090";
}

export async function GET() {
  let upstream: Response;

  try {
    upstream = await fetch(`${fastApiBase()}/api/v1/items`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    console.error("FastAPI unreachable", err);
    return NextResponse.json(
      { detail: "Upstream unavailable" },
      { status: 502 },
    );
  }

  const body = await upstream.text();

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
```

The browser sees a **same-origin** `localhost:3000` — **no CORS** needed for a client fetch to `/api/v1/items`.

---

## POST with a body and validation

```tsx
// app/api/v1/contact/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const ContactSchema = z.object({
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // BFF: forward, save to DB, or queue
  console.info("Contact form", parsed.data.email);

  return NextResponse.json({ ok: true }, { status: 201 });
}
```

```bash
curl -X POST http://localhost:3000/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","message":"Hello from curl"}'
```

---

## Dynamic segments

```tsx
// app/api/v1/items/[id]/route.ts
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const res = await fetch(
    `${process.env.FASTAPI_URL ?? "http://localhost:8090"}/api/v1/items/${id}`,
    { cache: "no-store" },
  );

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
```

---

## `NextRequest` — query params and headers

```tsx
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const auth = request.headers.get("authorization");

  const url = new URL("/api/v1/items", fastApiBase());
  if (q) url.searchParams.set("q", q);

  const upstream = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(auth ? { Authorization: auth } : {}),
    },
  });

  return NextResponse.json(await upstream.json(), { status: upstream.status });
}
```

---

## Route Handlers vs Server Actions

| | Route Handlers | Server Actions |
|---|----------------|----------------|
| URL | `/api/...` REST | no URL, POST form/RPC |
| Client | any HTTP client | forms, `useTransition` |
| Cache | HTTP semantics | no |
| OpenAPI / mobile | **yes** | no |
| Form without JS | more work | **ideal** |

For the shop: **catalog for mobile** → Route Handler BFF; **contact form** → Server Action ([21-server-actions.md](21-server-actions.md)).

---

## CORS for external origins

If a Route Handler needs to accept requests from an origin that **isn't** your Next app:

```tsx
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://partner.example.com",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
```

For a same-origin client (TanStack Query hitting `/api/...`), you don't need CORS at all.

---

## Runtime: Edge vs Node

```tsx
export const runtime = "nodejs"; // default — full Node API
// export const runtime = "edge"; // lighter cold start, some limitations (missing npm packages)
```

A FastAPI proxy using plain `fetch` is fine with **nodejs**. Reach for Edge only if you deploy to the edge and don't need native modules.

---

## Dynamic config

```tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

API routes using `cookies()`, auth, or a proxy are usually **dynamic**. Don't let a CDN cache personalized responses without an explicit policy.

---

## BFF security

1. **Secrets** live only in server env — never `NEXT_PUBLIC_*`.
2. **Validate** input (Zod) before forwarding it.
3. **Rate limit** — via middleware ([23-middleware.md](23-middleware.md)) or upstream.
4. **Don't** blindly forward all headers/cookies to FastAPI.
5. **Logs** should never contain PII or tokens.

---

## Common mistakes

1. **`page.tsx` instead of `route.ts`** — 404 or the wrong handler runs.

2. **Forgetting `await request.json()`** — empty body.

3. **Returning a `Response` without a status** — always 200 even when upstream fails.

4. **Exposing internal FastAPI errors** — forward a sanitized `detail` instead.

5. **Duplicating business logic** across the BFF and the RSC — pull it into `lib/api/`.

6. **CORS `*` combined with credentials** — an invalid combination in browsers.

7. **Large bodies with no limit** — a DoS vector; check `Content-Length`.

8. **Using a Route Handler for everything** — forms are simpler as Server Actions.

---

## Checklist

- Which file creates the `/api/health` endpoint?
- Why do you need a BFF if FastAPI already exists?
- How do you return a 502 when the upstream is down?
- Route Handler vs Server Action — when does each apply?
- Do you need CORS for a fetch to `/api/v1/items` from the same Next page?
- Where should `FASTAPI_URL` live for the handler?
- Can `page.tsx` and `route.ts` coexist in the same folder?

Next lesson: [20. Lab: proxying to FastAPI via Next](20-lab-route-handlers.md).
