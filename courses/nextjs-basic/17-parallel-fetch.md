# 17. Параллельные запросы, `Promise.all`, waterfall

## Введение: сценарий с работы

Страница товара `/catalog/[id]` тормозит: 1.2 секунды TTFB. Lighthouse: «Avoid chaining critical requests». Вы открываете код — последовательные `await`:

```tsx
const item = await getItem(id);
const related = await getRelated(id);
const reviews = await getReviews(id);
```

Три независимых GET к FastAPI `:8090`, но они ждут друг друга: 400 + 400 + 400 ms. Плюс layout тоже вызывает `getItems()` — без dedupe получается **дубль** запроса. Tech lead: «Параллельте независимое, dedupe — через `React.cache()` или один loader».

Waterfall — главный враг server-side data fetching. Эта глава учит **параллелить** с `Promise.all`, **избегать лишних await** и **дедуплицировать** запросы в одном render pass.

## Что вы узнаете

- Waterfall vs parallel fetch на сервере
- `Promise.all`, `Promise.allSettled` для RSC
- Независимые vs зависимые запросы
- Request memoization встроенного `fetch`
- `React.cache()` для dedupe функций
- Композиция с Suspense (параллельные границы)
- Антипаттерны в layout + page

---

## Waterfall: проблема

```tsx
export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const item = await getItem(Number(id));       // 400 ms
  const related = await getRelated(item.id);    // +350 ms — зависит от item ✓
  const promo = await getPromoBanner();         // +200 ms — НЕ зависит ✗
  // итого ~950 ms sequential, хотя promo можно было параллельно с item
}
```

**Зависимый** запрос (related нужен `item.id`) — после `item`.  
**Независимый** (`getPromoBanner`) — параллельно с `getItem`.

---

## `Promise.all` для независимых запросов

```tsx
export default async function DashboardPage() {
  const [items, promo, stats] = await Promise.all([
    getItems(),
    getPromoBanner(),
    getShopStats(),
  ]);

  return (
    <section>
      <Promo data={promo} />
      <Stats data={stats} />
      <ItemGrid items={items} />
    </section>
  );
}
```

Время ≈ **max**(t1, t2, t3), не сумма.

### Ошибки

`Promise.all` reject на **первой** ошибке — весь page error. Если часть данных optional:

```tsx
const [itemsResult, promoResult] = await Promise.allSettled([
  getItems(),
  getPromoBanner(),
]);

const items = itemsResult.status === "fulfilled" ? itemsResult.value : [];
const promo = promoResult.status === "fulfilled" ? promoResult.value : null;
```

---

## Смешанный паттерн: parallel + sequential

```tsx
export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const itemId = Number(id);

  const [item, promo] = await Promise.all([
    getItem(itemId),
    getPromoBanner(),
  ]);

  if (!item) notFound();

  const related = await getRelated(item.categoryId);

  return (/* JSX */);
}
```

`getRelated` остаётся после `item` — это корректный waterfall **там, где есть зависимость**.

---

## Встроенная dedupe `fetch`

Next.js **мemoizes** одинаковые `fetch` в рамках **одного server request** (один render pass):

```tsx
// layout.tsx
const items = await getItems();

// page.tsx (тот же request)
const itemsAgain = await getItems(); // тот же URL + options → один HTTP
```

Условия memoization:

- тот же URL;
- те же опции `fetch` (включая `next.revalidate`, tags);
- GET.

**Не dedupe:** разные `cache`/`revalidate`, POST, разные query strings.

---

## `React.cache()` — dedupe произвольных функций

`fetch` memoization не распространяется на DB-клиент, gRPC или обёртку с логикой. **`React.cache()`** кэширует результат функции **на один request**:

```tsx
import { cache } from "react";

export const getItems = cache(async (): Promise<Item[]> => {
  const res = await fetch(`${baseUrl()}/api/v1/items`, {
    next: { revalidate: 60, tags: ["catalog-items"] },
  });
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as ItemsResponse;
  return data.items;
});

export const getItem = cache(async (id: number): Promise<Item | null> => {
  const res = await fetch(`${baseUrl()}/api/v1/items/${id}`, {
    next: { tags: [`item-${id}`] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as Item;
});
```

