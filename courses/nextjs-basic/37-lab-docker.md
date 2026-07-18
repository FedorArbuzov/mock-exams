# 37. Лаба: собрать Docker-образ Next.js локально

## Сценарий с работы: «Проверь образ до merge в main»

PR добавляет Dockerfile. Reviewer: «Приложи вывод `docker compose ps` и curl health». Лаба повторяет [35-docker-deploy.md](35-docker-deploy.md) hands-on: multi-stage build, порт **8098**, healthcheck, связь с FastAPI **:8090**.

**Время:** ~50–70 минут (+ время первого build).

---

## Что вы сделаете

- Создадите **`output: 'standalone'`** в `next.config.ts`.
- Добавите **`app/api/health/route.ts`**.
- Соберёте **`deploy/nextjs/Dockerfile`** и compose.
- Запустите stack и пройдёте smoke tests.
- (Optional) Измерите размер образа до/after standalone.

---

## Предварительные условия

- Docker Desktop / Engine running
- [`courses/nextjs-basic/examples`](examples/package.json) собирается: `npm run build`
- [`deploy/fastapi`](../../deploy/fastapi/README.md) знаком

---

## Шаг 1. Standalone в next.config

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

Локальная проверка:

```bash
cd courses/nextjs-basic/examples
npm run build
ls .next/standalone/server.js   # Unix
# Windows: dir .next\standalone\server.js
```

---

## Шаг 2. Health Route Handler

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

## Шаг 3. Dockerfile

Создайте `deploy/nextjs/Dockerfile` (содержимое из [35-docker-deploy.md](35-docker-deploy.md)) или скопируйте:

- Stage `deps`: `npm ci`
- Stage `builder`: `npm run build`
- Stage `runner`: COPY standalone, static, public, USER nextjs, PORT 8098

Создайте `deploy/nextjs/.dockerignore` в **context** (`examples/.dockerignore`):

```dockerignore
node_modules
.next
.git
.env*.local
```

---

## Шаг 4. docker-compose.yml

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

Adjust `fastapi` build path если отличается в вашем репо.

---

## Шаг 5. Build и run

```bash
cd deploy/nextjs
docker compose down -v 2>/dev/null || true
docker compose up -d --build
```

Первый build **5–15 минут** — норма.

```bash
docker compose ps
# nextjs и fastapi healthy
```

---

## Шаг 6. Smoke tests

```bash
# Health
curl -s http://localhost:8098/api/health | jq .
# или без jq — просто JSON в stdout

# Home
curl -I http://localhost:8098/

# Catalog SSR (должен содержать HTML, не пустой)
curl -s http://localhost:8098/catalog | head -20

# FastAPI direct
curl -s http://localhost:8090/api/v1/items | head -c 200

# Static assets (после загрузки страницы в браузере возьмите hash из DevTools)
curl -I http://localhost:8098/_next/static/css/app/layout.css
# путь может отличаться — проверьте Network tab
```

**Browser:** откройте `http://localhost:8098/catalog` — список товаров с API.

---

## Шаг 7. Отладка типичных проблем

| Симптом | Диагностика | Fix |
|---------|-------------|-----|
| Catalog empty | `docker compose logs nextjs` | `FASTAPI_URL=http://fastapi:8090` |
| 502 / connection refused | `docker compose ps` | дождаться healthcheck |
| CSS missing | View source 404 on `/_next/static` | COPY `.next/static` в Dockerfile |
| unhealthy nextjs | `docker inspect` health log | увеличить `start_period` |
| ECONNREFUSED fastapi | fastapi logs | postgres dependency if any |

```bash
docker compose logs -f nextjs
docker compose exec nextjs wget -qO- http://fastapi:8090/health
```

---

## Шаг 8. Размер образа (optional)

```bash
docker images | grep nextjs
# до standalone (если сравниваете) vs после — ожидайте значительное падение
docker history deploy-nextjs-nextjs --no-trunc | head
```

---

## Критерии успеха

- [ ] `docker compose ps` — оба сервиса **healthy**
- [ ] `curl localhost:8098/api/health` → `"status":"ok"`
- [ ] `/catalog` рендерит товары из FastAPI
- [ ] `/_next/static/*` отдаётся 200
- [ ] Образ на **non-root** user (inspect Dockerfile USER)
- [ ] Порт **8098** на хосте
- [ ] Понимаете почему `FASTAPI_URL` не `localhost` внутри контейнера

---

## Extension

1. **Multi-stage cache** BuildKit: `RUN --mount=type=cache,target=/root/.npm npm ci`
2. **Deep health** — nextjs health checks fastapi reachability (document tradeoff)
3. **README** в `deploy/nextjs/` с командами smoke

---

## Типичные ошибки в лабе

**Build context не тот** — Dockerfile не находит `package.json`.

**Забыли `output: standalone`** — runner stage пустой или огромный.

**Windows paths** в compose — используйте relative paths как в примере.

**Тестируют только `/`** — SSR catalog может падать при `/catalog` OK на dev.

**Не пересобрали после config change** — `docker compose up --build`.

---

## Резюме

Лаба фиксирует **production path** mock-exams: standalone build, Docker **:8098**, healthcheck, compose с **:8090**. Это gate перед capstone deploy ([39-capstone.md](39-capstone.md)).

---

## Чек-лист

- [ ] standalone локально и в Docker
- [ ] `/api/health` для probe
- [ ] COPY static + public
- [ ] Smoke curl catalog + health
- [ ] Logs при ошибке fetch API
- [ ] Размер образа осмысленный (< ~400MB типично)

Следующий урок: [38. Interview Q&A](38-interview-qa.md).
