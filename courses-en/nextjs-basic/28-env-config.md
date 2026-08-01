# 28. Environment variables and config

## Intro: a scenario from work

A new developer copies `.env.local` into the repository "so CI works" — and `DATABASE_URL` and `JWT_SECRET` leak into Slack. Another puts `FASTAPI_URL=http://localhost:8090` into `NEXT_PUBLIC_FASTAPI_URL` — the internal API URL is now visible in the client bundle via DevTools. A third wonders: "On Vercel preview the variables are different; locally the catalog is OK, but preview returns 502."

Next.js splits env into **server-only** and **client-exposed** (`NEXT_PUBLIC_`). Understanding this is mandatory before the Docker deploy ([35-docker-deploy.md](35-docker-deploy.md)) and the capstone. This chapter systematizes the config for the shop + FastAPI `:8090`.

## What you'll learn

- The `.env`, `.env.local`, `.env.production` files
- The `NEXT_PUBLIC_` prefix and inlining into the bundle
- Server env in RSC, Route Handlers, Actions
- `process.env` vs validated config (Zod)
- Local vs CI vs Docker vs Vercel
- Secrets and `.gitignore`
- Its relation to [`examples/.env.example`](examples/.env.example)

---

## File hierarchy

| File | Purpose | Commit? |
|------|------------|---------|
| `.env` | defaults for all env | optional, no secrets |
| `.env.local` | local overrides + secrets | **no** (.gitignore) |
| `.env.development` | dev-specific | optional |
| `.env.production` | prod defaults (no secrets) | with care |
| `.env.example` | template for the team | **yes** |

Next loads them per the [Next.js env load order](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables) — `.env.local` overrides `.env`.

---

## Server-only variables

```env
# .env.local — do NOT commit
FASTAPI_URL=http://localhost:8090
JWT_SECRET=dev-only-change-me
INTERNAL_API_KEY=abc123
```

```tsx
// available only on the server: RSC, route.ts, actions.ts, middleware (limited)
const url = process.env.FASTAPI_URL;
```

They **don't end up** in the browser bundle on a regular import into a Client Component — but **don't import** server modules with secrets into client files.

---

## `NEXT_PUBLIC_*` — client exposure

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/proxy
NEXT_PUBLIC_SITE_NAME=Shop Demo
```

```tsx
"use client";
const api = process.env.NEXT_PUBLIC_API_URL; // inlined at BUILD time
```

| Rule | Detail |
|---------|--------|
| Inlined at **build** | changing env on the platform without a rebuild — public vars may be stale |
| Visible to everyone | DevTools → Sources → bundle |
| Non-secrets only | public BFF URLs, feature flags ok, not JWT |

---

## Table for the shop course

| Variable | Server / Public | Example | Usage |
|----------|-----------------|--------|---------------|
| `FASTAPI_URL` | **Server** | `http://localhost:8090` | RSC fetch, BFF upstream |
| `NEXT_PUBLIC_API_URL` | **Public** | `http://localhost:3000/api/proxy` | client Query/fetch |
| `JWT_SECRET` | **Server** | random 32+ bytes | sign cookies (if used) |
| `NODE_ENV` | auto | `development` / `production` | secure cookies, logging |
| `VERCEL_URL` | platform | auto on Vercel | preview URLs |

---

## `.env.example` in the repository

```env
# courses/nextjs-basic/examples/.env.example
FASTAPI_URL=http://localhost:8090
NEXT_PUBLIC_API_URL=http://localhost:3000/api/proxy
```

README: `cp .env.example .env.local` — the onboarding standard ([README.md](README.md)).

---

## Validated config (recommended)

```tsx
// lib/env.server.ts — import ONLY from server code
import { z } from "zod";

const ServerEnv = z.object({
  FASTAPI_URL: z.string().url(),
  JWT_SECRET: z.string().min(16).optional(),
});

export const serverEnv = ServerEnv.parse({
  FASTAPI_URL: process.env.FASTAPI_URL,
  JWT_SECRET: process.env.JWT_SECRET,
});
```

```tsx
// lib/env.client.ts
import { z } from "zod";

const ClientEnv = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
});

export const clientEnv = ClientEnv.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
```

Fail fast at startup instead of `undefined/api/items` at runtime.

---

## Docker and production

```dockerfile
# build args for public vars
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# runtime secrets — docker compose / k8s secrets
ENV FASTAPI_URL=http://fastapi:8090
```

| Stage | FASTAPI_URL |
|------|-------------|
| Local dev | `http://localhost:8090` |
| Docker compose network | `http://fastapi:8090` (service name) |
| K8s | internal service DNS |

**localhost** inside a container is the container itself, not the host machine.

---

## CI (GitHub Actions)

```yaml
env:
  FASTAPI_URL: http://127.0.0.1:8090
  NEXT_PUBLIC_API_URL: http://localhost:3000/api/proxy
```

Secrets — GitHub Encrypted Secrets, don't hardcode prod keys in the workflow yaml.

---

## next.config.ts

```tsx
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // legacy: prefer .env files
    BUILD_TAG: process.env.GIT_SHA ?? "dev",
  },
};

export default nextConfig;
```

Rarely do you need to duplicate `.env`; use it for computed non-secret build metadata.

---

## Runtime vs build time

| Variable type | When it's read |
|---------------|----------------|
| `NEXT_PUBLIC_*` | **build** (inlined) |
| Server env | **runtime** on the Node server |

On Vercel: a public env change → **redeploy**. Server env can update without a rebuild (platform-dependent).

Edge middleware — an env subset; check the platform docs.

---

## Security checklist

1. `.env.local` in `.gitignore` — verify.
2. Pre-commit hook / secret scan (gitleaks).
3. Rotate leaked keys immediately.
4. Separate secrets per environment (dev/staging/prod).
5. Never log `process.env.JWT_SECRET`.
6. Audit `NEXT_PUBLIC_*` — the prefix means public.

---

## Common mistakes

1. **`NEXT_PUBLIC_FASTAPI_URL` with an internal host** — exposes infra.

2. **Committing `.env.local`** — leak.

3. **Missing env on CI** — build passes, runtime 502.

4. **`localhost` in Docker prod** — wrong target.

5. **Expecting a runtime change of NEXT_PUBLIC_** without a rebuild — stale URL.

6. **Importing `env.server.ts` in a client component** — bundle leak / build error.

7. **Silent defaults `?? ''`** — validate with Zod instead.

8. **Same JWT secret for dev/prod** — compromising dev → prod.

---

## Checklist

- Which env do you commit to git?
- What does the `NEXT_PUBLIC_` prefix do?
- Where do you use `FASTAPI_URL` — server or client fetch?
- Why can't Docker reach the host `localhost:8090`?
- When is a redeploy needed after changing a public env?
- How do you fail fast on a missing `FASTAPI_URL`?
- Where do you store JWT_SECRET?

Next lesson: [29. CSS Modules, Tailwind, global styles](29-styling.md).
