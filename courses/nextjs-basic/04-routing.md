# 04. File-based routing: сегменты, вложенность, index routes

## Введение: сценарий с работы

Sprint planning. Product: «Нужны `/catalog`, `/catalog/electronics`, `/catalog/electronics/phones` — и **общий** sidebar каталога на всех трёх уровнях». В react-basic вы бы писали вложенные `<Route path="catalog/*">` и `<Outlet />`. В Next маршрут **уже нарисован** папками: `app/catalog/page.tsx`, `app/catalog/electronics/page.tsx`.

Junior создал `app/catalog/electronics.tsx` — Next **игнорирует** файл: нужна **папка** `electronics/` с `page.tsx`. Ещё один создал `app/(shop)/catalog/` — URL остался `/catalog`, а не `/(shop)/catalog`: **route groups** скобками **не** попадают в URL. Эта глава — правила игры file-based routing без сюрпризов на code review.

После [03-lab-first-app.md](03-lab-first-app.md) у вас есть `/catalog`. Сейчас научимся **вкладывать** сегменты, понимать **index** routes и **группировать** маршруты для разных layouts без изменения URL.

## Что вы узнаете

- Как **вложенные папки** формируют path.
- **Index route** — `page.tsx` на каждом уровне вложенности.
- **Route groups** `(name)` — организация без prefix в URL.
- Когда segment **не** участвует в URL (`page` vs `layout`-only).
- Сравнение с React Router nested routes из react-basic.
- Подготовка к dynamic `[id]` ([05-dynamic-routes.md](05-dynamic-routes.md)).

## Базовое правило: папка = segment URL

```text
app/catalog/page.tsx                    →  /catalog
app/catalog/electronics/page.tsx        →  /catalog/electronics
app/catalog/electronics/phones/page.tsx →  /catalog/electronics/phones
```

Каждый **листовой** `page.tsx` — отдельный URL. Промежуточные папки **без** `page.tsx` — только namespace (layout может быть — глава 06).

```text
app/
└── catalog/
    ├── layout.tsx          ← обёртка для всего /catalog/*
    ├── page.tsx            ← /catalog  (index catalog)
    └── electronics/
        └── page.tsx        ← /catalog/electronics
```

## Index routes

**Index route** — `page.tsx` в папке segment'а, «корень» этого segment:

| Путь файла | URL | Роль |
|------------|-----|------|
| `app/page.tsx` | `/` | index всего приложения |
| `app/catalog/page.tsx` | `/catalog` | index каталога |
| `app/catalog/[id]/page.tsx` | `/catalog/42` | не index — dynamic |

Аналог React Router:

```tsx
<Route path="catalog">
  <Route index element={<CatalogHome />} />
  <Route path="electronics" element={<Electronics />} />
</Route>
```

```text
app/catalog/page.tsx              ≈ index
app/catalog/electronics/page.tsx  ≈ path="electronics"
```

## Nested layouts (preview)

`app/catalog/layout.tsx`:

```tsx
export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="catalog-shell">
      <aside>Фильтры (placeholder)</aside>
      <div>{children}</div>
    </div>
  );
}
```

Дерево для `/catalog/electronics`:

```text
RootLayout
  └── CatalogLayout
        └── ElectronicsPage
```

Layout **сохраняется** при client navigation между sibling routes под `/catalog/*` — state sidebar не сбрасывается ([06-layouts-templates.md](06-layouts-templates.md)).

## Route groups: `(groupName)`

Скобки **исключают** имя из URL — только организация:

```text
app/
├── (marketing)/
│   ├── layout.tsx       ← другой layout для landing
│   ├── page.tsx         →  /  (конфликт! только один root page)
│   └── about/
│       └── page.tsx     →  /about
└── (shop)/
    ├── catalog/
    │   └── page.tsx     →  /catalog
    └── cart/
        └── page.tsx     →  /cart
```

**Зачем на работе:**

- разные **layouts** для marketing vs shop без `/shop/catalog`;
- команды кладут код в `(team-a)/` vs `(team-b)/`;
- несколько root layouts **нельзя** без route groups на одном уровне — только один `app/page.tsx` для `/`.

```text
URL:  /catalog
FS:   app/(shop)/catalog/page.tsx
      ─────┬────
      не в URL
```

## Colocation и private folders

| Паттерн | В URL? |
|---------|--------|
| `app/catalog/page.tsx` | да |
| `app/catalog/_components/Card.tsx` | нет |
| `app/_lib/formatPrice.ts` | нет |

Импорт из `_components` в `page.tsx` — обычный TypeScript import.

## Special files — краткая таблица

| Файл | Влияние на routing |
|------|-------------------|
| `page.tsx` | делает route **публичным** |
| `layout.tsx` | не добавляет segment |
| `route.ts` | API endpoint, не page |
| `default.tsx` | parallel routes (глава 06, обзор) |
| `template.tsx` | как layout, но remount (глава 06) |

## Сравнение с react-basic React Router

| React Router | App Router |
|--------------|------------|
| `<Routes>` + `<Route path>` | дерево `app/` |
| `path="catalog/:id"` | `app/catalog/[id]/page.tsx` |
| `<Outlet />` | `{children}` в `layout.tsx` |
| `Navigate to=` | `redirect()` / middleware |
| config в одном файле | colocation по FS |

Плюс Next: **меньше** расхождения «config vs файлы»; минус: **переименование URL = переименование папок**.

## Маршруты mock-exams shop (roadmap курса)

```text
/                     app/page.tsx
/catalog              app/catalog/page.tsx
/catalog/[id]         app/catalog/[id]/page.tsx      ← лаба 07
/contact              app/contact/page.tsx
/api/...              app/api/.../route.ts           ← глава 19
```

FastAPI `:8090` остаётся `/api/v1/...` — Next не дублирует path API, только UI routes.

## Резолving: что видит Next при GET /catalog/electronics

```text
1. Match segments: catalog, electronics
2. Load layouts: root → catalog (if exists)
3. Load page: app/catalog/electronics/page.tsx
4. Render RSC tree → HTML
```

Ошибка 404 — нет `page.tsx` на любом resolved leaf.

## Типичные ошибки

**Файл вместо папки:** `catalog.tsx` — **не** route. Нужно `catalog/page.tsx`.

**Два `page.tsx` на один URL:** duplicate routes — build error.

**Думать, что `(shop)` виден в URL.** Скобки только для FS и layouts.

**Забыть `page.tsx` на parent:** `/catalog` 404, хотя `/catalog/item` есть — нужен index `catalog/page.tsx`.

**Route group с двумя `app/page.tsx` на root** без careful split — конфликт. Один `/` на приложение.

**Копировать react-router `*` catch-all mentally** — в Next другой синтаксис: `[...slug]` ([05-dynamic-routes.md](05-dynamic-routes.md)).

## Чек-лист

- [ ] Строите URL из дерева папок без подсказок
- [ ] Объясняете route group `(name)` — не в path
- [ ] Знаете, что `page.tsx` = index segment
- [ ] Можете сопоставить nested Route и `app/a/b/page.tsx`
- [ ] Готовы к dynamic `[id]` в следующей главе

Следующий урок: [05. Dynamic routes: `[id]`, catch-all, optional](05-dynamic-routes.md).
