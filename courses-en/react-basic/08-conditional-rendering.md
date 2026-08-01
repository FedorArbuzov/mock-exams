# 08. Conditional Rendering

## Intro: a scenario from work

The shop's product page: while the `fetch` to `:8090` is in flight, the screen is blank; on a 404, you get "undefined is not an object"; and when `stock: 0`, the "In stock" badge is still green. QA files three bugs. You look at `ProductDetail.tsx` — there's `product && product.name` in one spot, a ternary in another, and an `if` placed after hooks (a lint error). What you need is a **system**: loading, error, empty, happy path — without duplication, and without `count && <Badge>` putting a stray `0` on screen.

Conditional rendering works like `if` in [16-control-flow.md](../javascript-basic/16-control-flow.md), except it happens **inside a JSX expression** or **before the return** in a component.

## What you'll learn

- **`&&`** (logical AND) for "show this if truthy."
- The **ternary operator** `? :` for two branches.
- **Early return** for guard clauses and loading/error states.
- **`let content`** variables / IIFEs (rarely) for complex branching.
- Pitfalls: **`0`**, empty strings, `null` vs `undefined`.
- UI state patterns for the shop ([31-ui-states.md](31-ui-states.md)).

## Ternary operator in JSX

Two **UI branches** — the classic case:

```tsx
function StockBadge({ inStock }: { inStock: boolean }) {
  return (
    <span className={inStock ? "badge badge--ok" : "badge badge--out"}>
      {inStock ? "In stock" : "Out of stock"}
    </span>
  );
}
```

Don't nest deeper than 2–3 levels — otherwise extract a `StockBadge` subcomponent.

```tsx
function PriceBlock({ price, onSale }: { price: number; onSale: boolean }) {
  return (
    <p>
      {onSale ? (
        <>
          <s>€ {(price * 1.2).toFixed(2)}</s> € {price.toFixed(2)}
        </>
      ) : (
        <>€ {price.toFixed(2)}</>
      )}
    </p>
  );
}
```

## Logical AND (`&&`)

"Show this **only if** the condition is truthy":

```tsx
function ProductCard({ product }: { product: Product }) {
  return (
    <article>
      <h2>{product.title}</h2>
      {product.badge && <span className="badge">{product.badge}</span>}
      {product.price < 20 && <p className="hint">Free shipping over €50</p>}
    </article>
  );
}
```

**The `0` pitfall:**

```tsx
{cartCount && <span>In cart: {cartCount}</span>}
// cartCount === 0 → the digit 0 shows on screen, not hidden!

{cartCount > 0 && <span>In cart: {cartCount}</span>}
// OK
```

| Expression | `&&` result |
|-----------|----------------|
| `true && <X />` | `<X />` |
| `false && <X />` | `false` (nothing renders) |
| `0 && <X />` | **renders `0`!** |
| `null && <X />` | `null` |
| `"" && <X />` | `""` |

For booleans, use an explicit comparison or `!!`.

## Early return (guard clauses)

A readable pattern for **pages** with async data:

```tsx
type CatalogProps = {
  status: "loading" | "error" | "ready";
  products: Product[];
  errorMessage?: string;
};

function Catalog({ status, products, errorMessage }: CatalogProps) {
  if (status === "loading") {
    return <p className="state">Loading catalog…</p>;
  }

  if (status === "error") {
    return (
      <p className="state state--error">
        API error: {errorMessage ?? "Check FastAPI :8090"}
      </p>
    );
  }

  if (products.length === 0) {
    return <p className="state">Catalog is empty</p>;
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

**Hooks rule:** early returns must come **after** every top-level `useState`/`useEffect` call — you can't put `if (loading) return` **before** the hooks run ([14-useEffect.md](14-useEffect.md)). For page-level loading, it's common to split components: `CatalogPage` (holds the hooks) → a presentational `Catalog` (holds the guards).

## if outside JSX

Compute a variable before the `return`:

```tsx
function CartButton({ count }: { count: number }) {
  let label: string;
  if (count === 0) {
    label = "Cart is empty";
  } else if (count === 1) {
    label = "1 item";
  } else {
    label = `${count} items`;
  }

  return <button type="button">{label}</button>;
}
```

Or use `switch` for an enum status coming from the API.

## null and undefined

React **renders nothing** for `null`, `undefined`, and `false`:

```tsx
{maybeBadge ? <span>{maybeBadge}</span> : null}
// often shorter as:
{maybeBadge && <span>{maybeBadge}</span>}
```

Optional chaining with API data:

```tsx
{product.discount?.percent != null && (
  <span>-{product.discount.percent}%</span>
)}
```

See [19-optional-nullish.md](../javascript-basic/19-optional-nullish.md).

## Role-based UI (preview)

```tsx
function AdminLink({ role }: { role: "guest" | "admin" }) {
  return (
    <nav>
      <a href="/catalog">Catalog</a>
      {role === "admin" && <a href="/admin">Admin</a>}
    </nav>
  );
}
```

Auth flow — covered in [react-intermediate](../react-intermediate/README.md).

## Common mistakes

| Mistake | Root cause | Fix |
|--------|------------------|-------------|
| `0` shows on screen | `count && <UI>` | `count > 0 &&` |
| A 5-level-deep ternary | Unreadable | Subcomponents / early return |
| `product.name` accessed before checking | null product | Guard or optional chaining |
| Hooks after a conditional return | Rules of Hooks | Hooks at the top, UI guards below, or split the component |
| `condition ? <A />` with no `: null` | Sometimes fine | Make the `: null` explicit for clarity |
| Different layout for loading/error | Copy-paste | One shared `StateMessage` component |

## Summary

In JSX: **`&&`** for optional blocks (watch out for `0`), the **ternary** for two-way branches, **early return** for loading/error/empty. Push complex logic into variables or child components. Every shop UI screen backed by `:8090` data needs to handle all these states explicitly.

## Checklist

- [ ] When is `&&` riskier than a ternary?
- [ ] Why can `{items.length && ...}` display a `0`?
- [ ] Where should early returns sit relative to hooks?
- [ ] Name three catalog states besides "has products."
- [ ] How do you render an optional badge without extra DOM?

Next lesson: [09. useState: local state](09-useState.md).
