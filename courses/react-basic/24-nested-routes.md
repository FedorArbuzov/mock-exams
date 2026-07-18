# 24. Nested routes, layout и params

## Сценарий с работы

Shop SPA: общий **header** (логотип, nav, корзина) на каталоге и карточке товара, но не на странице 404. Junior копирует `<ShopHeader />` в каждый page — при смене ссылки забывают одну страницу. Деталь товара `/items/42` должна читать **id из URL**, не из `useState` после клика — иначе ссылка «поделиться» не работает.

**Nested routes** + **`Outlet`** — layout один раз, дочерние маршруты внутри. **`useParams`** — параметры из path.

## Что вы узнаете

- Layout routes с `Outlet`
- Вложенные `Route` без дублирования path
- `useParams`, валидация id
- Index routes
- Loaders (обзор v7) — без углубления

---

## Layout route

```tsx
// components/ShopLayout.tsx
import { Outlet, Link } from "react-router-dom";

export function ShopLayout() {
  return (
    <div className="shop">
      <header>
        <Link to="/">Shop</Link>
        <nav>
          <Link to="/">Каталог</Link>
          <Link to="/about">О нас</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>© mock-exams shop</footer>
    </div>
  );
}
```

`<Outlet />` — место, куда Router вставит **дочерний** route.

---

## Объявление nested routes

```tsx
<Routes>
  <Route element={<ShopLayout />}>
    <Route index element={<CatalogPage />} />
    <Route path="items/:itemId" element={<ItemDetailPage />} />
    <Route path="about" element={<AboutPage />} />
  </Route>
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

| URL | Что в Outlet |
|-----|--------------|
| `/` | `CatalogPage` (index) |
| `/items/42` | `ItemDetailPage` |
| `/about` | `AboutPage` |

Parent **без** `path` — только layout wrapper. Дочерние path **относительные** (`items/:itemId`, не `/items/...` — оба стиля возможны; здесь relative к parent без path → `/items/:itemId`).

Явный parent path:

```tsx
<Route path="/" element={<ShopLayout />}>
  <Route index element={<CatalogPage />} />
  ...
</Route>
```

---

## Index route

`index` — default child при точном совпадении parent URL (`/`). Не путать с redirect:

```tsx
<Route index element={<Navigate to="catalog" replace />} /> // другой паттерн
```

---

## `useParams`

```tsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Item } from "@/api/types";

export function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const id = Number(itemId);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["items", id],
    queryFn: ({ signal }) => api<Item>(`/api/v1/items/${id}`, { signal }),
    enabled: Number.isFinite(id) && id > 0,
  });

  if (!Number.isFinite(id) || id <= 0) {
    return <p>Неверный id товара.</p>;
  }

  if (isPending) return <p>Загрузка…</p>;
  if (isError) return <p role="alert">{error.message}</p>;
  if (!data) return <p>Товар не найден.</p>;

  return (
    <article>
      <Link to="/">← Каталог</Link>
      <h1>{data.name}</h1>
      <p>{data.price.toFixed(2)} €</p>
      {data.description && <p>{data.description}</p>}
    </article>
  );
}
```

FastAPI 404 → `api()` throw → `isError`. Invalid id в URL — клиентская проверка до fetch.

---

## Ссылка из каталога

```tsx
import { Link } from "react-router-dom";

<Link to={`/items/${item.id}`}>{item.name}</Link>
```

URL — **источник истины** для detail screen; Query кэширует по `["items", id]`.

---

## Несколько params

```tsx
<Route path="shops/:shopId/items/:itemId" element={...} />

const { shopId, itemId } = useParams();
```

queryKey: `["shops", shopId, "items", itemId]`.

---

## Optional segments (обзор)

```tsx
<Route path="items/:itemId?" ... />
```

Редко; чаще отдельные routes или search params ([26-url-state.md](26-url-state.md)).

---

## Loaders (React Router v7, обзор)

RR v7 поддерживает **loader** на route для data before render (как Remix). В этом курсе основной data layer — **TanStack Query**; loaders — альтернатива для SSR/единого router-data. Не смешивайте два источника без правил.

```tsx
// обзор — не обязательно в лабах basic
<Route
  path="items/:itemId"
  loader={({ params }) => fetchItem(params.itemId)}
  element={<ItemDetailPage />}
/>
```

Capstone может выбрать Query-only — достаточно для SPA к `:8090`.

---

## 404 внутри и снаружи layout

```tsx
<Route element={<ShopLayout />}>
  {/* shop pages */}
  <Route path="*" element={<NotFoundPage />} />
</Route>
```

Или глобальный `*` **без** header — как в [25-lab-router.md](25-lab-router.md).

---

## Типичные ошибки

1. **Забыли `<Outlet />`** — layout без контента.

2. **Absolute path в child** — `path="/items"` может сломать nesting; следите за docs RR v7.

3. **id из location.state вместо params** — refresh теряет state.

4. **useParams без enabled в Query** — fetch с `NaN`.

5. **Дубли layout** — header не в layout route.

6. **Один queryKey для list и detail** — разные ключи `["items"]` vs `["items", id]`.

---

## Резюме

Layout route рендерит общую оболочку shop и `<Outlet />` для дочерних страниц. Index route — каталог на `/`. `useParams` извлекает `itemId` для `GET /api/v1/items/:id`. Валидация id на клиенте; 404 — с API. Nested routes убирают copy-paste header/footer. Data — TanStack Query, не дублировать в router loader без необходимости.

---

## Чек-лист

- Где рендерится `<Outlet />`?
- Чем index route отличается от path=""?
- Как типизировать `useParams` в TS?
- Зачем `enabled` в useQuery для detail?
- Что сломается при передаче id только через state?
- Как nested route влияет на URL `/items/5`?

Следующий урок: [25. Лаба: каталог / товар / 404](25-lab-router.md).
