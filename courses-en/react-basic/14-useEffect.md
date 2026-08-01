# 14. `useEffect`: syncing with the outside world

## A scenario from the field

After [13-lab-lifting-state.md](13-lab-lifting-state.md), the shop's catalog filter works fine in memory — but the product owner now wants the chosen theme **saved to `localStorage`** and the tab title **updated** when the page changes. A junior dev drops `localStorage.setItem` straight into the component body — the disk gets hit dozens of times per render, and DevTools starts flickering. Another developer subscribes to `window.resize` without unsubscribing — after a few navigations, a dozen handlers have piled up.

React renders the UI **synchronously** from props and state. Anything that falls **outside** that cycle — network calls, DOM outside React's control, timers, subscriptions — needs to be **synchronized** through **`useEffect`**.

## What you'll learn

- Why `useEffect` exists and how it differs from an event handler
- The three phases of an effect's life: **mount**, **update**, **unmount**
- The signature: `useEffect(callback, deps?)`
- When you **don't** need an effect (and why "an effect for everything" is an anti-pattern)
- How this connects to the shop catalog: side effects without extra requests to `:8090`

---

## UI vs. side effects

**Rendering** is a pure function: `(props, state) → JSX`. Inside the component body, you shouldn't:

- call `fetch` "just because";
- write to `document.title` on every render;
- subscribe to events without cleanup.

`useEffect` tells React: "**after** the browser has painted the DOM, run this."

```tsx
import { useEffect, useState } from "react";

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  return (
    <button type="button" onClick={() => setDark((v) => !v)}>
      {dark ? "Light" : "Dark"}
    </button>
  );
}
```

The effect with `[dark]` runs after mount and **every time** `dark` changes.

---

## Signature and execution order

```tsx
useEffect(() => {
  // setup — side effect
  return () => {
    // cleanup — optional
  };
}, [dependency1, dependency2]);
```

| Phase | When setup runs | When cleanup runs |
|------|-------------------------|---------------------------|
| **Mount** | after the first render hits the DOM | — |
| **Update** | after render, if deps changed | **before** the new setup (the old cleanup) |
| **Unmount** | — | before the component is removed |

```text
Mount:     render → paint → setup
Update:    render → paint → cleanup (old) → setup (new)
Unmount:   cleanup
```

---

## Mount-only effect

An empty dependency array `[]` means the effect runs **once** after mount (similar to `componentDidMount`):

```tsx
function ShopHeader() {
  useEffect(() => {
    document.title = "Shop — catalog";
  }, []);

  return <h1>Product catalog</h1>;
}
```

Use this deliberately — for "one-time initialization," not as a way to "hide a fetch without deps" (see [15-effect-patterns.md](15-effect-patterns.md)).

---

## An effect on every render

If the **second argument is omitted**, React runs setup **after every** render:

```tsx
useEffect(() => {
  console.log("After every render");
});
```

In practice this is almost never written this way — it risks infinite loops and wasted work. ESLint's `react-hooks/exhaustive-deps` warns about missing deps.

---

## Cleanup on unmount

Subscriptions and timers **must** be unsubscribed:

```tsx
function ViewportBadge() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    function onResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return <span>Width: {width}px</span>;
}
```

Without `removeEventListener`, the handler survives when the user navigates away from the catalog page — a classic SPA leak.

---

## localStorage: a typical shop scenario

```tsx
const STORAGE_KEY = "shop-theme";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // ...
}
```

The **lazy initializer** in `useState` reads from storage **once** on mount. **Writing** happens in an effect when `theme` changes, not during render.

---

## Strict Mode and the double mount (dev)

In React 19 + Strict Mode (dev), React **deliberately** mounts → unmounts → mounts again to expose missing cleanup. You might see the effect "flash" twice in the console — that's **expected** in development, not a bug in your code.

Check whether cleanup actually cancels timers and subscriptions. If it does, production will be stable.

---

## When you don't need `useEffect`

| Task | The right tool |
|--------|----------------------|
| Responding to a "Buy" click | an `onClick` handler |
| Filtering a list by state | compute it during render (`filter`) |
| Data for the UI from props | use props directly |
| Caching API responses | TanStack Query ([20-tanstack-query.md](20-tanstack-query.md)) |

`useEffect` isn't a "second render pass." Don't duplicate state that can be derived from other state ([12-lifting-state.md](12-lifting-state.md)).

---

## Connection to FastAPI :8090

Loading `/api/v1/items` **inside** an effect is a valid pattern for [17-fetch-react.md](17-fetch-react.md), but:

- don't call `fetch` in the component body without an effect;
- don't forget loading/error state;
- Query will later replace the manual effect ([20-tanstack-query.md](20-tanstack-query.md)).

Stand: [deploy/fastapi](../../deploy/fastapi/README.md), port **8090**.

---

## Common mistakes

1. **Side effect during render** — `localStorage.setItem` / `fetch` in the component body.

2. **Missing cleanup** — `addEventListener`, `setInterval` left without unsubscribing.

3. **Infinite loop** — `useEffect(() => setCount(c + 1))` with no deps, or with a dep the effect itself mutates.

4. **Confusing mount and update** — expecting "once" but forgetting `[ ]`.

5. **Effect instead of a handler** — submitting a form in `useEffect` on field change instead of `onSubmit`.

6. **Ignoring Strict Mode** — removing cleanup "so it doesn't double up" — breaking production on unmount.

---

## Summary

`useEffect` synchronizes a component with the outside world **after** the DOM commit. Setup runs on mount and whenever deps change; cleanup runs before the next setup and on unmount. An empty `[]` means once after mount. Side effects during render are an anti-pattern. Subscriptions and timers require cleanup. Strict Mode in dev checks that your effects hold up.

---

## Checklist

- How does render timing differ from effect timing?
- When does cleanup run?
- Why does `[dark]` belong in the second argument?
- Why is `localStorage.setItem` during render a bad idea?
- What does Strict Mode do to mount in development?
- Do you need `useEffect` to filter a product array by `search`?

Next lesson: [15. Dependencies and effect patterns](15-effect-patterns.md).
