# 37. Lab: build the Next.js Docker image locally

## A scenario from work: "Check the image before merging to main"

A PR adds a Dockerfile. Reviewer: "Attach the output of `docker compose ps` and a curl to health." This lab repeats [35-docker-deploy.md](35-docker-deploy.md) hands-on: multi-stage build, port **8098**, healthcheck, and the link to FastAPI **:8090**.

**Time:** ~50–70 minutes (+ the time for the first build).

---

## What you'll do

- Set **`output: 'standalone'`** in `next.config.ts`.
- Add **`app/api/health/route.ts`**.
- Build the **`deploy/nextjs/Dockerfile`** and compose.
- Start the stack and run smoke tests.
- (Optional) Measure the image size before/after standalone.

---

## Prerequisites

- Docker Desktop / Engine running
- [`courses/nextjs-basic/examples`](examples/package.json) builds: `npm run build`
- [`deploy/fastapi`](../../deploy/fastapi/README.md) is familiar

---

## Step 1. Standalone in next.config

```ts
// courses/nextjs-basic/examples/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const apiUrl = process.env.FASTAPI_URL ?? "http://localhost:8090";
    return [
      { source: "/api/proxy/:path*", destination: `${apiUrl}/:path*` },
    ];
  },
};

export default nextConfig;
```

Local check:

```bash
cd courses/nextjs-basic/examples
npm run build
ls .next/standalone/server.js   # Unix
# Windows: dir .next\standalone\server.js
```

---

## Step 2. Health Route Handler

```tsx
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: "ok",
    service: "nextjs-shop",
    timestamp: new Date().toISOString(),
  });
}
```

```bash
npm run build && npm run start -- -p 8098
curl http://localhost:8098/api/health
```

---

## Step 3. Dockerfile

Create `deploy/nextjs/Dockerfile` (the contents from [35-docker-deploy.md](35-docker-deploy.md)) or copy it:

- Stage `deps`: `npm ci`
- Stage `builder`: `npm run build`
- Stage `runner`: COPY standalone, static, public, USER nextjs, PORT 8098

Create `deploy/nextjs/.dockerignore` in the **context** (`examples/.dockerignore`):

```dockerignore
node_modules
.next
.git
.env*.local
```

---

## Step 4. docker-compose.yml

```yaml
# deploy/nextjs/docker-compose.yml
services:
  fastapi:
    build: ../fastapi
    ports:
      - "8090:8090"
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8090/health')"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 15s

  nextjs:
    build:
      context: ../../courses/nextjs-basic/examples
      dockerfile: ../../deploy/nextjs/Dockerfile
    ports:
      - "8098:8098"
    environment:
      PORT: "8098"
      HOSTNAME: "0.0.0.0"
      FASTAPI_URL: "http://fastapi:8090"
      NEXT_PUBLIC_SITE_URL: "http://localhost:8098"
    depends_on:
      fastapi:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8098/api/health"]
      interval: 10s
      timeout: 3s
      retries: 6
      start_period: 30s
```

Adjust the `fastapi` build path if it differs in your repo.

---

## Step 5. Build and run

```bash
cd deploy/nextjs
docker compose down -v 2>/dev/null || true
docker compose up -d --build
```

The first build takes **5–15 minutes** — that's normal.

```bash
docker compose ps
# nextjs and fastapi healthy
```

---

## Step 6. Smoke tests

```bash
# Health
curl -s http://localhost:8098/api/health | jq .
# or without jq — just JSON to stdout

# Home
curl -I http://localhost:8098/

# Catalog SSR (should contain HTML, not empty)
curl -s http://localhost:8098/catalog | head -20

# FastAPI direct
curl -s http://localhost:8090/api/v1/items | head -c 200

# Static assets (after loading the page in the browser, grab the hash from DevTools)
curl -I http://localhost:8098/_next/static/css/app/layout.css
# the path may differ — check the Network tab
```

**Browser:** open `http://localhost:8098/catalog` — the product list from the API.

---

## Step 7. Debugging common problems

| Symptom | Diagnosis | Fix |
|---------|-------------|-----|
| Catalog empty | `docker compose logs nextjs` | `FASTAPI_URL=http://fastapi:8090` |
| 502 / connection refused | `docker compose ps` | wait for the healthcheck |
| CSS missing | View source 404 on `/_next/static` | COPY `.next/static` in the Dockerfile |
| unhealthy nextjs | `docker inspect` health log | increase `start_period` |
| ECONNREFUSED fastapi | fastapi logs | postgres dependency if any |

```bash
docker compose logs -f nextjs
docker compose exec nextjs wget -qO- http://fastapi:8090/health
```

---

## Step 8. Image size (optional)

```bash
docker images | grep nextjs
# before standalone (if comparing) vs after — expect a significant drop
docker history deploy-nextjs-nextjs --no-trunc | head
```

---

## Success criteria

- [ ] `docker compose ps` — both services **healthy**
- [ ] `curl localhost:8098/api/health` → `"status":"ok"`
- [ ] `/catalog` renders products from FastAPI
- [ ] `/_next/static/*` returns 200
- [ ] Image runs as a **non-root** user (inspect the Dockerfile USER)
- [ ] Port **8098** on the host
- [ ] You understand why `FASTAPI_URL` isn't `localhost` inside the container

---

## Extension

1. **Multi-stage cache** BuildKit: `RUN --mount=type=cache,target=/root/.npm npm ci`
2. **Deep health** — nextjs health checks fastapi reachability (document the tradeoff)
3. **README** in `deploy/nextjs/` with smoke commands

---

## Common mistakes in the lab

**Wrong build context** — the Dockerfile can't find `package.json`.

**Forgetting `output: standalone`** — the runner stage is empty or huge.

**Windows paths** in compose — use relative paths as in the example.

**Testing only `/`** — the SSR catalog may fail while `/catalog` is OK in dev.

**Not rebuilding after a config change** — `docker compose up --build`.

---

## Summary

The lab locks in the mock-exams **production path**: standalone build, Docker **:8098**, healthcheck, compose with **:8090**. This is the gate before the capstone deploy ([39-capstone.md](39-capstone.md)).

---

## Checklist

- [ ] standalone locally and in Docker
- [ ] `/api/health` for the probe
- [ ] COPY static + public
- [ ] Smoke curl catalog + health
- [ ] Logs on a fetch API error
- [ ] Sensible image size (< ~400MB typically)

Next lesson: [38. Interview Q&A](38-interview-qa.md).