| | `fetch` memo | `React.cache()` |
|---|--------------|-----------------|
| Область | только `fetch` | любая async функция |
| Ключ | URL + options | аргументы функции (по reference для objects) |
| Между requests | Data Cache (отдельно) | нет — только один render |

**Важно:** `cache()` — не глобальный Redis; только dedupe в одном запросе.

---

## Параллельные Server Components + Suspense

Альтернатива «один большой Promise.all» — **разбить UI** и stream:

```tsx
// app/catalog/[id]/page.tsx
import { Suspense } from "react";
import { ItemDetails } from "./ItemDetails";
import { RelatedItems } from "./RelatedItems";
import { Reviews } from "./Reviews";

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  return (
    <article>
      <Suspense fallback={<p>Загрузка товара…</p>}>
        <ItemDetails id={id} />
      </Suspense>
      <Suspense fallback={<p>Рекомендации…</p>}>
        <RelatedItems id={id} />
      </Suspense>
      <Suspense fallback={<p>Отзывы…</p>}>
        <Reviews id={id} />
      </Suspense>
    </article>
  );
}
```

```tsx
// ItemDetails.tsx — async Server Component
export async function ItemDetails({ id }: { id: string }) {
  const item = await getItem(Number(id));
  if (!item) notFound();
  return <h1>{item.title}</h1>;
}
```

Три async-компонента **стартует параллельно**; HTML стримится по мере готовности ([13-suspense-streaming.md](13-suspense-streaming.md)). UX лучше, чем ждать самый медленный в одном `await`.

---

## Layout + Page: антипаттерн

```tsx
// app/catalog/layout.tsx — ПЛОХО: тяжёлый fetch в layout
export default async function CatalogLayout({ children }) {
  const items = await getItems(); // блокирует ВСЕ вложенные страницы
  return (
    <div>
      <Sidebar items={items} />
      {children}
    </div>
  );
}
```

Layout fetch **блокирует** children. Если sidebar нужен везде — ок; если `/catalog/[id]` не нужен полный список — вынесите sidebar в отдельный Suspense boundary или client fetch.

---

## Таблица паттернов

| Сценарий | Паттерн |
|----------|---------|
| 3 независимых API | `Promise.all` |
| 1 обязателен, 2 optional | `Promise.allSettled` |
| Зависимость A → B | sequential await |
| Дубль getItems в layout+page | `React.cache()` или один fetch |
| Медленный блок не блокирует весь экран | Suspense + async child |
| Клиентский polling | не RSC — TanStack Query (24) |

---

## Измерение

Dev:

```tsx
console.time("item-page");
const [item, promo] = await Promise.all([getItem(id), getPromo()]);
console.timeEnd("item-page");
```

Production: логируйте duration в loader, OpenTelemetry, или APM на Node. Сравните sequential vs parallel на staging.

---

## Типичные ошибки

1. **await в цикле** — `for (const id of ids) await getItem(id)` → N×latency; используйте `Promise.all(ids.map(getItem))`.

2. **Promise.all с зависимыми данными** — `getRelated` до `getItem` → runtime ошибка или лишний запрос.

3. **Думать, что `cache()` заменяет Data Cache** — между пользователями dedupe не работает; нужен `revalidate` (глава 16).

4. **Разные опции fetch «для скорости»** — ломает memo, двойной HTTP.

5. **Огромный Promise.all** — один fail роняет всю страницу; разбейте critical vs optional.

6. **Suspense без fallback** — плохой UX при stream.

7. **Параллелить запись** — POST параллельно без идempotency опасен; глава про mutations — Server Actions.

8. **Игнорировать лимит FastAPI** — 20 параллельных fetch могут исчерпать pool; batch endpoint на backend иногда лучше.

---

## Чек-лист

- Чем waterfall отличается от parallel по времени ответа?
- Когда `Promise.all`, когда `allSettled`?
- Dedupe ли два одинаковых `fetch` в layout и page?
- Зачем `React.cache()` если есть memo fetch?
- Как Suspense влияет на параллельность загрузки?
- Почему `await` в `for` — антипаттерн для HTTP?
- Где граница: server parallel vs client Query?

Следующий урок: [18. Error boundaries: `error.tsx`, `notFound()`](18-error-not-found.md).
