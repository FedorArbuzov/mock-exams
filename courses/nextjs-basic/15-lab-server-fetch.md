# 15. Лаба: список товаров с FastAPI :8090

## Сценарий

Тикет **NEXT-215**: «Подключить каталог к FastAPI, SSR-список на `/catalog`». Backend на `:8090` отдаёт JSON — ваша задача в Next.js: server `fetch` из [14-server-fetch.md](14-server-fetch.md), типы, UI loading/error через Suspense или явную обработку. Без `"use client"` на всей странице.

**Время:** ~50–65 минут.  
**Стенд:** [deploy/fastapi](../../deploy/fastapi/README.md) обязателен.  
**Код:** [`examples/`](examples/package.json).

---

## Подготовка

Терминал 1 — API:

```bash
cd deploy/fastapi
docker compose up -d --build
curl http://localhost:8090/health
curl http://localhost:8090/api/v1/items
```

Терминал 2 — Next.js:

```bash
cd courses/nextjs-basic/examples
cp .env.example .env.local
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). В навигации уже есть ссылка «Каталог» — страница пока пустая.

Целевая структура:

```text
examples/
  .env.local
  lib/
    api/
      types.ts
      items.ts
  app/
    catalog/
      page.tsx
      loading.tsx      # опционально
    catalog/[id]/
      page.tsx         # бонус, если успеете
  components/
    catalog/
      ItemCard.tsx     # Server Component
```

---

## Задание 1. Типы `lib/api/types.ts`

```tsx
export type Item = {
  id: number;
  title: string;
  description?: string;
};

export type ItemsResponse = {
  items: Item[];
  total: number;
};
```

Сверьте с [http://localhost:8090/docs](http://localhost:8090/docs). Поля должны совпадать с реальным ответом.

---

## Задание 2. Loader `lib/api/items.ts`

```tsx
import type { Item, ItemsResponse } from "./types";

function baseUrl(): string {
  return process.env.FASTAPI_URL ?? "http://localhost:8090";
}

export async function getItems(): Promise<Item[]> {
  const res = await fetch(`${baseUrl()}/api/v1/items`, {
    headers: { Accept: "application/json" },
    cache: "no-store", // пока без кэша — глава 16
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Не удалось загрузить каталог (${res.status}): ${text}`);
  }

  const data = (await res.json()) as ItemsResponse;
  return data.items;
}
```

**Критерий:** при остановленном FastAPI страница падает с понятной ошибкой (позже оформите `error.tsx`).

---

## Задание 3. `ItemCard` (Server Component)

```tsx
// components/catalog/ItemCard.tsx
import Link from "next/link";
import type { Item } from "@/lib/api/types";

type Props = { item: Item };

export function ItemCard({ item }: Props) {
  return (
    <li className="card">
      <Link href={`/catalog/${item.id}`}>
        <strong>{item.title}</strong>
      </Link>
      {item.description ? (
        <p className="muted">{item.description}</p>
      ) : null}
    </li>
  );
}
```

Без `"use client"` — только разметка и `Link`.

---

## Задание 4. Страница `app/catalog/page.tsx`

```tsx
import { getItems } from "@/lib/api/items";
import { ItemCard } from "@/components/catalog/ItemCard";

export const metadata = {
  title: "Каталог",
};

export default async function CatalogPage() {
  const items = await getItems();

  if (items.length === 0) {
    return (
      <section>
        <h1>Каталог</h1>
        <p className="muted">Товаров пока нет.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Каталог</h1>
      <p className="muted">Загружено с FastAPI :8090 (SSR)</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
```

---

## Задание 5. `loading.tsx` (опционально)

```tsx
// app/catalog/loading.tsx
export default function CatalogLoading() {
  return (
    <section aria-busy="true">
      <h1>Каталог</h1>
      <p className="muted">Загрузка товаров…</p>
    </section>
  );
}
```

Искусственно замедлите `getItems` (`await new Promise(r => setTimeout(r, 800))`) и убедитесь, что skeleton показывается.

---

## Задание 6. Проверка SSR

1. Отключите JavaScript в DevTools → **Reload**.
2. Каталог **должен** отображаться — данные в HTML, не только после hydration.
3. **View Page Source** — найдите `Demo item` в исходнике.

| Проверка | Ожидание |
|----------|----------|
| `/catalog` с запущенным FastAPI | список товаров |
| FastAPI остановлен | ошибка (dev overlay или error boundary) |
| Пустой `_ITEMS` в FastAPI | текст «Товаров пока нет» |
| SSR без JS | контент виден |

---

## Бонус: страница товара

```tsx
// lib/api/items.ts — добавьте
export async function getItem(id: number): Promise<Item | null> {
  const res = await fetch(`${baseUrl()}/api/v1/items/${id}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Item ${id}: ${res.status}`);
  return (await res.json()) as Item;
}
```

```tsx
// app/catalog/[id]/page.tsx
import { getItem } from "@/lib/api/items";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (Number.isNaN(numId)) notFound();

  const item = await getItem(numId);
  if (!item) notFound();

  return (
    <article>
      <h1>{item.title}</h1>
      <p>{item.description}</p>
    </article>
  );
}
```

---

## Частые проблемы

| Симптом | Причина | Решение |
|---------|---------|---------|
| `ECONNREFUSED` | FastAPI не запущен | `docker compose up` в deploy/fastapi |
| Пустой массив, curl OK | неверный парсинг JSON | читайте `data.items`, не корень |
| 404 на `/catalog` | нет `page.tsx` | создайте `app/catalog/page.tsx` |
| CORS в консоли | client fetch на :8090 | используйте server fetch (эта лаба) |

---

## Критерии приёмки

- [ ] `GET` идёт на `FASTAPI_URL/api/v1/items` с сервера
- [ ] Типы совпадают с OpenAPI
- [ ] Список рендерится без `"use client"` на странице
- [ ] Empty state при `items.length === 0`
- [ ] Контент виден при отключённом JS (SSR)
- [ ] (Бонус) `/catalog/1` открывает карточку товара

---

## Что дальше

В [16-caching-revalidate.md](16-caching-revalidate.md) замените `cache: 'no-store'` на `revalidate` и разберёте, почему prod «залип» на старых ценах.

Следующий урок: [16. Кэш, revalidate, tags, no-store](16-caching-revalidate.md).
