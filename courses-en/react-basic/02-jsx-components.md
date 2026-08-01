# 02. JSX and Functional Components

## Intro: a scenario from work

Code review of shop-frontend, Friday. A colleague sent a PR with "markup" in `App.tsx`: HTML comments `<!-- header -->`, a `class="card"` attribute, a closing `<img>` tag without a slash. CI fails on `vite build`: `Expected corresponding JSX closing tag`. In the browser, dev mode worked "by accident" because Babel sometimes forgives small things, while TypeScript does not. Tech lead: "JSX is not HTML and not a string. It's syntactic sugar over `React.createElement`." You open [01-landscape.md](01-landscape.md) and understand *why* components exist, but **how** to write them in practice is covered in this chapter.

After [`javascript-basic`](../javascript-basic/10-functions.md), functions are familiar to you. A **React component** is a function that returns a **description of the UI** (JSX). Vite compiles `.tsx` into JS; the browser receives ordinary React calls. The mock-exams domain is a **shop**: product cards, a cart, a catalog with `:8090` later; for now, the syntax foundation.

## What you'll learn

- What **JSX** is and how it differs from an HTML string.
- JSX rules: a single root element, `className`, self-closing tags, curly braces for expressions.
- **Functional components**: naming, return, arrows vs `function`.
- **`export` / `import`** between files — related to [ES modules](../javascript-basic/30-es-modules.md).
- How JSX fits into the **edit → HMR → browser** cycle from [00-environment.md](00-environment.md).

## JSX: JavaScript + XML

JSX looks like HTML inside JavaScript/TypeScript:

```tsx
const title = "Mechanical Keyboard";

const element = <h1 className="product-title">{title}</h1>;
```

Under the hood (simplified), Vite turns this into:

```tsx
const element = React.createElement(
  "h1",
  { className: "product-title" },
  title,
);
```

**Why not a template string?** JSX gives you:

1. **Structure** — nesting is visible as a tree, not string concatenation.
2. **Safety** — React escapes text by default (protection against XSS when rendering user data).
3. **Tooling** — TypeScript checks props, ESLint catches `key`, DevTools shows components.

JSX does **not** run in the browser "as is" — only after transformation by the bundler.

## JSX rules (differences from HTML)

| HTML | JSX in React |
|------|-------------|
| `class="btn"` | `className="btn"` (`class` is reserved in JS) |
| `for="email"` | `htmlFor="email"` |
| `<br>` | `<br />` — self-closing tags |
| `<!-- comment -->` | `{/* comment */}` |
| `onclick="..."` | `onClick={handler}` — camelCase, a function, not a string |
| inline `style="color:red"` | `style={{ color: "red" }}` — an object |

### A single root element

A component must return **one** root node (or a Fragment — [07-lists-keys.md](07-lists-keys.md)):

```tsx
// Error: two siblings at the top level
function BadHeader() {
  return (
    <header>Shop</header>
    <nav>Catalog</nav>
  );
}

// OK: a wrapper
function GoodHeader() {
  return (
    <header>
      <h1>Shop</h1>
      <nav>Catalog</nav>
    </header>
  );
}
```

### Expressions in `{curly braces}`

Inside JSX you can insert **any JavaScript expression**, not a statement:

```tsx
function PriceTag({ price, currency }: { price: number; currency: string }) {
  const formatted = price.toFixed(2);
  const inStock = price > 0;

  return (
    <p>
      {currency} {formatted}
      {inStock ? " — in stock" : " — out of stock"}
    </p>
  );
}
```

You **cannot** insert `if`, `for`, or `const` directly — only the result of an expression. Conditions use a ternary, `&&`, or a computation before `return` ([08-conditional-rendering.md](08-conditional-rendering.md)).

```tsx
// Not allowed:
// return <div>{ if (x) { "yes" } }</div>

// Allowed:
return <div>{x ? "yes" : "no"}</div>;
```

## Functional components

A component is a **function with a capital letter** that returns JSX (or `null`):

```tsx
function ShopGreeting() {
  return (
    <main className="app">
      <h1>Shop — react-basic</h1>
      <p>We'll connect the catalog to FastAPI :8090 later.</p>
    </main>
  );
}
```

The arrow variant is idiomatic for small presentational components:

