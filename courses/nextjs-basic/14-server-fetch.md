# 14. `fetch` в Server Components

## Введение: сценарий с работы

Пятница, 16:47. Тикет **NEXT-214**: «Каталог на главной пустой в production, локально работает». Вы перенесли код из Vite SPA: `useEffect` + `fetch('/api/v1/items')` — и получили ошибку сборки: *"You're importing a component that needs useEffect. It only works in a Client Component"*. Коллега предложил добавить `"use client"` на всю страницу — tech lead отклонил: «Тогда теряем SSR и SEO».

В App Router **данные для первого экрана загружают на сервере** — в Server Component, который может быть `async`. Там же вызывают `fetch`, но правила другие: нет CORS (запрос идёт из Node-процесса Next.js), URL к backend должен быть **абсолютным**, а компонент — **асинхронной функцией**. Эта глава — мост между [09-server-components.md](09-server-components.md) и лабой [15-lab-server-fetch.md](15-lab-server-fetch.md), где вы подключите FastAPI на `:8090`.

## Что вы узнаете

- Почему `fetch` в Server Component не требует `"use client"`
- Как объявить **async Server Component**
- Абсолютные URL к FastAPI и переменная `FASTAPI_URL`
- Разбор ответа: `response.ok`, `json()`, типизация
- Отличие server `fetch` от browser `fetch` (CORS, cookies)
- Паттерн «тонкая страница + функция загрузки данных»
- Подготовка к кэшированию (глава 16)

---

## Server Component и данные

Server Component рендерится **на сервере** (build time или request time). Он:

- **не** попадает в JS-бандл клиента (кроме serialized HTML/RSC payload);
- **может** читать env-секреты и обращаться к внутренним сервисам;
- **не может** использовать hooks (`useState`, `useEffect`).

Загрузка данных — **прямо в теле компонента** или в вызываемой функции:

```tsx
// app/catalog/page.tsx — Server Component (нет "use client")
type Item = {
  id: number;
  title: string;
  description?: string;
};

type ItemsResponse = {
  items: Item[];
  total: number;
};

async function getItems(): Promise<Item[]> {
  const base = process.env.FASTAPI_URL ?? "http://localhost:8090";
  const res = await fetch(`${base}/api/v1/items`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`FastAPI вернул ${res.status}`);
  }

  const data = (await res.json()) as ItemsResponse;
  return data.items;
}

export default async function CatalogPage() {
  const items = await getItems();

  return (
    <section>
      <h1>Каталог</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            {item.description ? <p>{item.description}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Обратите внимание: `export default async function` — **async-компонент** допустим только в Server Components.

---

## Async Server Components

| Аспект | Client Component | Async Server Component |
|--------|------------------|------------------------|
| Директива | `"use client"` | не нужна (по умолчанию server) |
| `async`/`await` | нельзя на уровне компонента | **можно** |
| `fetch` при mount | через `useEffect` | **await в теле** |
| Первый HTML | пустой / skeleton | **данные уже в HTML** |
| Секреты | только `NEXT_PUBLIC_*` | любые env на сервере |

React «приостанавливает» рендер async-компонента, пока Promise не resolve. Пользователь может увидеть `loading.tsx` из [06-layouts-templates.md](06-layouts-templates.md) или streaming через Suspense ([13-suspense-streaming.md](13-suspense-streaming.md)).

---

## Абсолютные URL

В браузере `fetch('/api/v1/items')` резолвится относительно **origin страницы** (`http://localhost:3000`). На сервере Next.js **нет** такого origin для backend — относительный путь `/api/v1/items` уйдёт на **сам Next**, а не на FastAPI `:8090`.

**Правило:** server-side `fetch` к внешнему API — **полный URL**:

```tsx
const base = process.env.FASTAPI_URL ?? "http://localhost:8090";
await fetch(`${base}/api/v1/items`);
```

Скопируйте [`.env.example`](examples/.env.example) в `examples/.env.local`:

```env
FASTAPI_URL=http://localhost:8090
```

Подробнее про env — [28-env-config.md](28-env-config.md). **Не** используйте `NEXT_PUBLIC_FASTAPI_URL` для server-only вызовов — URL backend не должен светиться клиенту без необходимости.

---

## Формат ответа FastAPI

Стенд [deploy/fastapi](../../deploy/fastapi/README.md) отдаёт:

```json
{
  "items": [
    { "id": 1, "title": "Demo item", "description": "From course stack" }
  ],
  "total": 1
}
```

