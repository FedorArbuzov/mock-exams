# 28. Environment variables и конфиг

## Введение: сценарий с работы

Новый разработчик копирует `.env.local` в репозиторий «чтобы CI работал» — в Slack утекают `DATABASE_URL` и `JWT_SECRET`. Другой кладёт `FASTAPI_URL=http://localhost:8090` в `NEXT_PUBLIC_FASTAPI_URL` — URL internal API виден в client bundle DevTools. Третий wonder: «На Vercel preview переменные другие, локально catalog OK, preview — 502».

Next.js разделяет env на **server-only** и **client-exposed** (`NEXT_PUBLIC_`). Понимание этого — обязательное до Docker-деплоя ([35-docker-deploy.md](35-docker-deploy.md)) и capstone. Эта глава систематизирует конфиг для shop + FastAPI `:8090`.

## Что вы узнаете

- Файлы `.env`, `.env.local`, `.env.production`
- Префикс `NEXT_PUBLIC_` и встраивание в bundle
- Server env в RSC, Route Handlers, Actions
- `process.env` vs validated config (Zod)
- Локаль vs CI vs Docker vs Vercel
- Секреты и `.gitignore`
- Связь с [`examples/.env.example`](examples/.env.example)

---

## Иерархия файлов

| Файл | Назначение | Commit? |
|------|------------|---------|
| `.env` | defaults для всех env | optional, без секретов |
| `.env.local` | локальные overrides + secrets | **нет** (.gitignore) |
| `.env.development` | dev-specific | optional |
| `.env.production` | prod defaults (без secrets) | осторожно |
| `.env.example` | шаблон для команды | **да** |

Next загружает по правилам [Next.js env load order](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables) — `.env.local` перекрывает `.env`.

---

## Server-only переменные

```env
# .env.local — НЕ коммитить
FASTAPI_URL=http://localhost:8090
JWT_SECRET=dev-only-change-me
INTERNAL_API_KEY=abc123
```

```tsx
// доступно только на server: RSC, route.ts, actions.ts, middleware (ограниченно)
const url = process.env.FASTAPI_URL;
```

**Не попадают** в browser bundle при обычном import в Client Component — но **не импортируйте** server modules с secrets в client files.

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

| Правило | Деталь |
|---------|--------|
| Inlined at **build** | смена env на platform без rebuild — public vars могут быть stale |
| Видны всем | DevTools → Sources → bundle |
| Только non-secrets | URLs public BFF, feature flags ok, не JWT |

---

## Таблица для shop-курса

| Variable | Server / Public | Пример | Использование |
|----------|-----------------|--------|---------------|
| `FASTAPI_URL` | **Server** | `http://localhost:8090` | RSC fetch, BFF upstream |
| `NEXT_PUBLIC_API_URL` | **Public** | `http://localhost:3000/api/proxy` | client Query/fetch |
| `JWT_SECRET` | **Server** | random 32+ bytes | sign cookies (if used) |
| `NODE_ENV` | auto | `development` / `production` | secure cookies, logging |
| `VERCEL_URL` | platform | auto on Vercel | preview URLs |

---

## `.env.example` в репозитории

```env
# courses/nextjs-basic/examples/.env.example
FASTAPI_URL=http://localhost:8090
NEXT_PUBLIC_API_URL=http://localhost:3000/api/proxy
```

README: `cp .env.example .env.local` — стандарт onboarding ([README.md](README.md)).

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

Fail fast at startup вместо `undefined/api/items` в runtime.

---

## Docker и production

```dockerfile
# build args для public vars
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# runtime secrets — docker compose / k8s secrets
ENV FASTAPI_URL=http://fastapi:8090
```

| Этап | FASTAPI_URL |
|------|-------------|
| Local dev | `http://localhost:8090` |
| Docker compose network | `http://fastapi:8090` (service name) |
| K8s | internal service DNS |

**localhost** внутри container — сам container, не host machine.

---

## CI (GitHub Actions)

```yaml
env:
  FASTAPI_URL: http://127.0.0.1:8090
  NEXT_PUBLIC_API_URL: http://localhost:3000/api/proxy
```

Secrets — GitHub Encrypted Secrets, не hardcode в workflow yaml для prod keys.

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

Редко нужно дублировать `.env`; используйте для computed non-secret build metadata.

---

## Runtime vs build time

| Variable type | Когда читается |
|---------------|----------------|
| `NEXT_PUBLIC_*` | **build** (inlined) |
| Server env | **runtime** на Node server |

На Vercel: public env change → **redeploy**. Server env can update without rebuild (platform-dependent).

Edge middleware — subset env; check platform docs.

---

## Безопасность checklist

1. `.env.local` в `.gitignore` — verify.
2. Pre-commit hook / secret scan (gitleaks).
3. Rotate leaked keys immediately.
4. Separate secrets per environment (dev/staging/prod).
5. Never log `process.env.JWT_SECRET`.
6. Audit `NEXT_PUBLIC_*` — prefix means public.

---

## Типичные ошибки

1. **`NEXT_PUBLIC_FASTAPI_URL` с internal host** — exposes infra.

2. **Commit `.env.local`** — leak.

3. **Missing env on CI** — build passes, runtime 502.

4. **`localhost` in Docker prod** — wrong target.

5. **Expect runtime change of NEXT_PUBLIC_** without rebuild — stale URL.

6. **Import `env.server.ts` in client component** — bundle leak / build error.

7. **Defaults `?? ''` silent** — validate with Zod instead.

8. **Same JWT secret dev/prod** — compromise dev → prod.

---

## Чек-лист

- Какие env commit в git?
- Что делает префикс `NEXT_PUBLIC_`?
- Где использовать `FASTAPI_URL` — server или client fetch?
- Почему Docker не видит host `localhost:8090`?
- Когда нужен redeploy после смены public env?
- Как fail fast при missing `FASTAPI_URL`?
- Где хранить JWT_SECRET?

Следующий урок: [29. CSS Modules, Tailwind, global styles](29-styling.md).
