# 18. CORS, the Vite proxy, and FastAPI :8090

## A scenario from work

Locally Vite is on `http://localhost:5173`, the FastAPI shop API on `http://localhost:8090`. In the Network tab the request is "red", and in the console:

```text
Access to fetch at 'http://localhost:8090/api/v1/items' from origin
'http://localhost:5173' has been blocked by CORS policy
```

The backend developer says: "Our API works — curl responds, after all." The frontend replies: "It works in Postman too." Both are right: **CORS is a browser policy**, not the server "in a vacuum". In mock-exams there are two working paths: the **Vite dev proxy** (no CORS in dev) and **CORSMiddleware** on FastAPI (when the origin is explicitly allowed).

## What you'll learn

- Origin, same-origin, preflight
- Configuring a proxy in `vite.config.ts` for `/api`
- CORS on the [deploy/fastapi](../../deploy/fastapi/README.md) stand
- The shop API contract: items, health, OpenAPI
- Dev vs production: env, BFF, nginx

---

## Same-origin and CORS

**Origin** = scheme + host + port:

| URL | Origin |
|-----|--------|
| `http://localhost:5173` | `http://localhost:5173` |
| `http://localhost:8090` | `http://localhost:8090` |

The ports are **different** → a **cross-origin** fetch from the browser. The server must explicitly allow the client origin with a header:

```http
Access-Control-Allow-Origin: http://localhost:5173
```

Without it, the browser **doesn't give** JS access to the response (the request may have gone out, but `response` is inaccessible).

**Node/curl/Postman** don't apply CORS — only the browser does ([29-fetch.md](../javascript-basic/29-fetch.md)).

---

## Preflight OPTIONS

For "non-standard" requests (a JSON POST with `Content-Type: application/json`, custom headers), the browser first sends an **OPTIONS**. FastAPI + Starlette CORSMiddleware answers the preflight automatically with the correct configuration.

---

## Solution 1: Vite proxy (dev)

In [`examples/vite.config.ts`](examples/vite.config.ts) it's already configured:

```ts
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8090",
        changeOrigin: true,
      },
    },
  },
});
```

The browser hits the **same origin** as Vite:

```tsx
// same-origin for the browser: localhost:5173/api/...
const res = await fetch("/api/v1/items");
```

Vite proxies to `http://localhost:8090/api/v1/items`. **No CORS needed** between the browser and Vite.

```text
Browser ──GET /api/v1/items──► Vite :5173 ──proxy──► FastAPI :8090
         (same origin 5173)                        (server-to-server)
```

Checking health through the proxy (if you add a rule or hit it directly):

```bash
curl http://localhost:8090/health
```

---

## Solution 2: CORS on FastAPI

When the SPA and the API are on **different** origins in dev **without** a proxy, or in staging:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8097",  # deploy/react — optional
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

On the mock-exams stand, see the `deploy/fastapi` sources. **`allow_origins=["*"]` + credentials** — not allowed by the spec; in prod — specific domains.

More on REST and security: [api-design](../api-design/README.md).

---

## Starting the :8090 stand

```bash
cd deploy/fastapi
docker compose up -d --build
```

| URL | Purpose |
|-----|------------|
| [http://localhost:8090](http://localhost:8090) | API root |
| [http://localhost:8090/docs](http://localhost:8090/docs) | Swagger UI |
| [http://localhost:8090/health](http://localhost:8090/health) | health check |
| [http://localhost:8090/api/v1/items](http://localhost:8090/api/v1/items) | the shop catalog |

Smoke:

```bash
bash deploy/fastapi/scripts/smoke.sh
# .\deploy\fastapi\scripts\smoke.ps1
```

Without the stand running, labs [19-lab-fetch-items.md](19-lab-fetch-items.md) and beyond will show a network error.

---

## The Items API contract (overview)

A typical catalog element (verify in `/docs`):

```json
{
  "id": 1,
  "name": "Demo Item",
  "price": 19.99,
  "description": "..."
}
```

| Method | Path | Action |
|-------|------|----------|
| GET | `/api/v1/items` | list |
| GET | `/api/v1/items/{id}` | one product |
| POST | `/api/v1/items` | create (Query labs) |
| PUT/PATCH | `/api/v1/items/{id}` | update |
| DELETE | `/api/v1/items/{id}` | delete |

Statuses: 200/201 success, 404 not found, 422 validation — a JSON body with `detail` ([17-fetch-react.md](17-fetch-react.md)).

---

## Production: don't hardcode :8090

```tsx
const base = import.meta.env.VITE_API_URL ?? "";
await fetch(`${base}/api/v1/items`);
```

mock-exams deployment options:

- **nginx** serves the SPA and proxies `/api` to the backend ([deploy/nginx](../../deploy/nginx/README.md));
- a **BFF** on nodejs at `:8096` ([javascript-path.md](../javascript-path.md));
- CORS only if the SPA and API are on different public domains.

Dev: proxy. Prod: a single origin or an explicit CORS whitelist.

---

## Debugging CORS

| Symptom | Check |
|---------|----------|
| CORS error in the console | origin in `allow_origins`? or use a proxy |
| 502 from the Vite proxy | FastAPI isn't running on 8090 |
| OPTIONS 405 | middleware not wired up |
| curl works, the browser doesn't | expected — no CORS in curl |

In DevTools → Network, look at the **Request URL** (5173 vs 8090) and the response headers.

---

## Relation to other courses

- JS fetch: [29-fetch.md](../javascript-basic/29-fetch.md)
- React fetch UI: [17-fetch-react.md](17-fetch-react.md)
- FastAPI course: [fastapi](../fastapi/README.md)
- Browser security: [javascript-path.md](../javascript-path.md) → browser-platform

---

## Common mistakes

1. **`fetch('http://localhost:8090/...')` from Vite without CORS** — blocked; use `/api/...`.

2. **Proxy only for `/api`, but health is hit on 8090** — CORS again.

3. **`allow_origins=*` with cookies** — the browser rejects it.

4. **Forgot `changeOrigin: true`** — rare issues with virtual hosts.

5. **Production build via `file://` or a different port** — the origin isn't in the whitelist.

6. **Confusing network-down and CORS** — both are red, but the message differs.

---

## Summary

CORS restricts cross-origin requests in the browser. In mock-exams dev, the **Vite proxy** is convenient: `/api` → `:8090`. An alternative is CORSMiddleware on FastAPI with an explicit `http://localhost:5173`. The shop API stand — [deploy/fastapi](../../deploy/fastapi/README.md), port **8090**. See the contract in Swagger. In prod — env, a reverse proxy, or a BFF, not bare localhost in the client.

---

## Checklist

- Why doesn't curl to :8090 prove the absence of CORS?
- How does the browser see the URL with the Vite proxy?
- Where do you enable CORSMiddleware in FastAPI?
- How do you bring up the mock-exams stand?
- What's the product list path?
- How does the dev proxy differ from prod nginx?

Next lesson: [19. Lab: product list with the API](19-lab-fetch-items.md).
