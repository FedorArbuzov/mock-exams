# 04. Props: passing data down

## Intro: a scenario from work

Standup for shop-frontend. The designer sent a Figma: one product card — title, price, a "Sale" badge. A developer copied the JSX three times and manually filled in the strings. The product owner changes the keyboard's price — edits in **three** places, one was forgotten: on staging "Mechanical Keyboard" is €79.99, on prod €89.99. Reviewer: "Make a `ProductCard` and pass **props**." You open React DevTools and see `<ProductCard title="..." price={79.99} />` — data flows **top-down**, like JSON from FastAPI `:8090` into a list component.

Props are the **only** way (until Context) to pass data from a parent to a child. They are **read-only** for the child: you can't mutate `props.price++` — that breaks the one-way flow from [01-landscape.md](01-landscape.md).

## What you'll learn

- What **props** are and how they're passed in JSX.
- **Destructuring** a component's parameters ([destructuring](../javascript-basic/17-destructuring-spread.md)).
- **Default values** for optional props.
- Typing props in **TypeScript**: inline, `type`, `interface`.
- The difference between props and local **state** (preview [09-useState.md](09-useState.md)).
- Common bugs: spreading extra props, `children`, boolean props.

## Props as function arguments

A component is a function; props are the **first argument** (an object):

```tsx
type ProductCardProps = {
  title: string;
  price: number;
  currency?: string;
};

export function ProductCard({ title, price, currency = "€" }: ProductCardProps) {
  return (
    <article className="product-card">
      <h2>{title}</h2>
      <p>
        {currency} {price.toFixed(2)}
      </p>
    </article>
  );
}
```

The parent **creates** the element with attributes — those are the props:

```tsx
export function App() {
  return (
    <main>
      <ProductCard title="Mechanical Keyboard" price={79.99} />
      <ProductCard title="USB-C Hub" price={34.5} currency="$" />
    </main>
  );
}
```

| Syntax | Meaning |
|-----------|----------|
| `title="Keyboard"` | string literal |
| `price={79.99}` | JavaScript expression (number) |
| `items={products}` | array/object from the server |
| `onAdd={() => {}}` | callback function (later [10-events-controlled.md](10-events-controlled.md)) |

**Strings** can go without curly braces; **everything else** goes in `{ }`.

## Destructuring and readability

Without destructuring:

```tsx
function ProductCard(props: ProductCardProps) {
  return <h2>{props.title}</h2>;
}
```

With destructuring — less noise, an explicit contract:

```tsx
function ProductCard({ title, price }: ProductCardProps) {
  return <h2>{title}</h2>;
}
```

Rest for forwarding to the DOM (carefully — only onto native elements):

```tsx
type ButtonProps = {
  variant: "primary" | "secondary";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function ShopButton({ variant, children, ...rest }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} {...rest}>
      {children}
    </button>
  );
}
```

## Default values

Defaults in destructuring (as in [10-functions.md](../javascript-basic/10-functions.md)):

```tsx
function ProductCard({
  title,
  price,
  inStock = true,
}: {
  title: string;
  price: number;
  inStock?: boolean;
}) {
  return (
    <article>
      <h2>{title}</h2>
      {!inStock && <span>Out of stock</span>}
    </article>
  );
}
```

**Important:** a default kicks in on `undefined`, not on `null`. For the shop API, `null` sometimes arrives — normalize it when mapping the `:8090` response.

An optional prop in TypeScript uses `?`:

```tsx
type ProductCardProps = {
  title: string;
  price: number;
  badge?: string;
};
```

## Prop types: type vs interface

Both approaches are valid; in this course we use **`type`** more often for props objects:

```tsx
type Product = {
  id: number;
  title: string;
  price: number;
};

type ProductCardProps = {
  product: Product;
  highlight?: boolean;
};
```

For extending HTML attributes, an **intersection** is convenient:

```tsx
type InputProps = {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;
```

Strict typing catches typos **before** runtime:

```tsx
// TS error: Property 'titel' does not exist
<ProductCard titel="Keyboard" price={10} />
```

More details — [32-typescript-react.md](32-typescript-react.md) and [`typescript-basic`](../typescript-basic/README.md).

## Props vs state

| | Props | State |
|---|-------|-------|
| Who sets it | The parent | The component itself (`useState`) |
| Change | Parent re-render with new props | `setState` |
| Direction | Down | Locally (or lifted up) |

```tsx
// Props: the parent decides what to show
function Catalog({ items }: { items: Product[] }) {
  return items.map((p) => <ProductCard key={p.id} product={p} />);
}

// State later: filter, cart counter
```

Data from `GET /api/v1/items` will land in state or Query; the **card** stays "dumb" — props only.

## Naming and boolean props

The idiom for flags:

```tsx
<ProductCard product={p} highlight />
// equivalent to highlight={true}
```

Avoid `highlight="true"` — that's a **string**, not a boolean.

Mapping for the shop API:

```tsx
const dto = await res.json();
// FastAPI → props-friendly shape
const products: Product[] = dto.map((row: { name: string; unit_price: number; id: number }) => ({
  id: row.id,
  title: row.name,
  price: row.unit_price,
}));
```

## Common mistakes

| Mistake | Root cause | Fix |
|--------|------------------|-------------|
| `price="79.99"` (string) | Forgot `{}` | `price={79.99}` |
| Mutation `props.product.price = 0` | Props are read-only | State in the parent, a new object |
| `{...props}` on a custom component | Forwarding junk | An explicit list of props |
| Optional without `?` in TS | Runtime undefined | `badge?: string` |
| Passing the entire API response into a leaf | Too fat a contract | DTO / pick the needed fields |
| `key={index}` in a list | An anti-pattern on reorder | `key={product.id}` ([07](07-lists-keys.md)) |

## Summary

**Props** are a component's input parameters, set by the parent in JSX. **Destructuring** and **TypeScript** make the contract explicit. **Defaults** are for optional fields. The shop UI is built from small components (`ProductCard`, `Price`, `Badge`) that receive data from above — from a mock array now, from `:8090` in chapter 18.

## Checklist

- [ ] Explain the one-way flow of props
- [ ] When do you need `{curly braces}` in a JSX attribute?
- [ ] How do you set an optional prop and a default?
- [ ] Why can't you mutate props?
- [ ] How does `price={79.99}` differ from `price="79.99"`?
- [ ] Where in the shop architecture will the parent get items?

Next lesson: [05. Children and composition](05-children-composition.md).
