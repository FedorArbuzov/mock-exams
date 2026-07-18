# 12. Lifting state up

## Введение: сценарий с работы

Каталог shop: слева `CategoryFilter`, справа `ProductGrid`. Фильтр меняет `category` в **своём** state — список не меняется. Два `useState` в siblings без общего родителя — классическая архитектурная ошибка. Решение из документации React: **поднять state** к ближайшему общему предку (`CatalogPage`), передать **value + onChange** вниз.

Это тот же принцип, что BFF агрегирует данные для UI: один источник правды, дети **отображают** и **сообщают** о намерениях, не дублируют business state. Для mock-exams filter + list — локально; с API `:8090` query params могут дублировать filter ([26-url-state.md](26-url-state.md)).

## Что вы узнаете

- Когда и **куда** поднимать state.
- Паттерн **controlled child**: props `value` + `onChange`.
- Разделение **container / presentational** (логика vs UI).
- Deriving data: **filtered list** из source + filter state.
- Альтернативы: Context, URL, global store — когда lift недостаточен.
- Связь с однонаправленным потоком [01-landscape.md](01-landscape.md).

## Проблема: siblings без общего state

```tsx
// Плохо: два изолированных state
function CategoryFilter() {
  const [category, setCategory] = useState("all");
  return <select value={category} onChange={(e) => setCategory(e.target.value)}>...</select>;
}

function ProductGrid() {
  const products = MOCK_PRODUCTS; // всегда полный список
  return products.map(...);
}
```

`CategoryFilter` знает category, `ProductGrid` — нет. React **не** телепортирует state между siblings.

## Решение: общий родитель

```tsx
const MOCK_PRODUCTS: Product[] = [ /* ... */ ];

function CatalogPage() {
  const [category, setCategory] = useState<string>("all");

  const visibleProducts =
    category === "all"
      ? MOCK_PRODUCTS
      : MOCK_PRODUCTS.filter((p) => p.category === category);

  return (
    <div className="catalog-page">
      <CategoryFilter value={category} onChange={setCategory} />
      <ProductGrid products={visibleProducts} />
    </div>
  );
}
```

State **один** — в `CatalogPage`. Дети получают props.

### Controlled CategoryFilter

```tsx
type CategoryFilterProps = {
  value: string;
  onChange: (next: string) => void;
};

function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">Все</option>
      <option value="electronics">Electronics</option>
      <option value="home">Home</option>
    </select>
  );
}
```

`ProductGrid` — «глупый»:

```tsx
function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p>Нет товаров в категории</p>;
  }
  return (
    <div className="catalog-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

## Что поднимать, что оставить

| Поднять | Оставить локально |
|---------|-------------------|
| Filter, sort order | hover, focus, open/close accordion |
| Selected item id для master-detail | animation state |
| Cart count (shared header + list) | tooltip visibility |
| Form values, если несколько секций | input caret (controlled value OK локально в leaf) |

**Правило:** если два компонента должны показывать **одни и те же** данные или реагировать на **одно** действие — state выше них.

## Derived state — не дублировать

```tsx
// Плохо: второй state для filtered, sync bugs
const [products, setProducts] = useState(ALL);
const [filtered, setFiltered] = useState(ALL);

// OK: вычислить при render
const filtered = useMemo(
  () => products.filter(matchesCategory(category)),
  [products, category],
);
```

`useMemo` — оптимизация ([27-ref-memo-callback.md](27-ref-memo-callback.md)); для 100 товаров достаточно inline filter.

## Колбэки вниз, события вверх

```text
        category state
              │
    ┌─────────┴─────────┐
    ▼                   ▼
CategoryFilter    ProductGrid
 onChange ───────► setCategory
 products ◄────── filtered (props)
```

Cart из [11-lab-state.md](11-lab-state.md): `cartCount` + `onAddToCart` в `App` — тот же lift.

## Когда lift становится больно

**Prop drilling** — 5 уровней `theme`, `user`:

- **Context** — [29-context.md](29-context.md)
- **URL searchParams** — shareable filter `?category=electronics` — [26-url-state.md](26-url-state.md)
- **TanStack Query** — server state не в useState — [20-tanstack-query.md](20-tanstack-query.md)

Lift остаётся default для **локального UI state** 2–3 siblings.

## Container / presentational

| Container (CatalogPage) | Presentational (ProductGrid) |
|-------------------------|----------------------------|
| useState, handlers | только props |
| filter logic | JSX |
| знает про MOCK/API | не знает откуда products |

Не догма, но помогает тестам и reuse.

## FastAPI shop preview

```tsx
function CatalogPage() {
  const [category, setCategory] = useState("all");
  const { data: products = [], isLoading } = useItemsQuery(); // глава 20

  const visible = useMemo(
    () => filterByCategory(products, category),
    [products, category],
  );

  if (isLoading) return <p>Loading…</p>;

  return (
    <>
      <CategoryFilter value={category} onChange={setCategory} />
      <ProductGrid products={visible} />
    </>
  );
}
```

Server list — Query; filter — lifted client state (или URL).

## Типичные ошибки

| Ошибка | Корневая причина | Исправление |
|--------|------------------|-------------|
| Siblings out of sync | State в child | Lift to parent |
| Copy props to state | `useState(props.x)` без нужды | Use props directly or reset on key |
| Lift слишком высоко | Весь state в App | Colocate ближе к использованию |
| Дублированный filtered array | setState на каждый keystroke + store | Derive on render |
| Child mutates shared array | push в props | Parent setState immutable |
| Забыли передать onChange | Read-only filter UI | Controlled pair |

## Резюме

**Lifting state up** — перенос state к **общему родителю**, props **value/onChange** вниз, **derived lists** без второго источника правды. Shop catalog filter, cart, master-detail — базовый паттерн до Context и URL state.

## Чек-лист

- [ ] Как найти «общего предка» для двух siblings?
- [ ] Чем controlled child отличается от локального state?
- [ ] Зачем не хранить `filteredProducts` в отдельном useState?
- [ ] Когда lift, когда Context?
- [ ] Как связаны cart в App и lifting?

Следующий урок: [13. Лаба: фильтр каталога](13-lab-lifting-state.md).
