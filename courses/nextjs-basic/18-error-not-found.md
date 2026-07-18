# 18. Error boundaries: `error.tsx`, `notFound()`

## Введение: сценарий с работы

QA открывает `/catalog/999` — белый экран и generic «Application error» в production. В dev — красный overlay со stack trace. PM: «Нужна нормальная 404, не паника». Отдельно: FastAPI упал на `/catalog` — пользователь видит технический JSON в overlay, а мониторинг молчит, потому что **throw в RSC не попал в try/catch на клиенте**.

В App Router ошибки и «не найдено» — **файловые соглашения**, не только React Error Boundary в `"use client"`. `error.tsx` ловит runtime-ошибки сегмента; `not-found.tsx` + `notFound()` — контролируемый HTTP 404. Без них один `throw` в `getItems()` ломает весь UX.

## Что вы узнаете

- `error.tsx` — client boundary для segment
- `global-error.tsx` для root
- `not-found.tsx` и функция `notFound()`
- Разница 404 vs 500 в Next.js
- `error` vs `loading` vs `not-found`
- Логирование и `digest`
- Интеграция с FastAPI 404

---

## Три файла UI-состояний

| Файл | Когда показывается | HTTP (typical) |
|------|-------------------|----------------|
| `loading.tsx` | Suspense / async pending | 200 (streaming) |
| `error.tsx` | uncaught error в segment | 200/500* |
| `not-found.tsx` | вызов `notFound()` | **404** |

\* В production Next может отдать 500 для unhandled server error; детали зависят от deployment.

Все три — **convention over configuration** рядом с `page.tsx` в сегменте маршрута.

---

## `error.tsx`

**Обязательно Client Component** — React Error Boundary работает только на клиенте после hydration (и для специальной серверной интеграции Next).

```tsx
// app/catalog/error.tsx
"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CatalogError({ error, reset }: Props) {
  return (
    <section role="alert">
      <h2>Не удалось загрузить каталог</h2>
      <p className="muted">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "Попробуйте позже или обновите страницу."}
      </p>
      {error.digest ? (
        <p className="muted">
          <small>Код: {error.digest}</small>
        </p>
      ) : null}
      <button type="button" onClick={() => reset()}>
        Повторить
      </button>
    </section>
  );
}
```

### Поведение

- Ловит ошибки в **дочерних** Server/Client Components этого сегмента.
- **Не** ловит ошибки в том же `layout.tsx` этого уровня (layout выше — свой error или bubble up).
- `reset()` — повторный render segment без full page reload.

### `digest`

В production Next **скрывает** message stack; остаётся `digest` — id для корреляции с server logs. Логируйте на сервере в loader:

```tsx
if (!res.ok) {
  console.error("getItems failed", res.status);
  throw new Error(`Catalog unavailable: ${res.status}`);
}
```

---

## `notFound()` и `not-found.tsx`

```tsx
// app/catalog/[id]/page.tsx
import { notFound } from "next/navigation";
import { getItem } from "@/lib/api/items";

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const itemId = Number(id);
  if (Number.isNaN(itemId)) notFound();

  const item = await getItem(itemId);
  if (!item) notFound();

  return <article><h1>{item.title}</h1></article>;
}
```

```tsx
// app/catalog/[id]/not-found.tsx
import Link from "next/link";

export default function ItemNotFound() {
  return (
    <section>
      <h1>Товар не найден</h1>
      <p className="muted">Возможно, он удалён из каталога.</p>
      <Link href="/catalog">← В каталог</Link>
    </section>
  );
}
```

`notFound()` — **не throw Error**; это controlled flow → 404 + ближайший `not-found.tsx` вверх по дереву.

### FastAPI 404

```tsx
export async function getItem(id: number): Promise<Item | null> {
  const res = await fetch(`${baseUrl()}/api/v1/items/${id}`);
  if (res.status === 404) return null; // → notFound() на page
  if (!res.ok) throw new Error(`Item fetch ${res.status}`);
  return (await res.json()) as Item;
}
```

