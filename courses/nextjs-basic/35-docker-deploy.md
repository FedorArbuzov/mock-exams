# 35. Docker: multi-stage, `deploy/nextjs`, порт 8098

## Сценарий с работы: «Собери образ shop-nextjs для staging»

Ticket INFRA-118: «Next.js shop в Docker, порт **8098**, healthcheck для compose, FastAPI на `:8090` по internal network, без devDependencies в финальном слое». Аналог [`deploy/fastapi`](../../deploy/fastapi/README.md) — каталог **`deploy/nextjs`** в репозитории mock-exams.

Вы уже включили **`output: 'standalone'`** ([34-production-build.md](34-production-build.md)). Эта глава — **multi-stage Dockerfile**, `docker-compose.yml`, переменные, **healthcheck**, связь с nginx ([`containers-basic`](../containers-basic/README.md)).

---

## Что вы узнаете

- **Multi-stage** build: deps → builder → runner.
- Что копировать из `.next/standalone` + `static` + `public`.
- **`PORT=8098`**, `HOSTNAME=0.0.0.0`.
- **Healthcheck** HTTP на `/` или `/api/health`.
- Compose network с **fastapi** service.
- Non-root user и `.dockerignore`.

---

## Структура `deploy/nextjs` (целевая)

```text
deploy/nextjs/
  Dockerfile
  docker-compose.yml
  .dockerignore
  README.md
```

Build context — **`courses/nextjs-basic/examples`** или monorepo root с путём к app. Ниже — context = `examples/`.

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
# Build-time public vars (при необходимости)
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

### Почему три stage

| Stage | Содержимое | В финале |
|-------|------------|----------|
| deps | `npm ci` | нет |
| builder | source + build | нет |
| runner | standalone + static + public | **да** |

Итоговый образ **без** TypeScript, ESLint, исходников `.tsx`.

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

`FASTAPI_URL` — **runtime** env в compose, не ARG at build (если только server-side fetch).

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

Меньше context → быстрее build.

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
    image: mock-exams/fastapi:latest # или build из deploy/fastapi
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

**Internal DNS:** `http://fastapi:8090` — hostname service name, не `localhost` внутри контейнера nextjs.

---

## Healthcheck: что проверять

| Endpoint | Плюсы | Минусы |
|----------|-------|--------|
| `GET /` | всегда есть | тяжелее SSR |
| `GET /api/health` | лёгкий Route Handler | нужно создать |
| `HEAD /` | меньше body | не все wget версии |

Рекомендуется dedicated route:

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

Deep check (optional): ping FastAPI inside handler — осторожно с **cascade failure** (nextjs unhealthy если API down).

---

## Запуск

```bash
cd deploy/nextjs
docker compose up -d --build
docker compose ps
curl http://localhost:8098/
curl http://localhost:8098/api/health
curl http://localhost:8098/catalog
```

Логи:

```bash
docker compose logs -f nextjs
```

---

## Переменные окружения

| Variable | Где | Пример |
|----------|-----|--------|
| `PORT` | runner | `8098` |
| `HOSTNAME` | runner | `0.0.0.0` |
| `FASTAPI_URL` | server fetch | `http://fastapi:8090` |
| `NEXT_PUBLIC_SITE_URL` | OG, links | `https://shop.example.com` |
| `NODE_ENV` | runner | `production` |

Secrets — Docker secrets / GitLab masked vars, не в образе.

---

## Nginx reverse proxy (обзор)

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

`metadataBase` и `NEXT_PUBLIC_SITE_URL` должны match public URL.

---

## Безопасность образа

| Практика | Деталь |
|----------|--------|
| `USER nextjs` | non-root |
| Alpine slim base | меньше surface |
| Pin digest `node:22-alpine@sha256:...` | reproducible |
| Scan `trivy image` | CI step |
| No `.env` in image | runtime inject |

См. [`fastapi/33-docker-production.md`](../fastapi/33-docker-production.md).

---

## Graceful shutdown

Kubernetes / compose send SIGTERM → Next.js должен завершить in-flight requests. `terminationGracePeriodSeconds` ≥ 30. Для zero-downtime — rolling update + healthcheck pass.

---

## Типичные ошибки

**Забыли copy `.next/static`** — CSS/JS 404, «битая» вёрстка.

**`FASTAPI_URL=http://localhost:8090` в container** — localhost = сам nextjs, не fastapi service.

**Build без `standalone`** — копируете весь `node_modules`.

**Healthcheck на `/catalog` с SSR fetch** — медленный/flaky check; используйте `/api/health`.

**Expose 3000, PORT 8098** — mismatch mapping.

**Run as root** — security audit fail.

**Dev Dockerfile `npm run dev`** — no production.

---

## Резюме

Production Next.js в Docker = **`output: 'standalone'`** + **multi-stage** Dockerfile + copy **static/public** + **`PORT=8098`** + **healthcheck**. Compose связывает **nextjs:8098** с **fastapi:8090** по internal network. Это стенд mock-exams для fullstack shop capstone.

---

## Чек-лист

- [ ] Три stage Dockerfile: deps, builder, runner
- [ ] COPY standalone + static + public
- [ ] `USER nextjs`, EXPOSE 8098
- [ ] Runtime `FASTAPI_URL` не localhost
- [ ] Healthcheck endpoint
- [ ] `.dockerignore` настроен
- [ ] `depends_on` + fastapi health

Следующий урок: [36. Static export vs SSR](36-static-export.md).
