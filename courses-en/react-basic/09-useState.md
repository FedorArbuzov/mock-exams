# 09. useState: local state

## Intro: a scenario from work

The "+" button in the shop's mini-cart: on click, the counter on screen doesn't change, but `console.log(count)` in the handler shows the new value. The developer mutates `state.items.push(line)` and passes **the same** array back into `setItems`. React compares the reference — render skipped. Another bug: two fast "+1" clicks with `setCount(count + 1)` lose an increment — a **stale closure**. Tech lead: "State is immutable, use a functional update, account for batching."

**`useState`** is the course's first hook: a component's memory between renders. Props come from outside; state is the UI's **internal** data (a counter, whether a modal is open, the search string before it's lifted in [12-lifting-state.md](12-lifting-state.md)).

## What you'll learn

- The **`useState`** syntax, the `[value, setValue]` pair.
- **Re-render** on a state update and the one-way flow.
- **Immutability** for objects and arrays ([07-objects.md](../javascript-basic/07-objects.md), [08-arrays.md](../javascript-basic/08-arrays.md)).
- **Functional updates** `setState(prev => ...)`.
- Initialization: lazy `useState(() => ...)`.
- State vs props; when not to lift state.

## The basic pattern

```tsx
import { useState } from "react";

export function CartCounter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>In cart: {count}</p>
      <button type="button" onClick={() => setCount(count + 1)}>
        +1
      </button>
    </div>
  );
}
```

1. First render: `count === 0`.
2. Click → `setCount(1)` → React schedules a re-render.
3. Second render: `count === 1`, the UI is updated.

**Important:** don't mutate `count` directly — `count++` won't trigger a render.

## Typing in TypeScript

```tsx
const [count, setCount] = useState<number>(0);

type CartLine = { id: number; qty: number };
const [lines, setLines] = useState<CartLine[]>([]);

const [query, setQuery] = useState<string>("");
```

TS often infers the type from the initial value; for `[]`, specify the generic explicitly.

## Immutability: objects and arrays

```tsx
const [cart, setCart] = useState<{ id: number; items: string[] }>({
  id: 1,
  items: [],
});

// Bad — mutation
function addWrong(item: string) {
  cart.items.push(item);
  setCart(cart); // same reference — a bug
}

// OK — a new object and array
function addItem(item: string) {
  setCart((prev) => ({
    ...prev,
    items: [...prev.items, item],
  }));
}
```

Spread — [17-destructuring-spread.md](../javascript-basic/17-destructuring-spread.md). The same principle applies to the product list after filtering in [13-lab-lifting-state.md](13-lab-lifting-state.md).

### Updating a single element in an array

```tsx
setLines((prev) =>
  prev.map((line) =>
    line.id === productId ? { ...line, qty: line.qty + 1 } : line,
  ),
);
```

## Functional updates

When the new state **depends on the previous one**, especially across several calls in a row:

```tsx
// May lose clicks in a single event (batching helps, but the pattern matters for async)
setCount(count + 1);
setCount(count + 1); // both read the old count

// OK
setCount((c) => c + 1);
setCount((c) => c + 1); // +2 in one synchronous handler
```

Use the functional form **always** when the updater needs `prev` — filter, map, toggle:

```tsx
const toggleExpanded = (id: number) => {
  setExpandedIds((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
  );
};
```

## Lazy initial state

Heavy initialization — a function, called **once**:

```tsx
function readInitialFilter(): string {
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

const [query, setQuery] = useState(() => readInitialFilter());
```

Without the function, `readInitialFilter()` would run **on every** render.

## Several useState vs one object

```tsx
// Simple independent fields — separate hooks
const [qty, setQty] = useState(1);
const [note, setNote] = useState("");

// A related form — one object (updates are a bit more verbose)
const [form, setForm] = useState({ qty: 1, note: "" });
setForm((f) => ({ ...f, qty: 2 }));
```

For shop checkout later — react-hook-form; at the basic level, `useState` is enough ([10-events-controlled.md](10-events-controlled.md)).

## State and render: a mental model

```text
Event (click) → setState → schedule re-render
                → function component runs again
                → new JSX → reconciliation → DOM patch
```

State is **local** to the component. Two `<CartCounter />`s on the page are **two** independent counters. A shared counter — lift state ([12-lifting-state.md](12-lifting-state.md)) or Context ([29-context.md](29-context.md)).

## Data from the API

Server data is **not** always duplicated into useState — later TanStack Query ([20-tanstack-query.md](20-tanstack-query.md)). Local UI state (modal open, tab index) — always useState. For `fetch` + `useState(products)` — [17-fetch-react.md](17-fetch-react.md).

## Common mistakes

| Mistake | Root cause | Fix |
|--------|------------------|-------------|
| UI doesn't update after push | Mutation + same reference | New array/object |
| Lost increments | `setCount(count+1)` x2 | Functional updater |
| State from props without sync | props → state once | Derived or key on remount |
| One giant state object | Everything in `useState({...})` | Split or useReducer (later) |
| setState in the render body | Infinite loop | setState only in handlers/effects |
| `useState` in if/for | Rules of Hooks | Top level only |

## Summary

**`useState`** stores local state between renders. Updates go through the **setter**; objects/arrays are **immutable**. **Functional updates** — when you need the previous state. Shop: qty in the cart, the filter, open panels — it all starts here.

## Checklist

- [ ] What does `useState(0)` return?
- [ ] Why does `items.push(x); setItems(items)` break the UI?
- [ ] When do you write `setCount(c => c + 1)`?
- [ ] Lazy init — why a function in `useState(() => ...)`?
- [ ] Two instances of a component — one state or two?

Next lesson: [10. Events and controlled inputs](10-events-controlled.md).
