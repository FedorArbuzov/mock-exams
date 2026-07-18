# 18. CORS, Vite proxy и FastAPI :8090

## Сценарий с работы

Локально Vite на `http://localhost:5173`, FastAPI shop API на `http://localhost:8090`. В Network tab запрос «красный», в консоли:

```text
Access to fetch at 'http://localhost:8090/api/v1/items' from origin
'http://localhost:5173' has been blocked by CORS policy
```

Backend-разработчик говорит: «У нас API работает — curl же отвечает». Frontend отвечает: «В Postman тоже работает». Оба правы: **CORS — политика браузера**, не сервера «в вакууме». В mock-exams два рабочих пути: **Vite dev proxy** (без CORS в dev) и **CORSMiddleware** на FastAPI (когда origin явно разрешён).

## Что вы узнаете

- Origin, same-origin, preflight
- Настройка proxy в `vite.config.ts` для `/api`
- CORS на стенде [deploy/fastapi](../../deploy/fastapi/README.md)
- Контракт shop API: items, health, OpenAPI
- Dev vs production: env, BFF, nginx

---

## Same-origin и CORS

**Origin** = scheme + host + port:

| URL | Origin |
|-----|--------|
| `http://localhost:5173` | `http://localhost:5173` |
| `http://localhost:8090` | `http://localhost:8090` |

Порты **разные** → **cross-origin** fetch из браузера. Сервер должен явно разрешить клиентский origin заголовком:

```http
Access-Control-Allow-Origin: http://localhost:5173
```

Без него браузер **не отдаёт** JS доступ к ответу (запрос мог уйти, но `response` недоступен).

**Node/curl/Postman** CORS не применяют — только браузер ([29-fetch.md](../javascript-basic/29-fetch.md)).

---

## Preflight OPTIONS

«Нестандартные» запросы (JSON POST с `Content-Type: application/json`, custom headers) браузер сначала шлёт **OPTIONS**. FastAPI + Starlette CORSMiddleware отвечает на preflight автоматически при правильной конфигурации.

---

## Решение 1: Vite proxy (dev)

В [`examples/vite.config.ts`](examples/vite.config.ts) уже настроено:

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

Браузер обращается к **тому же origin**, что и Vite:

```tsx
// same-origin для браузера: localhost:5173/api/...
const res = await fetch("/api/v1/items");
```

Vite проксирует на `http://localhost:8090/api/v1/items`. **CORS не нужен** между браузером и Vite.

```text
Browser ──GET /api/v1/items──► Vite :5173 ──proxy──► FastAPI :8090
         (same origin 5173)                        (server-to-server)
```

Проверка health через proxy (если добавите правило или напрямую):

```bash
curl http://localhost:8090/health
```

---

## Решение 2: CORS на FastAPI

Когда SPA и API на **разных** origin в dev **без** proxy или в staging:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8097",  # deploy/react — опционально
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

На стенде mock-exams смотрите исходники `deploy/fastapi`. **`allow_origins=["*"]` + credentials** — недопустимо по спецификации; в prod — конкретные домены.

Подробнее REST и безопасность: [api-design](../api-design/README.md).

---

## Запуск стенда :8090

```bash
cd deploy/fastapi
docker compose up -d --build
```

| URL | Назначение |
|-----|------------|
| [http://localhost:8090](http://localhost:8090) | корень API |
| [http://localhost:8090/docs](http://localhost:8090/docs) | Swagger UI |
| [http://localhost:8090/health](http://localhost:8090/health) | health check |
| [http://localhost:8090/api/v1/items](http://localhost:8090/api/v1/items) | каталог shop |

Smoke:

```bash
bash deploy/fastapi/scripts/smoke.sh
# .\deploy\fastapi\scripts\smoke.ps1
```

Без поднятого стенда лабы [19-lab-fetch-items.md](19-lab-fetch-items.md) и далее покажут network error.

---

## Контракт Items API (обзор)

Типичный элемент каталога (уточняйте в `/docs`):

```json
{
  "id": 1,
  "name": "Demo Item",
  "price": 19.99,
  "description": "..."
}
```

| Метод | Путь | Действие |
|-------|------|----------|
| GET | `/api/v1/items` | список |
| GET | `/api/v1/items/{id}` | один товар |
| POST | `/api/v1/items` | создать (лабы Query) |
| PUT/PATCH | `/api/v1/items/{id}` | обновить |
| DELETE | `/api/v1/items/{id}` | удалить |

Статусы: 200/201 успех, 404 not found, 422 validation — тело JSON с `detail` ([17-fetch-react.md](17-fetch-react.md)).

---

## Production: не хардкодить :8090

```tsx
const base = import.meta.env.VITE_API_URL ?? "";
await fetch(`${base}/api/v1/items`);
```

Варианты деплоя mock-exams:

- **nginx** отдаёт SPA и проксирует `/api` на backend ([deploy/nginx](../../deploy/nginx/README.md));
- **BFF** nodejs на `:8096` ([javascript-path.md](../javascript-path.md));
- CORS только если SPA и API на разных публичных доменах.

Dev: proxy. Prod: один origin или явный CORS whitelist.

---

## Отладка CORS

| Симптом | Проверка |
|---------|----------|
| CORS error в console | origin в `allow_origins`? или используйте proxy |
| 502 от Vite proxy | FastAPI не запущен на 8090 |
| OPTIONS 405 | middleware не подключён |
| curl работает, браузер нет | ожидаемо — не CORS в curl |

В DevTools → Network смотрите **Request URL** (5173 vs 8090) и response headers.

---

## Связь с курсами

- JS fetch: [29-fetch.md](../javascript-basic/29-fetch.md)
- React fetch UI: [17-fetch-react.md](17-fetch-react.md)
- FastAPI курс: [fastapi](../fastapi/README.md)
- Browser security: [javascript-path.md](../javascript-path.md) → browser-platform

---

## Типичные ошибки

1. **`fetch('http://localhost:8090/...')` из Vite без CORS** — blocked; используйте `/api/...`.

2. **Proxy только для `/api`, а health дергают на 8090** — снова CORS.

3. **`allow_origins=*` с cookies** — браузер отклонит.

4. **Забыли `changeOrigin: true`** — редкие проблемы с виртуальными hosts.

5. **Production build через `file://` или другой порт** — origin не в whitelist.

6. **Путают network down и CORS** — оба красные, но сообщение разное.

---

## Резюме

CORS ограничивает браузерные cross-origin запросы. В dev mock-exams удобен **Vite proxy**: `/api` → `:8090`. Альтернатива — CORSMiddleware на FastAPI с явным `http://localhost:5173`. Стенд shop API — [deploy/fastapi](../../deploy/fastapi/README.md), порт **8090**. Контракт смотрите в Swagger. В prod — env, reverse proxy или BFF, не голый localhost в клиенте.

---

## Чек-лист

- Почему curl к :8090 не доказывает отсутствие CORS?
- Как browser видит URL при Vite proxy?
- Где включить CORSMiddleware в FastAPI?
- Как поднять стенд mock-exams?
- Какой path списка товаров?
- Чем dev proxy отличается от prod nginx?

Следующий урок: [19. Лаба: список товаров с API](19-lab-fetch-items.md).
