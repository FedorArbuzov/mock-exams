# 20. Лаба: прокси к FastAPI через Next

## Сценарий

Тикет **NEXT-220**: «Клиентские компоненты не должны знать URL FastAPI. Единая точка входа `/api/proxy/...`». Вы строите BFF из [19-route-handlers.md](19-route-handlers.md): Route Handler проксирует GET к `:8090`, env `FASTAPI_URL`, корректные status codes.

**Время:** ~45–60 минут.  
**Стенд:** FastAPI `:8090` + Next `:3000`.

---

## Подготовка

```bash
# Терминал 1
cd deploy/fastapi && docker compose up -d --build

# Терминал 2
cd courses/nextjs-basic/examples
cp .env.example .env.local
npm run dev
```

`.env.local`:

```env
FASTAPI_URL=http://localhost:8090
NEXT_PUBLIC_API_URL=http://localhost:3000/api/proxy
```

---

## Задание 1. Health BFF

Создайте `app/api/health/route.ts`:

```tsx
import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.FASTAPI_URL ?? "http://localhost:8090";
  try {
    const res = await fetch(`${base}/health`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(
      { bff: "ok", upstream: data },
      { status: res.ok ? 200 : 502 },
    );
  } catch {
    return NextResponse.json({ bff: "ok", upstream: null }, { status: 502 });
  }
}
```

```bash
curl http://localhost:3000/api/health
```

---

## Задание 2. Универсальный proxy `[...path]`

Catch-all проксирует любой путь под `/api/proxy/` → FastAPI `/api/v1/...`.

```tsx
// app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

type Context = { params: Promise<{ path: string[] }> };

function upstreamBase(): string {
  return process.env.FASTAPI_URL ?? "http://localhost:8090";
}

async function proxy(request: NextRequest, context: Context) {
  const { path } = await context.params;
  const targetPath = path.join("/");
  const url = new URL(`/api/v1/${targetPath}`, upstreamBase());
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers();
  headers.set("Accept", "application/json");
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  let body: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch (err) {
    console.error("Proxy fetch failed", err);
    return NextResponse.json({ detail: "Upstream unavailable" }, { status: 502 });
  }

  const responseBody = await upstream.text();
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
```

---

## Задание 3. Проверка proxy

```bash
curl http://localhost:3000/api/proxy/items
curl http://localhost:3000/api/proxy/items/1
curl -i http://localhost:3000/api/proxy/items/999
```

| Запрос | Ожидание |
|--------|----------|
| `/api/proxy/items` | 200, JSON `{ items, total }` |
| `/api/proxy/items/1` | 200, объект товара |
| `/api/proxy/items/999` | 404 от FastAPI, проброшен status |

---

## Задание 4. Client fetch через BFF

Создайте Client Component для проверки (временно):

```tsx
// components/dev/ProxyItemsProbe.tsx
"use client";

import { useEffect, useState } from "react";

export function ProxyItemsProbe() {
  const [text, setText] = useState("loading…");

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";
    fetch(`${base}/items`)
      .then((r) => r.json())
      .then((data) => setText(JSON.stringify(data, null, 2)))
      .catch((e) => setText(String(e)));
  }, []);

  return (
    <pre className="card" style={{ fontSize: "0.85rem" }}>
      {text}
    </pre>
  );
}
```

Добавьте на главную или `/catalog` только для dev. **Нет CORS-ошибок** — same origin.

---

## Задание 5. Обновить server loader (опционально)

В `lib/api/items.ts` можно переключить server fetch на BFF:

```tsx
function baseUrl(): string {
  // server-side: напрямую FastAPI быстрее (минус hop)
  return process.env.FASTAPI_URL ?? "http://localhost:8090";
  // client-only код использует NEXT_PUBLIC_API_URL
}
```

**Правило курса:** RSC → FastAPI напрямую; browser → `/api/proxy`. Обсудите с team trade-off latency vs единый URL.

---

## Критерии приёмки

- [ ] `GET /api/health` показывает статус upstream
- [ ] `GET /api/proxy/items` возвращает каталог
- [ ] 404/502 пробрасываются с корректным status
- [ ] `FASTAPI_URL` не в `NEXT_PUBLIC_*`
- [ ] Client probe работает без CORS

---

## Частые проблемы

| Симптом | Решение |
|---------|---------|
| 404 на proxy | проверьте `[...path]` и join `/` |
| HTML вместо JSON | upstream URL неверный |
| 502 always | FastAPI down или неверный `FASTAPI_URL` |
| Двойной `/api/v1` | не дублируйте prefix в path |

---

Следующий урок: [21. Server Actions: формы без отдельного API](21-server-actions.md).
