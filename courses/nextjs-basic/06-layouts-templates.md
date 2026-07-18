# 06. Layouts, templates, loading UI, parallel routes (обзор)

## Введение: сценарий с работы

Demo для stakeholders. При клике «Каталог» → «Товар #1» → «Товар #2» **sidebar с фильтрами мигает** и сбрасывает scroll — потому что каждая страница перерисовывала весь layout вручную. После `app/catalog/layout.tsx` sidebar **остаётся**, меняется только `{children}`.

Product: «При переходе показывай skeleton 200 ms, не белый экран». Добавили `loading.tsx` — Next автоматически оборачивает segment в **Suspense**. Analytics: «Счётчик просмотров в header сбрасывается при каждой навигации» — возможно, нужен **template**, не layout: template **remount** на каждый переход.

Parallel routes (`@modal`, `@sidebar`) — advanced; на basic достаточно **обзора**, чтобы не пугаться `@` в чужом PR.

## Что вы узнаете

- **Layout vs template** — persist state vs remount.
- Вложенные **layouts** для `/catalog/*`.
- **`loading.tsx`** — instant loading UI и Suspense boundary.
- **`error.tsx`** (preview) — изоляция ошибок segment.
- **Parallel routes** — зачем `@folder`, без глубокой реализации.
- Связь с streaming ([13-suspense-streaming.md](13-suspense-streaming.md)).

## Layout: UI, который переживает navigation

```tsx
// app/catalog/layout.tsx
export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="catalog-layout">
      <aside aria-label="Фильтры">
        <p>Категории (placeholder)</p>
      </aside>
      <section>{children}</section>
    </div>
  );
}
```

При переходе `/catalog` → `/catalog/42`:

- **CatalogLayout не remount** — React state в sidebar сохраняется.
- Меняется только `children` (active page).

```text
RootLayout (persist)
  └── CatalogLayout (persist)
        └── ProductPage → другой ProductPage
```

Root layout **никогда** не должен remount при internal navigation — только `{children}` swap.

## Template: remount на каждый переход

```tsx
// app/catalog/template.tsx
export default function CatalogTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="catalog-template">{children}</div>;
}
```

Если есть **и** layout, **и** template:

```text
Layout (persist)
  └── Template (remount on navigation)
        └── Page
```

| | layout.tsx | template.tsx |
|---|------------|--------------|
| State при navigation | сохраняется | **сбрасывается** |
| useEffect on mount | не каждый route | **каждый** route |
| Когда использовать | shell, nav, sidebar | enter animation, analytics ping |

На shop чаще **только layout**. Template — анимации page transition или «fresh» analytics.

## loading.tsx — skeleton без ручного Suspense

```tsx
// app/catalog/loading.tsx
export default function CatalogLoading() {
  return (
    <div aria-busy="true" className="card">
      <p className="muted">Загрузка каталога…</p>
      <div style={{ height: 8, background: "#eee", marginTop: 8 }} />
      <div style={{ height: 8, background: "#eee", marginTop: 8, width: "80%" }} />
    </div>
  );
}
```

Next автоматически:

1. Оборачивает `page.tsx` в **Suspense**.
2. Показывает `loading.tsx` пока page (async fetch) не resolved.
3. **Streaming** HTML — пользователь видит shell раньше ([13-suspense-streaming.md](13-suspense-streaming.md)).

```text
Request /catalog
  → RootLayout HTML сразу
  → CatalogLayout + loading.tsx
  → stream → CatalogPage с данными
```

`loading.tsx` работает на **уровне segment**, где лежит файл.

## error.tsx (preview)

```tsx
"use client"; // error boundaries — client

export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Ошибка каталога</h2>
      <button type="button" onClick={() => reset()}>
        Повторить
      </button>
    </div>
  );
}
```

Изолирует ошибку **внутри segment** — header из root layout остаётся. Подробно — [18-error-not-found.md](18-error-not-found.md).

## Nested layout example для shop

```text
app/
├── layout.tsx              ← site header
└── catalog/
    ├── layout.tsx          ← sidebar каталога
    ├── loading.tsx
    ├── page.tsx            ← /catalog
    └── [id]/
        ├── loading.tsx     ← skeleton карточки товара
        └── page.tsx
```

Два уровня loading: список vs деталь — UX лучше, чем один global spinner.

## Parallel routes — обзор

Синтаксис `@slot`:

```text
app/
├── layout.tsx
├── @modal/
│   └── default.tsx
├── @sidebar/
│   └── default.tsx
└── catalog/
    └── page.tsx
```

```tsx
export default function RootLayout({
  children,
  modal,
  sidebar,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <>
      {sidebar}
      {children}
      {modal}
    </>
  );
}
```

**Зачем:** независимые **slots** (modal поверх page, dashboard panels), разная loading/error per slot. mock-exams capstone может использовать `@cart` drawer — на basic **знайте термин**.

`default.tsx` — fallback когда slot не active.

## Layouts vs react-basic Outlet

| react-basic | App Router |
|-------------|------------|
| `<Outlet />` | `{children}` in layout |
| `<Route element={<Layout>}>` | `layout.tsx` в папке |
| manual `<Suspense>` | `loading.tsx` convention |

## Performance note

Layouts **не re-fetch** автоматически при child navigation — только page segment. Данные для sidebar фильтров — в layout fetch **осторожно** (кэш, dedupe — глава 16).

## Типичные ошибки

**Дублировать header во вложенном layout.** Header — root; catalog layout — только catalog chrome.

**Ждать remount для сброса формы — использовать layout.** Нужен **template** или key на page.

**Забыть `"use client"` в error.tsx.** Error boundaries — client component.

**loading.tsx без async page.** Loading не покажется — page sync, fetch мгновенный; для demo добавьте `await delay` или real fetch.

**Parallel routes без `default.tsx`.** 404 в slot при hard refresh — нужен default.

**Путать loading.tsx и skeleton внутри page.** Convention loading — **segment-level**; inline skeleton — fine-grained Suspense внутри page ([13-suspense-streaming.md](13-suspense-streaming.md)).

## Чек-лист

- [ ] Объясняете layout persist vs template remount
- [ ] Добавляете `loading.tsx` для segment с async fetch
- [ ] Понимаете nested layouts для `/catalog/*`
- [ ] Знаете, что parallel routes — `@slot` + `default.tsx`
- [ ] Можете нарисовать дерево layout для shop catalog

Следующий урок: [07. Лаба: каталог и страница товара](07-lab-routing.md).
