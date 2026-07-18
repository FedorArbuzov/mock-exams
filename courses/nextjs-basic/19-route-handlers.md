# 19. Route Handlers: REST в `app/api`

## Введение: сценарий с работы

Мобильное приложение и web-клиент бьют в FastAPI `:8090` напрямую — security audit: «API ключ в мобильном APK, CORS `*` на backend, PII в логах». Архитектор предлагает **BFF** (Backend for Frontend): браузер и mobile ходят только в Next.js `/api/*`, а Next на сервере проксирует к FastAPI с секретами из env.

В App Router **Route Handlers** — файлы `route.ts` рядом с pages, но они **не рендерят HTML**. Это ваш Express/FastAPI-роут внутри Next: `GET`, `POST`, JSON, headers, status codes. Лаба [20-lab-route-handlers.md](20-lab-route-handlers.md) построит прокси к `:8090`.

## Что вы узнаете

- Структура `app/api/.../route.ts`
- Экспорт `GET`, `POST`, `PUT`, `DELETE`, …
- `NextRequest`, `NextResponse`
- BFF-паттерн: скрыть FastAPI URL
- Обработка ошибок и status forwarding
- Route Handlers vs Server Actions
- Dynamic/static для API routes

---

## Файловое соглашение

```text
app/
  api/
    health/
      route.ts          → GET /api/health
    v1/
      items/
        route.ts        → GET/POST /api/v1/items
        [id]/
          route.ts      → GET /api/v1/items/:id
```

Имя **`route.ts`** (или `route.js`) обязательно. **`page.tsx`** в той же папке — конфликт (нельзя смешивать UI page и route handler в одном сегменте).

---

## Минимальный GET

```tsx
// app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "nextjs-bff",
    timestamp: new Date().toISOString(),
  });
}
```

Проверка:

```bash
curl http://localhost:3000/api/health
```

---

## GET с прокси к FastAPI

```tsx
// app/api/v1/items/route.ts
import { NextResponse } from "next/server";

function fastApiBase(): string {
  return process.env.FASTAPI_URL ?? "http://localhost:8090";
}

export async function GET() {
  let upstream: Response;

  try {
    upstream = await fetch(`${fastApiBase()}/api/v1/items`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    console.error("FastAPI unreachable", err);
    return NextResponse.json(
      { detail: "Upstream unavailable" },
      { status: 502 },
    );
  }

  const body = await upstream.text();

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
```

Браузер видит **same-origin** `localhost:3000` — **нет CORS** для client fetch на `/api/v1/items`.

---

## POST с телом и валидацией

```tsx
// app/api/v1/contact/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const ContactSchema = z.object({
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // BFF: forward, save to DB, или queue
  console.info("Contact form", parsed.data.email);

  return NextResponse.json({ ok: true }, { status: 201 });
}
```

```bash
curl -X POST http://localhost:3000/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","message":"Hello from curl"}'
```

---

## Dynamic segment

```tsx
// app/api/v1/items/[id]/route.ts
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const res = await fetch(
    `${process.env.FASTAPI_URL ?? "http://localhost:8090"}/api/v1/items/${id}`,
    { cache: "no-store" },
  );

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
```

---

## `NextRequest` — query и headers

```tsx
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const auth = request.headers.get("authorization");

  const url = new URL("/api/v1/items", fastApiBase());
  if (q) url.searchParams.set("q", q);

  const upstream = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(auth ? { Authorization: auth } : {}),
    },
  });

  return NextResponse.json(await upstream.json(), { status: upstream.status });
}
```

---

## Route Handlers vs Server Actions

| | Route Handlers | Server Actions |
|---|----------------|----------------|
| URL | `/api/...` REST | нет URL, POST form/RPC |
| Клиент | любой HTTP client | формы, `useTransition` |
| Кэш | HTTP semantics | no |
| OpenAPI / mobile | **да** | нет |
| Форма без JS | сложнее | **идеально** |

Shop: **каталог для mobile** → Route Handler BFF; **форма контактов** → Server Action ([21-server-actions.md](21-server-actions.md)).

---

## CORS для внешних origin

Если Route Handler должен принимать запросы **не** с вашего Next origin:

```tsx
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://partner.example.com",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
```

Для same-origin client (TanStack Query на `/api/...`) CORS не нужен.

---

## Runtime: Edge vs Node

```tsx
export const runtime = "nodejs"; // default — полный Node API
// export const runtime = "edge"; // легче cold start, ограничения (нет некоторых npm)
```

FastAPI прокси с обычным `fetch` — **nodejs** достаточно. Edge — если деплой на edge и нет native-модулей.

---

## Dynamic config

```tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

API routes с `cookies()`, auth, proxy — обычно **dynamic**. Не кэшируйте персональные ответы на CDN без явной политики.

---

## Безопасность BFF

1. **Секреты** только server env — не `NEXT_PUBLIC_*`.
2. **Валидация** входа (Zod) до forward.
3. **Rate limit** — middleware ([23-middleware.md](23-middleware.md)) или upstream.
4. **Не** слепой forward всех headers/cookies к FastAPI.
5. **Логи** без PII и токенов.

---

## Типичные ошибки

1. **`page.tsx` вместо `route.ts`** — 404 или не тот handler.

2. **Забыть `await request.json()`** — пустое тело.

3. **Return `Response` без status** — всегда 200 при ошибке upstream.

4. **Expose internal FastAPI errors** — пробрасывайте sanitized `detail`.

5. **Дублировать бизнес-логику** в BFF и RSC — вынесите в `lib/api/`.

6. **CORS `*` + credentials** — invalid combo в браузере.

7. **Большие тела без лимита** — DoS; проверяйте `Content-Length`.

8. **Route Handler для всего** — формы проще через Server Actions.

---

## Чек-лист

- Какой файл создаёт endpoint `/api/health`?
- Зачем BFF если FastAPI уже есть?
- Как вернуть 502 при падении upstream?
- Route Handler vs Server Action — когда что?
- Нужен ли CORS для fetch `/api/v1/items` с той же Next-страницы?
- Где хранить `FASTAPI_URL` для handler?
- Можно ли `page.tsx` и `route.ts` в одной папке?

Следующий урок: [20. Лаба: прокси к FastAPI через Next](20-lab-route-handlers.md).
