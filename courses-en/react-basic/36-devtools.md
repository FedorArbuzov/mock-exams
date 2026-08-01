# 36. React DevTools and debugging

## Introduction: "The component renders 47 times on one click"

Staging shop: adding to the cart lags. The Profiler shows that the whole `CatalogPage` re-renders because the Context value is recreated on every render ([29-context.md](29-context.md)). Without DevTools you added `useMemo` at random in five places ([27-ref-memo-callback.md](27-ref-memo-callback.md)).

**React Developer Tools** — a browser extension + the Components and Profiler tabs. Additionally: **why-did-you-render** (WDYR) — a dev-only library for logging extra renders. This chapter is a practical workflow for the mock-exams SPA.

## What you'll learn

- Installing React DevTools.
- Components tree: props, state, hooks.
- Profiler: record, flamegraph, commit duration.
- Common bugs: stale props, wrong key, effect loops.
- WDYR — setup overview, when it's useful.
- Connection to [31-ui-states.md](31-ui-states.md), Query Devtools.

---

## Installation

1. Chrome/Edge/Firefox: the **React Developer Tools** extension.
2. Open `http://localhost:5173` (examples).
3. DevTools → the **Components** and **Profiler** tabs (they appear only on React apps).

If the tabs aren't there — the site isn't React, or it's a production build without the dev hook (rare in Vite dev).

---

## Components panel

### The tree

Inspect `<ProductCard>` — you see:
- **props** (`item`, `onAdd`)
- **hooks** (`State`, `Context`, `Memo`)
- **rendered by** — the parent chain

### Edit props live

Temporarily change `item.title` — the UI updates. For reproducing bugs without a rebuild.

### Suspense / Server (preview)

React 19 — the hooks list may include `Memoized`/`Effect`. Names are minified in prod — use **source maps** (`vite build --sourcemap` for staging debug).

---

## Finding extra re-renders

### Scenario: CartProvider

1. Components → `CartProvider` → settings → **highlight updates**.
2. Click "Add to cart" — half the tree lights up.
3. Check the Provider's `value` prop — a new object on every render?

Fix: `useMemo` on the value ([29-context.md](29-context.md)).

### Scenario: inline function without a memo child

`ProductCard` wrapped in `memo` — still updates. Props → `onAdd` is a **new function** each render. Fix: `useCallback` ([27-ref-memo-callback.md](27-ref-memo-callback.md)) **or** remove memo if it's not needed.

---

## Profiler

### Recording

1. Profiler → Record.
2. Run the scenario: open catalog, filter, add to cart.
3. Stop.

### Reading

- **Flame graph** — the render duration of each component.
- **Ranked** — who ate the most time.
- **Why did this render?** (React 19+ DevTools) — props/state/context changed.

**Commit phases:** render (pure) vs commit (DOM). A long render — heavy JS or a huge tree.

### Target metrics (dev guideline)

Catalog first paint — most commits < 16ms is **not** a 60fps guarantee, but red flags are > 50ms on a keystroke search.

---

## React Strict Mode

`main.tsx`:

```tsx
<StrictMode>
  <App />
</StrictMode>
```

Development **double-invokes** render/effects — intentionally ([15-effect-patterns.md](15-effect-patterns.md)). Don't be alarmed by a double fetch in dev; in prod — once. Record with the Profiler while keeping the double render in mind.

---

## TanStack Query Devtools

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

Shows:
- query keys `["items"]`
- stale/fresh, cache time
- refetch triggers

Cross-check with the UI loading states [31-ui-states.md](31-ui-states.md). A "double fetch" — Strict Mode + missing staleTime — isn't always a bug.

---

## why-did-you-render (overview)

The `@welldone-software/why-did-you-render` library logs to the console why a memo component re-rendered.

### Setup sketch (dev only)

```tsx
// wdyr.ts
import React from "react";

if (import.meta.env.DEV) {
  const whyDidYouRender = await import("@welldone-software/why-did-you-render");
  whyDidYouRender.default(React, {
    trackAllPureComponents: true,
    trackHooks: true,
  });
}
```

```tsx
// main.tsx — the first import
import "./wdyr";
```

Mark a component:

```tsx
ProductCard.whyDidYouRender = true;
```

**Console:** `ProductCard re-rendered because props.onAdd changed`.

### When to use it

- The Profiler showed frequent updates of memo components.
- Don't enable `trackAllPureComponents` permanently — noise.

### When it's not needed

- Few components, an obvious Context bug.
- Production builds — **never** bundle WDYR.

---

## Debugging useEffect

Components → select a component → hooks → Effect dependencies.

Symptom: an infinite loop — the effect sets state → deps change → the effect runs again.

**Fix:** correct deps, a functional update, move the logic to an event handler ([15-effect-patterns.md](15-effect-patterns.md)).

DevTools **doesn't** replace `console.log` for async order — but it shows **how many** renders happened.

---

## Debugging the Router

React Router DevTools isn't in core; look at the URL bar + the Components tree `Routes` / `Outlet`. Wrong route — inspect the matched route in the [25-lab-router.md](25-lab-router.md) config.

**useSearchParams** — props in router hooks are visible via the Components state.

---

## Network + React

The DevTools **Network** tab, separately:
- duplicate `GET /api/v1/items` — Query dedupe, Strict Mode, or missing queryKey stability.
- CORS error — [18-cors-fastapi.md](18-cors-fastapi.md), not a React bug.

---

## Breakpoints in the IDE

VS Code/Cursor: a breakpoint in `ProductCard.tsx`, Chrome attaches to Vite. Alternative — a `debugger;` statement.

Source maps in Vite dev — on by default.

---

## Checklist for debugging a shop bug

1. Reproduce in dev, with React DevTools installed.
2. Components — props/state as expected?
3. Query Devtools — cache hit/miss?
4. Profiler — who re-renders on the action?
5. Network — API OK on `:8090`?
6. Effect deps — a loop?
7. Only then memo/useCallback ([27-ref-memo-callback.md](27-ref-memo-callback.md)).

---

## Common mistakes

**Optimize before you measure** — memo everywhere, the bug was a wrong `key`.

**Ignoring Strict Mode double effects** — "fix" with empty deps → stale data.

**WDYR in production** — bundle size + leak patterns.

**Confusing React DevTools with Redux DevTools** — different extensions.

**Profiler in dev only** — prod performance differs; validate with a production build profile when needed.

---

## Summary

React DevTools — inspect the tree, props, hooks; Profiler — find slow/frequent renders. Query Devtools — server state. WDYR — a dev helper for memo violations. Measure, then fix the Context value / callbacks / keys.

## Checklist

- [ ] Where the Components tab is on :5173
- [ ] How to record a Profiler session
- [ ] Strict Mode double render — why
- [ ] Query Devtools for `["items"]`
- [ ] WDYR — dev-only, what it logs

Next lesson: [37. Interview Q&A](37-interview-qa.md).
