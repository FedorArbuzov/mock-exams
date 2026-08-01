# 05. Children, composition, slots

## Intro: a scenario from work

Ticket: "A shared layout for the shop — header, footer, and content that differs across the catalog, cart, and checkout". A junior inherits `BasePage extends React.Component` from an old 2017 tutorial and breaks the types. A senior suggests **composition**: `ShopLayout` takes **children** — an arbitrary tree inside `<main>`. On the catalog page — a filter + a grid of cards; on the cart — a table of line items. One layout, different content **without** class inheritance.

React officially recommends **composition over inheritance** — like "embed by struct" in Go, not a deep hierarchy. In the mock-exams shop this is an `AppShell` around the Router outlet, a `Card` around `ProductCard`, a modal with a form inside.

## What you'll learn

- The special **`children`** prop and its types in TS.
- **Composition** — assembling UI from small components.
- Why **component inheritance** is an anti-pattern in React.
- **Layout components**: shell, panel, card with a slot for content.
- The **"several optional slots"** pattern via props (not just children).
- The connection to the future Router layout ([24-nested-routes.md](24-nested-routes.md)).

## The `children` prop

In JSX, everything **between** the opening and closing tag is `children`:

```tsx
type ShopLayoutProps = {
  children: React.ReactNode;
};

export function ShopLayout({ children }: ShopLayoutProps) {
  return (
    <div className="shop-layout">
      <header>
        <h1>mock-exams Shop</h1>
        <p>API: FastAPI :8090</p>
      </header>
      <main>{children}</main>
      <footer>© mock-exams</footer>
    </div>
  );
}
```

Usage:

```tsx
export function App() {
  return (
    <ShopLayout>
      <section className="catalog">
        <h2>Catalog</h2>
        <p>Coming soon — data from the API.</p>
      </section>
    </ShopLayout>
  );
}
```

The equivalent without nesting — explicit passing (rarely needed):

```tsx
<ShopLayout children={<section>...</section>} />
```

### The `React.ReactNode` type

Accepts almost anything renderable: JSX, string, number, fragment, array, `null`, `undefined`. For **exactly one element**, sometimes `React.ReactElement`; for a render-prop — a function (advanced, [28-custom-hooks.md](28-custom-hooks.md)).

## Composition vs inheritance

**The bad path (inheritance):**

```text
BaseProductPage
  ├── CatalogPage
  └── CartPage   // override renderFooter()? fragile
```

**The React way (composition):**

```tsx
function PageSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function CatalogPage() {
  return (
    <PageSection title="Catalog">
      <FilterBar />
      <ProductGrid />
    </PageSection>
  );
}
```

You **combine** behavior and markup rather than overriding an ancestor's methods. Shared logic goes into **hooks**, not a base class.

## Shop layout components

A typical SPA shell:

```tsx
type AppShellProps = {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
};

export function AppShell({ children, sidebar }: AppShellProps) {
  return (
    <div className="app-shell">
      <nav className="app-shell__nav">Catalog · Cart · Admin</nav>
      <div className="app-shell__body">
        {sidebar && <aside className="app-shell__sidebar">{sidebar}</aside>}
        <div className="app-shell__content">{children}</div>
      </div>
    </div>
  );
}
```

Here there are **two slots**: the main `children` and an optional `sidebar` — category filters without hacks like `children[0]`.

### Card as a wrapper

```tsx
type CardProps = {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Card({ title, children, footer }: CardProps) {
  return (
    <article className="card">
      <header className="card__header">{title}</header>
      <div className="card__body">{children}</div>
      {footer && <footer className="card__footer">{footer}</footer>}
    </article>
  );
}
```

```tsx
<Card
  title="Mechanical Keyboard"
  footer={<button type="button">Add to cart</button>}
>
  <p>€ 79.99</p>
  <p>Cherry MX switches</p>
</Card>
```

The `ProductCard` from [04-props.md](04-props.md) can **use** `Card` inside — layers of composition.

## Several "slots" via props

When a single `children` isn't enough (header actions + body):

```tsx
type PanelProps = {
  heading: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

function Panel({ heading, actions, children }: PanelProps) {
  return (
    <div className="panel">
      <div className="panel__top">
        <div>{heading}</div>
        {actions}
      </div>
      {children}
    </div>
  );
}
```

React Router 6 layout routes follow the same principle: `<Outlet />` as a "slot" for a nested route.

## Children and lists

`children` is **not** automatically an array of props; it's a single prop. Multiple roots inside — React collects them into one `children` (often an implicit fragment isn't needed if there's a single parent in JSX).

For an **explicit** list of same-type elements — map in the parent ([07-lists-keys.md](07-lists-keys.md)), not `React.Children.map` unless necessary.

## Relation to the FastAPI shop

The layout knows nothing about HTTP. The page's parent:

1. Loads items from `:8090` (later).
2. Wraps them in `ShopLayout`.
3. Renders `<ProductGrid products={items} />` in `children`.

Separation: **layout** = chrome; **page** = data + composition.

## Common mistakes

| Mistake | Root cause | Fix |
|--------|------------------|-------------|
| `children` isn't typed (`any`) | Weak TS | `React.ReactNode` |
| Fetch logic in the Layout | Mixing layers | Data in the page, layout is UI only |
| `props.children.props` | Reaching inside children | Explicit slot props |
| One giant children of 500 lines | No decomposition | Split into components |
| Inheriting a "BaseButton" | OOP habit | Composition + a variant prop |
| `{sidebar && sidebar}` when it's `0` | Falsy number | `sidebar != null &&` |

## Summary

**Children** is the content between a component's tags; the primary mechanism of **composition**. **Layout components** define the skeleton of the shop SPA; page content is nested from the outside. **Optional slots** (`sidebar`, `footer`) complement a single `children`. UI-class inheritance is not used — you combine functions and hooks.

## Checklist

- [ ] What ends up in `children`?
- [ ] Explain "composition over inheritance" using the shop layout example
- [ ] When do you need a prop besides `children` (sidebar, actions)?
- [ ] How does `React.ReactNode` differ from `ReactElement`?
- [ ] Where will `<Outlet />` live in the Router layout?

Next lesson: [06. Lab: product card](06-lab-props.md).