Проверьте актуальную схему: [http://localhost:8090/docs](http://localhost:8090/docs).

```bash
curl http://localhost:8090/health
curl http://localhost:8090/api/v1/items
```

---

## Обработка ошибок HTTP

Как и в браузере, `fetch` **не reject** на 404/500 — только на сетевые сбои:

```tsx
async function getItems(): Promise<Item[]> {
  const base = process.env.FASTAPI_URL ?? "http://localhost:8090";
  let res: Response;

  try {
    res = await fetch(`${base}/api/v1/items`, {
      next: { revalidate: 60 }, // кэш — глава 16
    });
  } catch (err) {
    // FastAPI не запущен, DNS, timeout
    throw new Error("Не удалось связаться с API", { cause: err });
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as ItemsResponse;
  return data.items;
}
```

Необработанный `throw` в Server Component приведёт к `error.tsx` ([18-error-not-found.md](18-error-not-found.md)).

---

## Server fetch vs Client fetch

| | Server `fetch` | Client `fetch` |
|---|----------------|------------------|
| Где выполняется | Node.js (Next server) | Браузер |
| CORS | **нет** | да, если другой origin |
| Cookies пользователя | нужен явный `headers: { cookie }` | отправляются автоматически |
| Видимость URL backend | скрыт от пользователя | виден в DevTools |
| Когда использовать | первый экран, SEO, секреты | интерактив, polling, корзина |

Для shop-каталога **первый список** — Server Component; фильтр «на лету» без перезагрузки — Client island + Query ([24-tanstack-query.md](24-tanstack-query.md)).

---

## Паттерн: loader-функция

Держите страницу «тонкой», логику — в `lib/`:

```text
examples/
  app/
    catalog/
      page.tsx          # async, только JSX + await
  lib/
    api/
      items.ts          # getItems(), getItem(id)
      types.ts          # Item, ItemsResponse
```

```tsx
// lib/api/items.ts
import type { Item, ItemsResponse } from "./types";

function apiBase(): string {
  return process.env.FASTAPI_URL ?? "http://localhost:8090";
}

export async function getItems(): Promise<Item[]> {
  const res = await fetch(`${apiBase()}/api/v1/items`);
  if (!res.ok) throw new Error(`Items list failed: ${res.status}`);
  const data = (await res.json()) as ItemsResponse;
  return data.items;
}

export async function getItem(id: number): Promise<Item | null> {
  const res = await fetch(`${apiBase()}/api/v1/items/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Item ${id} failed: ${res.status}`);
  return (await res.json()) as Item;
}
```

Один источник правды для страниц, Route Handlers (глава 19) и Server Actions (глава 21).

---

## Связь с React из react-basic

В [react-basic/17-fetch-react.md](../react-basic/17-fetch-react.md) вы загружали данные в `useEffect`. В Next.js **эквивалент первого рендера** — `await` в Server Component:

```text
SPA (Vite)                    Next.js App Router
─────────────────────────────────────────────────
mount → useEffect → fetch     request → async page → fetch
loading spinner в браузере      HTML с данными с серв
```

Клиентский `useEffect`+`fetch` в Next.js **не запрещён**, но для статического каталога это шаг назад по UX и SEO.

---

## Динамический сегмент `[id]`

```tsx
// app/catalog/[id]/page.tsx
import { getItem } from "@/lib/api/items";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const itemId = Number(id);
  if (Number.isNaN(itemId)) notFound();

  const item = await getItem(itemId);
  if (!item) notFound();

  return (
    <article>
      <h1>{item.title}</h1>
      <p>{item.description}</p>
    </article>
  );
}
```

В Next.js 15 `params` — **Promise**; в более ранних версиях — синхронный объект. Сверяйтесь с версией в [`examples/package.json`](examples/package.json).

---

## Типичные ошибки

1. **`"use client"` + async component** — синтаксически невозможно; hooks и async на одном компоненте не совмещаются.

2. **Относительный URL на сервере** — `fetch('/api/v1/items')` бьёт в Next `:3000`, не в FastAPI `:8090`.

3. **Забыть `await res.json()`** — рендерите объект `Response`, не данные.

4. **Нет проверки `res.ok`** — пустой или битый JSON при 500 маскируется как «пустой каталог».

5. **Ожидать массив в корне JSON** — FastAPI возвращает `{ items, total }`, не `Item[]`.

6. **FastAPI не запущен** — `ECONNREFUSED`; в dev читайте stack trace, в prod — `error.tsx`.

7. **Дублировать fetch в layout и page** — без dedupe (глава 17) два запроса на один URL.

8. **`NEXT_PUBLIC_*` для server-only URL** — лишняя утечка инфраструктуры в бандл.

---

## Чек-лист

- Почему Server Component может быть `async`, а Client — нет?
- Зачем абсолютный URL при server-side `fetch`?
- Reject ли `fetch` на HTTP 404?
- Какая структура JSON у `GET /api/v1/items` на стенде?
- Где хранить `FASTAPI_URL` — `.env.local` или hardcode?
- Чем server fetch отличается от client по CORS?
- Что покажет пользователь, если `getItems()` бросит ошибку без `error.tsx`?

Следующий урок: [15. Лаба: список товаров с FastAPI :8090](15-lab-server-fetch.md).
