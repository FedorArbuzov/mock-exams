# 35. Docker: multi-stage, `deploy/nextjs`, port 8098

## A scenario from work: "Build the shop-nextjs image for staging"

Ticket INFRA-118: "Next.js shop in Docker, port **8098**, a healthcheck for compose, FastAPI on `:8090` over the internal network, no devDependencies in the final layer." The analog of [`deploy/fastapi`](../../deploy/fastapi/README.md) — the **`deploy/nextjs`** directory in the mock-exams repository.

You've already enabled **`output: 'standalone'`** ([34-production-build.md](34-production-build.md)). This chapter covers the **multi-stage Dockerfile**, `docker-compose.yml`, variables, the **healthcheck**, and the relation to nginx ([`containers-basic`](../containers-basic/README.md)).

---

## What you'll learn

- **Multi-stage** build: deps → builder → runner.
- What to copy from `.next/standalone` + `static` + `public`.
- **`PORT=8098`**, `HOSTNAME=0.0.0.0`.
- **Healthcheck** HTTP on `/` or `/api/health`.
- A compose network with the **fastapi** service.
- Non-root user and `.dockerignore`.

---

## The `deploy/nextjs` structure (target)

```text
deploy/nextjs/
  Dockerfile
  docker-compose.yml
  .dockerignore
  README.md
```

The build context is **`courses/nextjs-basic/examples`** or the monorepo root with a path to the app. Below, context = `examples/`.

---

## Multi-stage Dockerfile

```dockerfile
# deploy/nextjs/Dockerfile
# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time public vars (if needed)
ARG NEXT_PUBLIC_SITE_URL=http://localhost:8098
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8098
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

WORKDIR /app

# standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8098

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8098/ || exit 1

CMD ["node", "server.js"]
```

### Why three stages

| Stage | Contents | In the final image |
|-------|------------|----------|
| deps | `npm ci` | no |
| builder | source + build | no |
| runner | standalone + static + public | **yes** |

The final image has **no** TypeScript, ESLint, or `.tsx` sources.

---

## `next.config.ts` prerequisites

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const apiUrl = process.env.FASTAPI_URL ?? "http://localhost:8090";
    return [{ source: "/api/proxy/:path*", destination: `${apiUrl}/:path*` }];
  },
};

export default nextConfig;
```

`FASTAPI_URL` — a **runtime** env in compose, not an ARG at build (as long as it's server-side fetch only).

---

## `.dockerignore`

```dockerignore
node_modules
.next
.git
*.md
.env*.local
npm-debug.log*
Dockerfile
docker-compose*.yml
```

Less context → a faster build.

---

## `docker-compose.yml`

```yaml
# deploy/nextjs/docker-compose.yml
services:
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
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8098/"]
      interval: 10s
      timeout: 3s
      retries: 6
      start_period: 25s
    networks:
      - shop

  fastapi:
    image: mock-exams/fastapi:latest # or build from deploy/fastapi
    ports:
      - "8090:8090"
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8090/health')"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 15s
    networks:
      - shop

networks:
  shop:
    driver: bridge
```

**Internal DNS:** `http://fastapi:8090` — the hostname is the service name, not `localhost` inside the nextjs container.

---

## Healthcheck: what to check

| Endpoint | Pros | Cons |
|----------|-------|--------|
| `GET /` | always exists | heavier SSR |
| `GET /api/health` | a lightweight Route Handler | needs to be created |
| `HEAD /` | smaller body | not supported by all wget versions |

A dedicated route is recommended:

```tsx
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: "ok", service: "nextjs-shop" });
}
```

```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8098/api/health"]
```

Deep check (optional): ping FastAPI inside the handler — be careful with **cascade failure** (nextjs unhealthy if the API is down).

---

## Running it

```bash
cd deploy/nextjs
docker compose up -d --build
docker compose ps
curl http://localhost:8098/
curl http://localhost:8098/api/health
curl http://localhost:8098/catalog
```

Logs:

```bash
docker compose logs -f nextjs
```

---

## Environment variables

| Variable | Where | Example |
|----------|-----|--------|
| `PORT` | runner | `8098` |
| `HOSTNAME` | runner | `0.0.0.0` |
| `FASTAPI_URL` | server fetch | `http://fastapi:8090` |
| `NEXT_PUBLIC_SITE_URL` | OG, links | `https://shop.example.com` |
| `NODE_ENV` | runner | `production` |

Secrets — Docker secrets / GitLab masked vars, not in the image.

---

## Nginx reverse proxy (overview)

```nginx
upstream nextjs_shop {
  server nextjs:8098;
}

server {
  listen 80;
  server_name shop.example.com;

  location / {
    proxy_pass http://nextjs_shop;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

`metadataBase` and `NEXT_PUBLIC_SITE_URL` must match the public URL.

---

## Image security

| Practice | Detail |
|----------|--------|
| `USER nextjs` | non-root |
| Alpine slim base | smaller surface |
| Pin digest `node:22-alpine@sha256:...` | reproducible |
| Scan `trivy image` | CI step |
| No `.env` in image | runtime inject |

See [`fastapi/33-docker-production.md`](../fastapi/33-docker-production.md).

---

## Graceful shutdown

Kubernetes / compose send SIGTERM → Next.js should finish in-flight requests. `terminationGracePeriodSeconds` ≥ 30. For zero-downtime — rolling update + healthcheck pass.

---

## Common mistakes

**Forgetting to copy `.next/static`** — CSS/JS 404, "broken" layout.

**`FASTAPI_URL=http://localhost:8090` in the container** — localhost = the nextjs container itself, not the fastapi service.

**Building without `standalone`** — you copy the entire `node_modules`.

**A healthcheck on `/catalog` with an SSR fetch** — a slow/flaky check; use `/api/health`.

**Exposing 3000 with PORT 8098** — mapping mismatch.

**Running as root** — security audit failure.

**A dev Dockerfile with `npm run dev`** — no production.

---

## Summary

Production Next.js in Docker = **`output: 'standalone'`** + a **multi-stage** Dockerfile + copying **static/public** + **`PORT=8098`** + a **healthcheck**. Compose links **nextjs:8098** with **fastapi:8090** over the internal network. This is the mock-exams sandbox for the fullstack shop capstone.

---

## Checklist

- [ ] Three-stage Dockerfile: deps, builder, runner
- [ ] COPY standalone + static + public
- [ ] `USER nextjs`, EXPOSE 8098
- [ ] Runtime `FASTAPI_URL` not localhost
- [ ] Healthcheck endpoint
- [ ] `.dockerignore` configured
- [ ] `depends_on` + fastapi health

Next lesson: [36. Static export vs SSR](36-static-export.md).
