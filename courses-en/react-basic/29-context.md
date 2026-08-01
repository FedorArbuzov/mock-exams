# 29. Context: global state without prop drilling

## Introduction: "Pass theme through 12 components?"

The designer asks for a dark theme in the mock-exams shop. `ThemeContext` is needed in `Header`, `ProductCard`, `CartDrawer`, `Footer`. Without Context you pass `theme` and `setTheme` through every intermediate layout — **prop drilling**. Refactoring breaks types and reviews: "Why does CatalogFilters know about theme?"

**React Context** is a built-in mechanism: a Provider at the top of the tree, `useContext` (or a custom hook) in any descendant. It doesn't replace Redux "by default"; for theme, locale, an auth snapshot, or the **cart** in react-basic, it's often enough.

After [28-custom-hooks.md](28-custom-hooks.md) you move logic into `useCart`. Context is **where the value goes** that many UI branches share. Lab: [30-lab-context.md](30-lab-context.md). Data from `:8090` still lives in TanStack Query ([20-tanstack-query.md](20-tanstack-query.md)) — Context is not for the server cache.

## What you'll learn

- `createContext`, `Provider`, `useContext`.
- Default value and the "used outside a Provider" check.
- Separating **state** and **dispatch** (Redux-lite style).
- When Context is **not** needed — lifting state, Query, URL ([26-url-state.md](26-url-state.md)).
- Performance: extra re-renders and how to mitigate them.

---

## Minimal example: Theme

```tsx
// context/ThemeContext.tsx
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () =>
        setTheme((t) => (t === "light" ? "dark" : "light")),
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
```

Wrapping the app ([23-react-router.md](23-react-router.md)):

```tsx
// main.tsx or App.tsx
<ThemeProvider>
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
</ThemeProvider>
```

Consumer:

```tsx
function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header data-theme={theme}>
      <span>mock-exams shop</span>
      <button type="button" onClick={toggleTheme}>
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </header>
  );
}
```

**`data-theme`** — a hook for CSS ([33-styling.md](33-styling.md)).

---

## createContext and the default value

```tsx
const CartContext = createContext<CartContextValue>({
  items: [],
  addItem: () => {},
});
```

The default is used when there is **no** Provider above — which often **hides a bug** (an `addItem` call becomes a no-op). Better:

```tsx
const CartContext = createContext<CartContextValue | null>(null);
```

with an explicit error in `useCart()` — fail fast on an incorrect tree.

---

## Provider value and re-renders

When `value` changes, **all** consumers of `useContext(CartContext)` re-render, even if they only use `items.length` while `theme` changed in a **different** context.

### One context per concern

```text
ThemeProvider     → theme only
CartProvider      → cart only
AuthProvider      → later, in react-intermediate
```

Not one `AppContext` with 20 fields.

### useMemo for the value object

```tsx
const value = useMemo(
  () => ({ items, addItem, removeItem }),
  [items] // addItem/removeItem are stable via useCallback
);
```

Without `useMemo`, a new object literal on every render → extra consumer re-renders.

### Split contexts (advanced technique)

`CartItemsContext` + `CartActionsContext` — consumers that only need `addItem` don't re-render when `items` changes. In react-basic it's enough to know the idea; if you hit problems, use the Profiler ([36-devtools.md](36-devtools.md)).

---

## Cart: a typical model

```tsx
type CartItem = { id: number; title: string; qty: number };

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  setQty: (id: number, qty: number) => void;
  clear: () => void;
  totalCount: number;
};
```

A reducer is optional ([09-useState.md](09-useState.md) + an updater function is enough for basic):

```tsx
function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "ADD":
      // immutability — javascript-basic lessons 07-08
      // ...
    default:
      return state;
  }
}
```

**Syncing with the API:** the cart in Context is **client** state until checkout; the order POST is a mutation ([21-mutations.md](21-mutations.md)) to `:8090` once the endpoint exists.

---

## Context vs other solutions

| Need | Solution |
|-------------|---------|
| Two siblings, shared parent | Lifting state ([12-lifting-state.md](12-lifting-state.md)) |
| A filter in the URL | `useSearchParams` ([26-url-state.md](26-url-state.md)) |
| A product list from the server | `useQuery` |
| Theme, cart, i18n | Context |
| Frequent 60fps updates | ref, local state, not a global context |
| Huge app state | react-intermediate / Zustand |

### When NOT to overuse Context

1. **Server state** — duplicating items from Query into Context → two sources of truth.
2. **The whole URL in Context** — duplicating the Router.
3. **Form field-by-field** — local `useState` in the form ([10-events-controlled.md](10-events-controlled.md)).
4. **Optimization "for the future"** — one Provider for the whole app with a god-object.

**Rule:** use Context for data that **many components** read/change and that is **not** a server cache.

---

## Composing Providers

```tsx
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
```

Order: Query on the outside or inside — both are OK; Theme/Cart shouldn't depend on Query at init.

File `src/app/providers.tsx` — [35-project-structure.md](35-project-structure.md).

---

## TypeScript

Type the context value explicitly; export only the `useCart` hook, not the raw context — encapsulation.

```tsx
export type { CartItem };
export function useCart(): CartContextValue { /* ... */ }
// CartContext — not exported
```

More: [32-typescript-react.md](32-typescript-react.md).

---

## Testing

Wrap the component in the test:

```tsx
render(
  <CartProvider>
    <AddToCartButton itemId={1} />
  </CartProvider>
);
```

Or use a mock provider with a fixed value to isolate the UI.

---

## Connection to mock-exams

```text
Browser
  └── ThemeProvider (UI prefs)
        └── CartProvider (client cart)
              └── QueryClientProvider
                    └── Router
                          ├── /catalog  → items from :8090
                          └── /cart     → reads CartContext
```

FastAPI `:8090` is the **catalog source**; the cart before the order is sent is the **client**, so Context is appropriate.

---

## Common mistakes

**Provider below the consumer** — `useCart` throws or the default is a no-op.

**A new object/function in value without memo/callback** — cascading re-renders.

**Storing a fetch result in Context** instead of Query — stale data after a mutation.

**Context for every prop** — over-engineering; props are still alive ([04-props.md](04-props.md)).

**Forgetting the key when persisting the cart to localStorage** — version the schema (`cart-v1`).

---

## Summary

Context solves **prop drilling** for cross-cutting client state: theme, cart, locale. `createContext` + `Provider` + `useContext`/custom hook. Keep contexts narrow, memoize the value, keep server data in Query. Practice — [30-lab-context.md](30-lab-context.md).

## Checklist

- [ ] Three APIs: createContext, Provider, useContext
- [ ] Why a `null` default + throw in the hook
- [ ] Context vs lifting state vs Query — the decision table
- [ ] Why `useMemo` on the Provider value
- [ ] Where ThemeProvider goes in the shop SPA tree

Next lesson: [30. Lab: Context](30-lab-context.md).
