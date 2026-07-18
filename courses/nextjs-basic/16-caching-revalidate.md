# 16. Кэш Next.js: `revalidate`, tags, `no-store`

## Введение: сценарий с работы

Понедельник после релиза. Менеджер: «В админке FastAPI поменяли описание товара, на сайте — старый текст уже два часа». Вы смотрите код — `fetch` без опций, деплой на Vercel. Коллега говорит: «Next закэшировал страницу навсегда». Другой: «Поставь `cache: 'no-store'` везде». Tech lead: «Тогда каждый заход бьёт в API — нагрузка x10».

В App Router **`fetch` на сервере участвует в Data Cache** — это не HTTP-кэш браузера и не Redis. Next.js запоминает результат `fetch` и может отдавать его следующим запросам, пока не истечёт `revalidate` или вы не инвалидируете tag. Понимание этой модели — разница между «быстрый SEO-каталог» и «в prod вечно Demo item».

## Что вы узнаете

- Data Cache vs Full Route Cache vs Router Cache
- Опции `fetch`: по умолчанию, `cache: 'force-cache'`, `cache: 'no-store'`
- `next: { revalidate: N }` — ISR-подобное поведение
- `next: { tags: ['items'] }` и `revalidateTag`
- `export const dynamic = 'force-dynamic'`
- `export const revalidate` на уровне сегмента
- Когда что выбирать для shop-каталога

---

## Три слоя кэша (упрощённо)

| Слой | Где | Что кэширует |
|------|-----|--------------|
| **Request memoization** | один HTTP-запрос | одинаковый `fetch` в дереве RSC |
| **Data Cache** | сервер Next | результат `fetch` между запросами |
| **Full Route Cache** | сервер Next | статически сгенерированный HTML/RSC (если route static) |

**Router Cache** — на клиенте: prefetched маршруты в SPA-навигации. Не путать с Data Cache.

Для backend-разработчика аналогия: Data Cache ≈ in-memory кэш ответов HTTP-клиента с TTL; tags ≈ cache invalidation по ключу.

---

## Поведение `fetch` по умолчанию

В Server Component без опций:

```tsx
await fetch(`${base}/api/v1/items`);
```

Next.js **кэширует** GET-ответ в Data Cache (поведение близко к `force-cache`). При static generation страница может собраться **на build** с данными того момента.

Для **всегда свежих** данных (личный кабинет, корзина на сервере):

```tsx
await fetch(url, { cache: "no-store" });
```

Это помечает fetch как **dynamic** — route не статизируется целиком из кэша build.

---

## Time-based revalidation (ISR)

```tsx
export async function getItems(): Promise<Item[]> {
  const res = await fetch(`${baseUrl()}/api/v1/items`, {
    next: { revalidate: 60 }, // секунды
  });
  // ...
}
```

| Момент | Поведение |
|--------|-----------|
| Первый запрос | fetch → API, сохранить в Data Cache |
| Запросы &lt; 60 сек | отдать из кэша |
| После 60 сек | следующий запрос **может** показать stale и **фоном** обновить (stale-while-revalidate) |

Подходит для каталога, где задержка в минуту допустима.

---

## Tag-based revalidation

```tsx
// загрузка
await fetch(`${base}/api/v1/items`, {
  next: { tags: ["catalog-items"] },
});

await fetch(`${base}/api/v1/items/${id}`, {
  next: { tags: ["catalog-items", `item-${id}`] },
});
```

Инвалидация из Route Handler или Server Action:

```tsx
import { revalidateTag } from "next/cache";

revalidateTag("catalog-items");
```

| Подход | Когда |
|--------|-------|
| `revalidate: 60` | предсказуемый TTL, нет webhook |
| `tags` + `revalidateTag` | после мутации в admin, webhook от FastAPI |
| `no-store` | персональные / realtime данные |

В [21-server-actions.md](21-server-actions.md) вы вызовете `revalidatePath('/catalog')` после формы.

---

## `revalidatePath`

```tsx
import { revalidatePath } from "next/cache";

revalidatePath("/catalog");
revalidatePath("/catalog/[id]", "page");
```

Сбрасывает кэш **маршрута**, не только одного fetch. Удобно после Server Action «обновить товар».

---

## Segment config

На уровне `page.tsx` или `layout.tsx`:

```tsx
// Всегда dynamic — каждый request заново
export const dynamic = "force-dynamic";

// Или TTL для всего сегмента
export const revalidate = 300;
```