```tsx
export const Badge = ({ label }: { label: string }) => (
  <span className="badge">{label}</span>
);
```

| Rule | Why |
|---------|-------|
| Name with a **capital** letter | `<shop />` is a DOM tag; `<Shop />` is a component |
| **Pure-ish** render | Same props → same UI (state comes later) |
| No side effects in the body | Requests and subscriptions go in `useEffect` ([14-useEffect.md](14-useEffect.md)) |

Props (a component's arguments) are covered in [04-props.md](04-props.md); for now, literals and local variables.

## Structure of a component file

Recommended template for shop UI:

```tsx
// src/components/ShopFooter.tsx

type ShopFooterProps = {
  year?: number;
};

export function ShopFooter({ year = new Date().getFullYear() }: ShopFooterProps) {
  return (
    <footer className="shop-footer">
      <p>© {year} mock-exams shop</p>
    </footer>
  );
}
```

- **One component — one file** (or a related group).
- **Named export** `export function` — easier refactoring and autoimport in the IDE.
- The props type is inline or a `type`/`interface` (we'll go deeper in [32-typescript-react.md](32-typescript-react.md)).

## Export and import

ES modules — as in [30-es-modules.md](../javascript-basic/30-es-modules.md):

```tsx
// src/components/Hello.tsx
export function Hello() {
  return <p>Hello from component file</p>;
}
```

```tsx
// src/App.tsx
import { Hello } from "./components/Hello";

export function App() {
  return (
    <main>
      <h1>Shop</h1>
      <Hello />
    </main>
  );
}
```

| Import | When |
|--------|-------|
| `import { Hello } from "./Hello"` | named export (preferred) |
| `import Hello from "./Hello"` | default export (one per file) |
| `import type { Product } from "./types"` | types only, erased at build time |

**Path:** `./` — relative to the current file; `@/components/Hello` — if an alias is configured in `vite.config.ts` (later in [35-project-structure.md](35-project-structure.md)).

The mount chain in `examples/`:

```text
main.tsx  →  import { App } from "./App"
App.tsx   →  import { Hello } from "./components/Hello"
```

## JSX and TypeScript (`.tsx`)

The **`.tsx`** extension is required when a file contains JSX. TypeScript checks that you don't pass a `number` into `className` and suggests DOM attributes.

```tsx
// TS error: Type 'number' is not assignable to type 'string'
const broken = <div className={42}>Oops</div>;
```

Inline types are enough for the training labs; for the shop API, we'll extract `Product` in [19-lab-fetch-items.md](19-lab-fetch-items.md).

## Relation to the mock-exams shop

Right now the UI is static. Later `App` becomes the layout: a header, the Router's `<Outlet />`, a list with `GET /api/v1/items` on `:8090`. Each block is a separate component in `src/components/`, assembled through JSX and import. **Splitting files** from day one simplifies review just as splitting FastAPI into routers does.

## Common mistakes

| Mistake | Root cause | Fix |
|--------|------------------|-------------|
| `class="card"` | HTML habit | `className="card"` |
| Adjacent JSX elements must be wrapped | Two roots in return | One parent or `<>...</>` |
| `import hello from "./Hello"` with a named export | Confusing default/named | `import { Hello } from ...` |
| Component `function shop()` | Lowercase = DOM tag | `function Shop()` |
| `{items.map(...)}` without return in `{}` | Statement inside JSX | Ternary or map with return |
| JSX in a `.ts` file | Extension without X | Rename to `.tsx` |
| Forgot to close a tag | XML syntax | `<img />`, `</div>` |

## Summary

**JSX** is syntax for describing the UI inside JS/TS; it compiles to `createElement`. A **functional component** is a `PascalCase`-named function that returns JSX. Data flows into markup through **`{expressions}`**; attributes are camelCase and `className`. **Modules** connect files: `export function` + `import { ... }`. This is the foundation of the entire shop SPA up until props and state.

## Checklist

- [ ] Explain why JSX is not an HTML string
- [ ] Name three differences between JSX and HTML (`className`, comments, …)
- [ ] Why is a component's name capitalized?
- [ ] Why is a named export more convenient than a default for a team project?
- [ ] What happens if you return two `<div>`s without a wrapper?
- [ ] Where in `examples/` are the entry point and root component?

Next lesson: [03. Lab: first app](03-lab-first-app.md).
