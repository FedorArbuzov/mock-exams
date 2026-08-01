# 12. Lifting state up

## Intro: a scenario from work

The shop catalog: `CategoryFilter` on the left, `ProductGrid` on the right. The filter changes `category` in **its own** state — the list doesn't change. Two `useState`s in siblings without a common parent — the classic architectural mistake. The solution from the React docs: **lift the state** up to the nearest common ancestor (`CatalogPage`), pass **value + onChange** down.

It's the same principle as a BFF aggregating data for the UI: one source of truth, the children **display** and **report** intentions, they don't duplicate business state. For mock-exams filter + list — local; with the `:8090` API, query params may duplicate the filter ([26-url-state.md](26-url-state.md)).

## What you'll learn

- When and **where** to lift state.
- The **controlled child** pattern: `value` + `onChange` props.
- Separating **container / presentational** (logic vs UI).
- Deriving data: a **filtered list** from a source + filter state.
- Alternatives: Context, URL, global store — when lifting isn't enough.
- The connection to the one-way flow [01-landscape.md](01-landscape.md).

## The problem: siblings without shared state

```tsx
// Bad: two isolated states
function CategoryFilter() {
  const [category, setCategory] = useState("all");
  return <select value={category} onChange={(e) => setCategory(e.target.value)}>...</select>;
}

function ProductGrid() {
  const products = MOCK_PRODUCTS; // always the full list
  return products.map(...);
}
```

`CategoryFilter` knows the category, `ProductGrid` doesn't. React does **not** teleport state between siblings.

## The solution: a common parent

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

There's **one** state — in `CatalogPage`. The children receive props.

### Controlled CategoryFilter

```tsx
type CategoryFilterProps = {
  value: string;
  onChange: (next: string) => void;
};

function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">All</option>
      <option value="electronics">Electronics</option>
      <option value="home">Home</option>
    </select>
  );
}
```

`ProductGrid` is "dumb":

```tsx
function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p>No products in this category</p>;
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

## What to lift, what to keep

| Lift | Keep local |
|---------|-------------------|
| Filter, sort order | hover, focus, accordion open/close |
| Selected item id for master-detail | animation state |
| Cart count (shared header + list) | tooltip visibility |
| Form values, if there are several sections | input caret (controlled value is OK locally in a leaf) |

**Rule:** if two components must show the **same** data or react to a **single** action — the state lives above them.

## Derived state — don't duplicate

```tsx
// Bad: a second state for filtered, sync bugs
const [products, setProducts] = useState(ALL);
const [filtered, setFiltered] = useState(ALL);

// OK: compute on render
const filtered = useMemo(
  () => products.filter(matchesCategory(category)),
  [products, category],
);
```

`useMemo` — an optimization ([27-ref-memo-callback.md](27-ref-memo-callback.md)); for 100 products an inline filter is enough.

## Callbacks down, events up

```text
        category state
              │
    ┌─────────┴─────────┐
    ▼                   ▼
CategoryFilter    ProductGrid
 onChange ───────► setCategory
 products ◄────── filtered (props)
```

The cart from [11-lab-state.md](11-lab-state.md): `cartCount` + `onAddToCart` in `App` — the same lift.

## When lifting starts to hurt

**Prop drilling** — 5 levels of `theme`, `user`:

- **Context** — [29-context.md](29-context.md)
- **URL searchParams** — a shareable filter `?category=electronics` — [26-url-state.md](26-url-state.md)
- **TanStack Query** — server state not in useState — [20-tanstack-query.md](20-tanstack-query.md)

Lifting remains the default for **local UI state** of 2–3 siblings.

## Container / presentational

| Container (CatalogPage) | Presentational (ProductGrid) |
|-------------------------|----------------------------|
| useState, handlers | props only |
| filter logic | JSX |
| knows about MOCK/API | doesn't know where products come from |

Not dogma, but it helps tests and reuse.

## FastAPI shop preview

```tsx
function CatalogPage() {
  const [category, setCategory] = useState("all");
  const { data: products = [], isLoading } = useItemsQuery(); // chapter 20

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

The server list — Query; the filter — lifted client state (or URL).

## Common mistakes

| Mistake | Root cause | Fix |
|--------|------------------|-------------|
| Siblings out of sync | State in a child | Lift to parent |
| Copy props to state | `useState(props.x)` unnecessarily | Use props directly or reset on key |
| Lifting too high | All state in App | Colocate closer to usage |
| Duplicated filtered array | setState on every keystroke + store | Derive on render |
| Child mutates a shared array | push into props | Parent setState immutable |
| Forgot to pass onChange | Read-only filter UI | Controlled pair |

## Summary

**Lifting state up** — moving state to a **common parent**, passing **value/onChange** props down, **derived lists** without a second source of truth. Shop catalog filter, cart, master-detail — the base pattern until Context and URL state.

## Checklist

- [ ] How do you find the "common ancestor" for two siblings?
- [ ] How does a controlled child differ from local state?
- [ ] Why not store `filteredProducts` in a separate useState?
- [ ] When to lift, when to use Context?
- [ ] How are the cart in App and lifting related?

Next lesson: [13. Lab: catalog filter](13-lab-lifting-state.md).