| Экспорт | Эффект |
|---------|--------|
| `dynamic = 'force-dynamic'` | opt-out из static, аналог no-store mindset |
| `dynamic = 'force-static'` | принудительная статика (осторожно с cookies) |
| `revalidate = N` | default TTL для fetch без своего `next.revalidate` |
| `fetchCache = 'default-no-store'` | все fetch в сегменте без store |

**Порядок:** более специфичный `fetch` перекрывает segment defaults.

---

## Таблица решений для shop

| Данные | Рекомендация | Пример |
|--------|--------------|--------|
| Публичный каталог | `revalidate: 60–300` или tags | `/catalog` |
| Карточка товара | tag `item-${id}` | `/catalog/[id]` |
| Профиль пользователя | `no-store` + cookies | `/account` |
| Health / metrics | `no-store` или `revalidate: 10` | internal |
| Корзина (client) | не server fetch | Context, глава 25 |

---

## Пример: эволюция loader из лабы 15

```tsx
// lib/api/items.ts
type FetchItemsOptions = {
  fresh?: boolean;
};

export async function getItems(options?: FetchItemsOptions): Promise<Item[]> {
  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } =
    {
      headers: { Accept: "application/json" },
    };

  if (options?.fresh) {
    init.cache = "no-store";
  } else {
    init.next = { revalidate: 120, tags: ["catalog-items"] };
  }

  const res = await fetch(`${baseUrl()}/api/v1/items`, init);
  // ...
}
```

Preview-режим CMS часто передаёт `?fresh=1` → `fresh: true`.

---

## Static vs Dynamic routes

Next помечает route **static** или **dynamic** по признакам:

- `cookies()`, `headers()`, `searchParams` (dynamic usage)
- `cache: 'no-store'`
- `export const dynamic = 'force-dynamic'`

Проверка после `next build`:

```bash
cd courses/nextjs-basic/examples
npm run build
```

В выводе — таблица маршрутов: ○ static, ƒ dynamic. Если `/catalog` static, а данные должны обновляться — добавьте `revalidate` или tags.

---

## Отличие от CDN и браузера

| | Data Cache Next | Cache-Control CDN |
|---|-----------------|-------------------|
| Где | процесс Next.js | edge CDN |
| Инвалидация | `revalidateTag`, `revalidatePath` | purge API CDN |
| Видимость | server-only | HTTP-заголовки |

`fetch` cache **не** выставляет автоматически `Cache-Control` для браузера на API-ответ — это отдельная настройка Route Handler или FastAPI.

---

## Связь с FastAPI

FastAPI `:8090` **не знает** про кэш Next. Если Next закэшировал `{ items: [...] }`, FastAPI уже не вызывается до revalidate. Для «мгновенного» обновления после правки в admin:

1. Webhook POST → Route Handler → `revalidateTag('catalog-items')`, или
2. Server Action после формы admin (если admin в Next), или
3. Короткий `revalidate: 30` как компромисс.

---

## Типичные ошибки

1. **`no-store` везде «на всякий случай»** — лишняя нагрузка на FastAPI, медленнее TTFB.

2. **Ждать мгновенного обновления с `revalidate: 3600`** — пользователи час видят stale.

3. **Забыть tag на детальной странице** — список обновился, `/catalog/1` — нет.

4. **Путать Router Cache с Data Cache** — «обновил API, при client navigation старое» → hard refresh или `router.refresh()`.

5. **POST/PUT через fetch с cache** — мутирующие методы не кэшируются как GET; но нужен `revalidatePath` после.

6. **Static build с live API на CI** — build-time fetch упал → build failed; mock или `dynamic`.

7. **Два fetch с разными опциями на один URL** — непредсказуемое memo/cache поведение; унифицируйте loader.

8. **Не проверять `next build` route table** — сюрприз в prod «страница static с вчерашними ценами».

---

## Чек-лист

- Чем Data Cache отличается от кэша браузера?
- Что делает `cache: 'no-store'` для route static/dynamic?
- Когда `revalidate: 60` лучше, чем `no-store`?
- Как инвалидировать все товары одной командой?
- Зачем `revalidatePath` если есть `revalidateTag`?
- Как увидеть static vs dynamic после build?
- Почему после деплоя каталог «замёрз» без revalidate?

Следующий урок: [17. Параллельные запросы и `Promise.all`](17-parallel-fetch.md).
