# 20. Client for FastAPI `:8090`

## Scenario from the field

The team is standing up a shop stack: FastAPI on **8090**, and your BFF on **3096** is supposed to proxy the catalog. You write `fetch("localhost:8090/health")` — `TypeError: Invalid URL`. After fixing that you get `Connection refused` — you forgot `docker compose up` in [`deploy/fastapi`](../../deploy/fastapi/README.md). QA gets an empty list back — they're parsing `{ data: items }`, but the API returns either a bare array or a differently-shaped wrapper. This lesson is the **first live connection** from the Node BFF to the Python mock-exams backend.

## What you'll learn

- Running the FastAPI stand at `:8090`
- The `/health` and `/api/v1/items` endpoints
- A `fetch`-based client with an `API_BASE_URL` env var
- Comparing the FastAPI contract with the local JSON BFF
- Smoke checks with curl and Node
- Groundwork for the BFF proxy (chapters 32-34)

---

## The deploy/fastapi stand

From the repo root:

```bash
cd deploy/fastapi
docker compose up -d --build
docker compose ps
```

| URL | Purpose |
|-----|------------|
| http://localhost:8090/health | liveness |
| http://localhost:8090/api/v1/items | product list |
| http://localhost:8090/docs | Swagger UI |
| http://localhost:8090/metrics | Prometheus |

Smoke test:

```bash
bash scripts/smoke.sh
# Windows: .\scripts\smoke.ps1
```

Expected: health reports `ok`, items returns demo products.

---

## Checking with curl

```bash
curl -s http://localhost:8090/health
curl -s http://localhost:8090/api/v1/items | head -c 300
curl -i http://localhost:8090/api/v1/items/99999
```

The last request returns **404** with a FastAPI-style JSON `detail`.

---

## Environment variables

`courses/nodejs-basic/examples/.env.example`:

```env
API_BASE_URL=http://127.0.0.1:8090
BFF_BASE_URL=http://127.0.0.1:3096
REQUEST_TIMEOUT_MS=10000
```

Loading dotenv comes later, in labs 28+; for now:

```javascript
const API_BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8090";
```

**Important:** in Node, `fetch` needs a full URL including **`http://`**.

---

## The `fastapi-client.js` module

```javascript
// lab/fastapi-client.js
const API_BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8090";
const TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS ?? "10000");

export async function fastapiFetch(path, options = {}) {
  const url = new URL(path, API_BASE);

  const res = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`FastAPI ${res.status} ${url.pathname}: ${body}`);
  }

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

export async function checkHealth() {
  return fastapiFetch("/health");
}

export async function listItems(query = {}) {
  const url = new URL("/api/v1/items", API_BASE);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`FastAPI ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
```

---

## CLI `20-fastapi-cli.js`

```javascript
// lab/20-fastapi-cli.js
import { checkHealth, listItems } from "./fastapi-client.js";

async function main() {
  console.log("FastAPI base:", process.env.API_BASE_URL ?? "http://127.0.0.1:8090");

  console.log("\n--- /health ---");
  const health = await checkHealth();
  console.log(health);

  console.log("\n--- /api/v1/items ---");
  const items = await listItems();
  console.log("type:", Array.isArray(items) ? "array" : typeof items);
  const rows = Array.isArray(items) ? items : items.items ?? items.data ?? [];
  console.log("count:", rows.length);
  if (rows[0]) {
    console.log("first:", rows[0].name ?? rows[0].title, rows[0].price);
  }
}

main().catch((err) => {
  console.error("FastAPI unreachable:", err.message);
  console.error("Hint: cd deploy/fastapi && docker compose up -d");
  process.exitCode = 1;
});
```

Run it:

```bash
cd courses/nodejs-basic/examples
node lab/20-fastapi-cli.js
```

Adapt the `rows` parsing to whatever the stand **actually** returns (check `/docs` or curl it).

---

## FastAPI response contract

Typical mock-exams formats:

**Health:**

```json
{ "status": "ok" }
```

**Items list** — either an array or an object with a field; check the live response:

```bash
curl -s http://localhost:8090/api/v1/items | jq 'type, length'
```

**404:**

```json
{ "detail": "Not found" }
```

The BFF should either **pass through** the status and body as-is, or normalize it into a single shape for React ([32-bff-pattern.md](32-bff-pattern.md)).

---

## Comparing :3096 local BFF vs :8090 FastAPI

| | Lab 16 (`:3096`) | FastAPI (`:8090`) |
|---|-------------------|-------------------|
| Data | `catalog.json` | PostgreSQL + Redis |
| Validation | manual | Pydantic |
| OpenAPI | none | `/docs` |
| Auth | none | added later, in intermediate |

Migration path: replace `readFile(catalog)` in the handler with `fastapiFetch("/api/v1/items")`.

---

## Timeouts and retries (overview)

For this lab, just use `AbortSignal.timeout`. Retry with backoff is covered in [33-proxy-aggregation.md](33-proxy-aggregation.md). Don't retry a POST without idempotency.

---

## Docker troubleshooting

| Symptom | Action |
|---------|----------|
| `Connection refused` | `docker compose ps` — is the api healthy? |
| Port 8090 busy | another process or compose stack |
| Empty items | `docker compose logs api` |
| Windows bcrypt | auth labs — run it inside the container |

More detail in [deploy/fastapi/README.md](../../deploy/fastapi/README.md).

---

## Integration smoke test: Node + FastAPI

```bash
# 1. FastAPI up
cd deploy/fastapi && docker compose up -d

# 2. Node client
cd courses/nodejs-basic/examples
node lab/20-fastapi-cli.js

# 3. Optional: local BFF + compare counts
node lab/16-server.js   # terminal A
node lab/19-client.js   # terminal B
```

---

## Ties to the Python track

| Resource | Connection |
|--------|-------|
| [courses/fastapi](../fastapi/README.md) | the authors of the API |
| [api-design](../api-design/README.md) | REST, status codes |
| [python-async](../python-async/README.md) | asyncio vs the Node loop |

---

## Common mistakes

- **URL without `http://`** — Invalid URL in Node's fetch.
- **FastAPI not running** — ECONNREFUSED; don't confuse it with an HTTP 503.
- **Ignoring `!res.ok`** — you end up parsing HTML or an error JSON as if it were the catalog.
- **Wrong shape assumed for items** — always check the live `/docs` Schemas.
- **Hardcoded prod URL** — use the `API_BASE_URL` env var, always.

---

## Summary

- Bring up **`deploy/fastapi`** on **`:8090`** before the lab.
- Client: **`fetch` + full base URL + timeout + `response.ok`**.
- Core endpoints: **`/health`**, **`/api/v1/items`**.
- The BFF at `:3096` will later **aggregate/proxy** FastAPI for React.

## Checklist

- How do you start the mock-exams FastAPI stand?
- What are the URLs for health and items?
- Why is `fetch("localhost:8090/...")` invalid in Node?
- How do you set `API_BASE_URL`?
- How does FastAPI's 404 response differ from your BFF's JSON?
- What should you check if you get `ECONNREFUSED`?

Next lesson: [21. Express: routes and Router](21-express-routing.md).
