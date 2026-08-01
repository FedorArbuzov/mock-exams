# 20. Lab: proxying to FastAPI through Next

## Scenario

Ticket **NEXT-220**: "Client components shouldn't know the FastAPI URL. A single entry point `/api/proxy/...`". You build a BFF from [19-route-handlers.md](19-route-handlers.md): a Route Handler proxies GET to `:8090`, with the `FASTAPI_URL` env and correct status codes.

**Time:** ~45–60 minutes.  
**Sandbox:** FastAPI `:8090` + Next `:3000`.

---

## Setup

```bash
# Terminal 1
cd deploy/fastapi && docker compose up -d --build

# Terminal 2
cd courses/nextjs-basic/examples
cp .env.example .env.local
npm run dev
```

`.env.local`:

```env
FASTAPI_URL=http://localhost:8090
NEXT_PUBLIC_API_URL=http://localhost:3000/api/proxy
```

---

## Task 1. Health BFF

Create `app/api/health/route.ts`:

```tsx
import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.FASTAPI_URL ?? "http://localhost:8090";
  try {
    const res = await fetch(`${base}/health`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(
      { bff: "ok", upstream: data },
      { status: res.ok ? 200 : 502 },
    );
  } catch {
    return NextResponse.json({ bff: "ok", upstream: null }, { status: 502 });
  }
}
```

```bash
curl http://localhost:3000/api/health
```

---

## Task 2. A universal proxy `[...path]`

A catch-all proxies any path under `/api/proxy/` → FastAPI `/api/v1/...`.

```tsx
// app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

type Context = { params: Promise<{ path: string[] }> };

function upstreamBase(): string {
  return process.env.FASTAPI_URL ?? "http://localhost:8090";
}

async function proxy(request: NextRequest, context: Context) {
  const { path } = await context.params;
  const targetPath = path.join("/");
  const url = new URL(`/api/v1/${targetPath}`, upstreamBase());
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers();
  headers.set("Accept", "application/json");
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  let body: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch (err) {
    console.error("Proxy fetch failed", err);
    return NextResponse.json({ detail: "Upstream unavailable" }, { status: 502 });
  }

  const responseBody = await upstream.text();
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
```

---

## Task 3. Testing the proxy

```bash
curl http://localhost:3000/api/proxy/items
curl http://localhost:3000/api/proxy/items/1
curl -i http://localhost:3000/api/proxy/items/999
```

| Request | Expected |
|--------|----------|
| `/api/proxy/items` | 200, JSON `{ items, total }` |
| `/api/proxy/items/1` | 200, an item object |
| `/api/proxy/items/999` | 404 from FastAPI, status forwarded |

---

## Task 4. Client fetch through the BFF

Create a Client Component to test (temporarily):

```tsx
// components/dev/ProxyItemsProbe.tsx
"use client";

import { useEffect, useState } from "react";

export function ProxyItemsProbe() {
  const [text, setText] = useState("loading…");

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";
    fetch(`${base}/items`)
      .then((r) => r.json())
      .then((data) => setText(JSON.stringify(data, null, 2)))
      .catch((e) => setText(String(e)));
  }, []);

  return (
    <pre className="card" style={{ fontSize: "0.85rem" }}>
      {text}
    </pre>
  );
}
```

Add it to the home page or `/catalog` for dev only. **No CORS errors** — same origin.

---

## Task 5. Update the server loader (optional)

In `lib/api/items.ts` you can switch the server fetch to the BFF:

```tsx
function baseUrl(): string {
  // server-side: hitting FastAPI directly is faster (one less hop)
  return process.env.FASTAPI_URL ?? "http://localhost:8090";
  // client-only code uses NEXT_PUBLIC_API_URL
}
```

**Course rule:** RSC → FastAPI directly; browser → `/api/proxy`. Discuss the latency vs single-URL trade-off with your team.

---

## Success criteria

- [ ] `GET /api/health` shows the upstream status
- [ ] `GET /api/proxy/items` returns the catalog
- [ ] 404/502 are forwarded with the correct status
- [ ] `FASTAPI_URL` is not in `NEXT_PUBLIC_*`
- [ ] The client probe works without CORS

---

## Common issues

| Symptom | Fix |
|---------|---------|
| 404 on the proxy | check `[...path]` and the `/` join |
| HTML instead of JSON | the upstream URL is wrong |
| 502 always | FastAPI is down or `FASTAPI_URL` is wrong |
| Double `/api/v1` | don't duplicate the prefix in the path |

---

Next lesson: [21. Server Actions: forms without a separate API](21-server-actions.md).
