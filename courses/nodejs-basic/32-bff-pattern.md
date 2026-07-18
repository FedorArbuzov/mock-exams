# 32. Паттерн BFF: зачем прокси перед FastAPI

## Сценарий с работы

Frontend-разработчик спрашивает: «Зачем React бьёт в Node `:3096`, если FastAPI уже на `:8090` с OpenAPI?» Архитектор рисует схему: браузер не должен знать внутренний URL Python-сервиса; CORS и JWT refresh — на BFF; один экран админки агрегирует items из FastAPI и stats из другого сервиса. Без BFF — три origin в браузере, дубли auth, утечка infra URLs в DevTools.

В mock-exams BFF — учебный мост между [`react-basic`](../react-basic/README.md) и [`deploy/fastapi`](../../deploy/fastapi/README.md).

## Что вы узнаете

- Определение Backend-for-Frontend (BFF)
- Зачем скрывать FASTAPI_URL от браузера
- CORS, cookies, auth на границе Node
- Агрегация нескольких backend в один ответ
- BFF vs «fat client» vs SSR (Next.js)
- Границы ответственности BFF в shop-треке

---

## Архитектура mock-exams

```text
┌─────────────┐     HTTP      ┌─────────────┐     HTTP      ┌─────────────┐
│ React SPA   │ ────────────► │  Node BFF   │ ────────────► │  FastAPI    │
│  :5173      │   /api/v1/*   │  :3096      │   internal  │  :8090      │
└─────────────┘               └─────────────┘               └─────────────┘
     │                              │
     │  видит только BFF            │  FASTAPI_URL, API keys
     └──────────────────────────────┘  не попадают в bundle
```

React **никогда** не embeds `http://localhost:8090` в production bundle — только `VITE_BFF_URL=http://localhost:3096`.

---

## Проблема 1: CORS и credentials

Браузер ограничивает cross-origin. Прямой вызов FastAPI из `:5173` требует CORS на Python и exposes internal host.

BFF:

- Один «разрешённый» origin для API с точки зрения SPA (или same-origin через nginx позже)
- HttpOnly cookies на домен BFF ([react-intermediate](../react-intermediate/README.md))
- CORS настроен один раз на Express ([25-express-body-cors.md](25-express-body-cors.md))

---

## Проблема 2: Скрытие инфраструктуры

DevTools → Network показывает все URL. Если там `fastapi.internal.cluster.local` — информация для атакующего и coupling UI к деплою backend.

BFF переводит:

```text
GET /api/v1/items  (публичный контракт для UI)
        ↓
GET http://fastapi:8090/api/v1/items  (private network)
```

При смене backend UI **не пересобирают** — меняют только BFF routing.

---

## Проблема 3: Агрегация

Экран «Dashboard» нуждается в items + orders + summary. Без BFF:

- React делает 3 parallel fetch → 3 loading states, 3 error handling
- Или overfetching одного giant endpoint на FastAPI

С BFF ([33-proxy-aggregation.md](33-proxy-aggregation.md)):

```javascript
// GET /api/v1/dashboard
const [items, stats] = await Promise.all([
  fetch(`${FASTAPI}/api/v1/items`),
  fetch(`${FASTAPI}/api/v1/stats/summary`),
]);
return { items: await items.json(), stats: await stats.json() };
```

Один round-trip browser ↔ Node; Node параллелит upstream.

---

## Проблема 4: Адаптация контракта

FastAPI возвращает `detail` при ошибке; UI ждёт `{ error, code }`. BFF **нормализует**:

```javascript
if (!res.ok) {
  const body = await res.json().catch(() => ({}));
  throw new AppError(body.detail ?? "Upstream error", res.status);
}
```

То же для pagination field names, date formats, hiding internal IDs.

---

## Что BFF не должен делать

| Не BFF | Куда |
|--------|------|
| Бизнес-правила домена (скидки, налоги) | FastAPI / domain service |
| Персистентность БД | FastAPI + Postgres |
| Тяжёлые batch jobs | Celery / BullMQ |
| Рендер HTML SEO | Next.js SSR |

BFF — **тонкий** orchestration + auth + adapt; «толстый» BFF — антипattern (дублирование Python логики в JS).

---

## BFF vs API Gateway

| | BFF (per frontend) | API Gateway |
|--|-------------------|-------------|
| Аудитория | конкретный SPA/mobile | все клиенты |
| Агрегация | под UI screens | generic routing |
| Команда | frontend + fullstack | platform |

В enterprise может быть и gateway, и BFF; в mock-exams — один Node сервис для React shop.

---

## Shop routes в BFF

Публичный контракт (совпадает с FastAPI paths для простоты):

| Method | BFF path | Upstream |
|--------|----------|----------|
| GET | `/api/v1/items` | FastAPI items list |
| GET | `/api/v1/items/:id` | FastAPI item |
| POST | `/api/v1/items` | FastAPI create |
| GET | `/health` | local only |

Лаба [34-lab-bff.md](34-lab-bff.md) — full proxy.

---

## Auth stub на BFF

JWT проверка может быть:

1. На BFF — validate token, forward `Authorization` upstream
2. На FastAPI — BFF passes through

Для basic курса — optional `X-API-Key` на admin routes; JWT — [`nodejs-intermediate`](../javascript-path.md).

---

## Observability

RequestId генерируется на BFF, пробрасывается в FastAPI ([31-lab-logging.md](31-lab-logging.md)). Support: «дайте requestId» — trace в обоих логах.

---

## Когда обойтись без BFF

- Internal tools без browser (CLI, cron)
- Next.js Route Handlers как BFF в том же деплое ([`nextjs-basic`](../nextjs-basic/README.md))
- Mobile app с certificate pinning и own SDK — иногда direct API

Для **browser SPA + separate Python API** в учебном стенде BFF оправдан.

---

## Связь с курсом

- [33-proxy-aggregation.md](33-proxy-aggregation.md) — fetch, timeouts, errors.
- [34-lab-bff.md](34-lab-bff.md) — реализация.
- [35-project-structure.md](35-project-structure.md) — folders.
- [26-lab-express-shop.md](26-lab-express-shop.md) — stub перед proxy.
- [`frontend-architecture`](../javascript-path.md) — теория SPA/BFF.

---

## Типичные ошибки

1. **FastAPI URL в `VITE_*`** — утекает в bundle; только BFF URL.

2. **Дублировать validation** на BFF и FastAPI без причины — поддерживать два места.

3. **BFF пишет в БД напрямую** — обход domain layer Python.

4. **Нет timeout на upstream** — зависшие workers ([33-proxy-aggregation.md](33-proxy-aggregation.md)).

5. **CORS только на FastAPI** — browser всё равно ходит в BFF first.

6. **Один BFF на 10 разных UI** — нужны отдельные BFF или аккуратная модульность.

---

## Резюме

BFF — слой между React и FastAPI: скрывает internal URLs, централизует CORS/auth, агрегирует и адаптирует ответы. Browser знает только `:3096`; `FASTAPI_URL` живёт на сервере Node. BFF остаётся тонким — доменная логика в Python. mock-exams shop строится вокруг этого паттерна до capstone.

---

## Чек-лист

- Почему React не должен вызывать `:8090` напрямую из браузера?
- Что такое агрегация на примере dashboard?
- Где хранится FASTAPI_URL — env browser или server?
- Чем BFF адаптирует ошибки FastAPI для UI?
- Что BFF не должен делать в shop-треке?
- Зачем requestId на границе BFF?
- Когда Next.js может заменить отдельный Node BFF?

Следующий урок: [33. Прокси, агрегация, таймауты](33-proxy-aggregation.md).