| API ответ | Действие в page |
|-----------|-----------------|
| 404 | `notFound()` |
| 500 | `throw` → `error.tsx` |
| 200 + пусто | бизнес-логика / empty UI |

---

## Иерархия `not-found.tsx`

```text
app/
  not-found.tsx              # глобальная 404
  catalog/
    not-found.tsx            # для всего /catalog/*
    [id]/
      not-found.tsx          # специфичная для товара
```

Next выбирает **ближайший** `not-found.tsx` при `notFound()`.

---

## `global-error.tsx`

Ошибка в **root** `layout.tsx` — обычный `error.tsx` может не сработать (нет родительского layout). Root fallback:

```tsx
// app/global-error.tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body>
        <h1>Критическая ошибка</h1>
        <button type="button" onClick={() => reset()}>
          Перезагрузить
        </button>
      </body>
    </html>
  );
}
```

Должен включать `<html>` и `<body>`.

---

## `error.tsx` vs try/catch в Server Component

```tsx
export default async function CatalogPage() {
  try {
    const items = await getItems();
    return <List items={items} />;
  } catch {
    return <p>Ошибка загрузки</p>; // inline fallback — OK для простых случаев
  }
}
```

| Подход | Плюсы | Минусы |
|--------|-------|--------|
| try/catch в page | полный контроль UI | дублирование на каждой page |
| `error.tsx` | единый UX сегмента, reset | client component, не ловит layout sibling |

Для каталога shop — **`error.tsx` на `/catalog`** + try/catch только если нужен частичный fallback (header ok, list failed).

---

## Metadata и 404

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(Number(id));
  if (!item) return { title: "Не найдено" };
  return { title: item.title };
}
```

`generateMetadata` вызывается до page; при `notFound()` в metadata — осторожно с double fetch; используйте `cache()` ([17-parallel-fetch.md](17-parallel-fetch.md)).

---

## Связь с HTTP и SEO

- **404** — поисковики удаляют URL из индекса (норма для «товар снят»).
- **500** на `/catalog` — плохой сигнал; мониторинг + `error.tsx` с retry.
- Не возвращайте **200** с текстом «не найдено» без `notFound()` — soft 404 вредит SEO.

---

## Логирование в production

```tsx
// error.tsx
"use client";

import { useEffect } from "react";

export default function CatalogError({ error, reset }: Props) {
  useEffect(() => {
    // отправка в Sentry / Datadog — только на клиенте
    console.error("Catalog segment error", error.digest ?? error.message);
  }, [error]);

  return (/* UI */);
}
```

Server-side ошибки логируйте **в loader до throw** — client error boundary не видит server console пользователя.

---

## Типичные ошибки

1. **`error.tsx` без `"use client"`** — build error.

2. **Вызывать `notFound()` для 500** — пользователь думает «товара нет», а API лежит.

3. **Пустой `not-found.tsx`** — generic root 404 без навигации назад.

4. **Ожидать, что error boundary поймает event handler** — только render/lifecycle children; ошибки в onClick — свой try/catch.

5. **Дублировать fetch в page и generateMetadata** — без `cache()` два запроса.

6. **Показывать stack trace в production error UI** — утечка внутренностей.

7. **Забыть `reset` button** — пользователь застрял без reload.

8. **Ловить 404 через throw new Error('Not found')** — HTTP 500 вместо 404.

---

## Чек-лист

- Почему `error.tsx` — client component?
- Чем `notFound()` отличается от `throw`?
- Какой HTTP статус у controlled 404?
- Где ловится ошибка в `layout.tsx` catalog?
- Что такое `digest` в production?
- FastAPI 404 → какое действие в Next page?
- Когда try/catch лучше, чем `error.tsx`?

Следующий урок: [19. Route Handlers: REST в `app/api`](19-route-handlers.md).
