# 37. Interview Q&A: top 35 React questions

## Introduction: why this chapter

In a frontend interview, React is tested not on `useState` syntax but on your **UI update model**, hooks rules, data fetching, performance intuition, and trade-offs (Context vs Query, when memo is needed). This chapter has the **detailed answers** to [interview-cheatsheet.md](interview-cheatsheet.md).

**How to work through it:**

1. Read the question, **cover** the answer, and answer out loud for 1–2 minutes.
2. Compare with the breakdown: the **why** matters, not just the **what**.
3. If you fail one — go back to the lesson listed under "Where in the course."

---

## Block 1. React fundamentals

### 1. How does React differ from "just JavaScript in HTML"?

**Answer.** React is a library for **declarative UI**: you describe `UI = f(state, props)`, and React reconciles the DOM through the Virtual DOM and reconciliation. Vanilla JS uses imperative DOM edits (`createElement`, `innerHTML`). React reduces state/DOM desync and scales the component tree. React is **not** a router and **not** a data layer — those are added separately (Router, TanStack Query).

**Where in the course:** [01-landscape.md](01-landscape.md).

---

### 2. What is JSX? Does it compile to HTML?

**Answer.** JSX is syntactic sugar over `React.createElement` (or the new JSX runtime). `<ProductCard title="x" />` → a function call with props. It's **not** an HTML string: `className` instead of `class`, expressions in `{ }`, one root or a Fragment. Babel/SWC compiles it to JS.

**Where in the course:** [02-jsx-components.md](02-jsx-components.md).

---

### 3. MPA vs SPA — when is React justified?

**Answer.** **MPA:** full page reload, HTML from the server — simpler SEO, less JS. **SPA:** one bundle, navigation without a full reload, rich interactivity (filters, cart). React is justified when the UI updates locally and often and there's a JSON API backend (mock-exams shop + FastAPI `:8090`). A static landing page is often overkill.

**Where in the course:** [01-landscape.md](01-landscape.md).

---

### 4. Virtual DOM — is it always faster than manual DOM?

**Answer.** **No.** The Virtual DOM is a trade-off: predictability and developer experience; diff + commit have a cost. Huge lists need virtualization and memoization. React doesn't "speed up the DOM," it **structures** updates.

**Where in the course:** [01-landscape.md](01-landscape.md), [27-ref-memo-callback.md](27-ref-memo-callback.md).

---

### 5. Unidirectional data flow — what is it?

**Answer.** Data flows **down** via props; events/callbacks flow **up**. Children don't mutate props. Shared state — a common parent (lifting) or Context. It simplifies debugging: there's one source of truth.

**Where in the course:** [04-props.md](04-props.md), [12-lifting-state.md](12-lifting-state.md).

---

## Block 2. Components, props, lists

### 6. Props vs state?

**Answer.** **Props** — input parameters from the parent, read-only for the child. **State** — a component's internal data (`useState`); changing it triggers a re-render. Props are changed by the parent; state by `setState` inside the owner.

**Where in the course:** [04-props.md](04-props.md), [09-useState.md](09-useState.md).

---

### 7. Why `key` in lists? Why is index a bad key?

**Answer.** Keys help reconciliation **identify** an element between renders. A stable id (`item.id`) preserves the DOM node's state on reorder/filter. An **index** breaks on insert/delete/reorder — wrong component state, extra unmount/mount, bugs in forms.

**Where in the course:** [07-lists-keys.md](07-lists-keys.md).

---

### 8. Controlled vs uncontrolled input?

**Answer.** **Controlled:** value from React state, `onChange` updates state — a single source of truth. **Uncontrolled:** value in the DOM, read via a ref. Controlled is the default for forms in React (validation, reset). Uncontrolled — files, integration with a non-React lib.

**Where in the course:** [10-events-controlled.md](10-events-controlled.md).

---

### 9. Composition vs inheritance?

**Answer.** React recommends **composition**: `children`, render props, slots — instead of class `extends`. Inheritance with class components is a legacy pattern.

**Where in the course:** [05-children-composition.md](05-children-composition.md).

---

### 10. Lifting state up — when?

**Answer.** When **two or more siblings** must show/change the same data (a filter + a list). State is lifted to the **nearest common** parent; props down, callbacks up. If the drilling is deep — Context ([29-context.md](29-context.md)).

**Where in the course:** [12-lifting-state.md](12-lifting-state.md).

---

## Block 3. Hooks

### 11. Rules of Hooks?

**Answer.** (1) Call hooks only at the **top level** — not in if/loop/nested functions. (2) Only from **React function components** or **custom hooks**. Reason: React stores hook state in a fixed call order; a conditional call throws off the indices.

**Where in the course:** [28-custom-hooks.md](28-custom-hooks.md).

---

### 12. `useState` batching — several setStates?

**Answer.** In React 18+, updates in event handlers and many async paths **batch** — one re-render. `setA(1); setB(2);` — one commit. Historically the exceptions were in setTimeout without batching — in 18, automatic batching is broader.

**Where in the course:** [09-useState.md](09-useState.md).

---

### 13. Functional update `setState(prev => ...)` — why?

**Answer.** When the new state **depends on the previous** one and updates can batch/be async — `prev` is up to date. `setCount(c => c + 1)` without a stale closure. Especially in rapid events and effects.

**Where in the course:** [09-useState.md](09-useState.md).

---

### 14. `useEffect` vs event handler?

**Answer.** An **effect** synchronizes with the **outside world** after render: fetch (if not Query), subscriptions, document.title. A **handler** reacts to a **user action** (click, submit). Don't duplicate a fetch on every render in an effect without deps; don't put "on click logic" in an effect without a reason.

**Where in the course:** [14-useEffect.md](14-useEffect.md), [15-effect-patterns.md](15-effect-patterns.md).

---

### 15. Dependency array `[]`, `[a]`, no array?

**Answer.** `[]` — mount/unmount (cleanup on unmount). `[a,b]` — re-run when `a` or `b` change (compared with Object.is). **No array** (omitted — actually every effect has an array; a missing one means it runs on every render) — almost always a bug except for rare patterns. ESLint exhaustive-deps helps.

**Where in the course:** [15-effect-patterns.md](15-effect-patterns.md).

---

### 16. Cleanup in useEffect — an example?

**Answer.** A return function: clearInterval, removeEventListener, abort a fetch. It's called before the next effect run and on unmount. It prevents leaks and setState on an unmounted component.

**Where in the course:** [15-effect-patterns.md](15-effect-patterns.md).

---

### 17. `useRef` vs `useState`?

**Answer.** **useState** — a change triggers a re-render. **useRef** — `.current` is mutable **without** a re-render. Use a ref for DOM nodes, timer ids, previous values. UI derived from ref.current during render is an anti-pattern.

**Where in the course:** [27-ref-memo-callback.md](27-ref-memo-callback.md).

---

### 18. `useMemo` and `useCallback` — when are they needed?

**Answer.** When there's a **measured** bottleneck: an expensive filter/sort, a `React.memo` child that needs a stable props reference, a stable callback for effect deps. **Not** by default on every handler — the overhead of comparing deps. Server cache — TanStack Query, not a `useMemo` fetch.

**Where in the course:** [27-ref-memo-callback.md](27-ref-memo-callback.md).

---

### 19. Custom hook — what is it?

**Answer.** A `use*` function calling other hooks — reuse of **stateful logic**, not UI. Example: `useDebouncedValue`, `useCart`. Not hooks in ordinary utils.

**Where in the course:** [28-custom-hooks.md](28-custom-hooks.md).

---

## Block 4. Data, API, Query

### 20. Where does fetch go in React — effect, Query, loader?

**Answer.** **TanStack Query** (preferred): cache, dedupe, stale, refetch, loading flags. Raw **useEffect + fetch** — OK for learning, easy to get wrong (race, no cache). **Router loaders** — data before the route (overview [24-nested-routes.md](24-nested-routes.md)). mock-exams shop — Query to `:8090`.

**Where in the course:** [17-fetch-react.md](17-fetch-react.md), [20-tanstack-query.md](20-tanstack-query.md).

---

### 21. CORS — is it a React error?

**Answer.** **No.** Browser security: an SPA on `:5173` fetching `:8090` needs `Access-Control-Allow-Origin` headers on the API. React doesn't bypass CORS. Fix it in FastAPI middleware ([18-cors-fastapi.md](18-cors-fastapi.md)).

**Where in the course:** [18-cors-fastapi.md](18-cors-fastapi.md).

---

### 22. queryKey in TanStack Query — why?

**Answer.** A unique cache key: `["items", { q, page }]`. Invalidating `["items"]` after a mutation refreshes lists. Stable serializable keys — best practice.

**Where in the course:** [20-tanstack-query.md](20-tanstack-query.md), [21-mutations.md](21-mutations.md).

---

### 23. Optimistic update — the idea?

**Answer.** The UI updates **before** the server response; on error, rollback. Query: `onMutate` snapshot + `onError` restore. Faster UX for add-to-cart; you need consistency with the server's source of truth.

**Where in the course:** [21-mutations.md](21-mutations.md).

---

## Block 5. Router, Context, UI

### 24. React Router — its role in an SPA?

**Answer.** Sync the **URL** with the component tree: `/catalog`, `/items/5`, query params. Browser back/forward works. React doesn't include a router — `react-router-dom`. Layout routes + `Outlet` ([24-nested-routes.md](24-nested-routes.md)).

**Where in the course:** [23-react-router.md](23-react-router.md).

---

### 25. URL search params as state?

**Answer.** Shareable filter/sort: `?q=milk&sort=price`. `useSearchParams` reads/writes. Prefer it over Context for **bookmarkable** UI state ([26-url-state.md](26-url-state.md)).

**Where in the course:** [26-url-state.md](26-url-state.md).

---

### 26. Context — when to use it, when not?

**Answer.** **Yes:** theme, locale, client cart — many consumers, not a server cache. **No:** server lists (Query), form field state (local), deep drilling fixable one level up, high-frequency updates (perf). Split contexts, memo the value.

**Where in the course:** [29-context.md](29-context.md).

---

### 27. Loading / error / empty — mandatory?

**Answer.** Any async screen needs the three explicit UX states + retry on error. Empty ≠ error. Skeleton for lists ([31-ui-states.md](31-ui-states.md)).

**Where in the course:** [31-ui-states.md](31-ui-states.md).

---

## Block 6. TypeScript, structure, debug

### 28. How do you type props and events?

**Answer.** An interface for props; `ChangeEvent<HTMLInputElement>`; `ComponentProps<"button">` to extend native; a generic `DataList<T>`. Shared API types in `types/item.ts` ([32-typescript-react.md](32-typescript-react.md)).

**Where in the course:** [32-typescript-react.md](32-typescript-react.md).

---

### 29. StrictMode double render — a bug?

**Answer.** A **dev-only** intentional double invoke of render/effects to find side effects. In prod — once. Don't "fix" it with empty deps.

**Where in the course:** [36-devtools.md](36-devtools.md), [00-environment.md](00-environment.md).

---

### 30. React DevTools Profiler — what do you look for?

**Answer.** Commit durations, **why a component re-rendered** (props/state/context changed). A cascade from a new Context value or an unstable callback. Measure before memo.

**Where in the course:** [36-devtools.md](36-devtools.md).

---

### 31. Feature folder structure — why?

**Answer.** Scale: `pages/` thin routes, `features/catalog`, shared `components/ui`, `api/` for HTTP. Predictable imports, review, capstone ([35-project-structure.md](35-project-structure.md)).

**Where in the course:** [35-project-structure.md](35-project-structure.md).

---

## Block 7. Comparisons and senior-ish

### 32. React vs Vue/Angular (briefly)?

**Answer.** React — a library + ecosystem choices; Vue — a progressive framework with SFCs; Angular — a full framework with DI/RxJS. React wins on hiring surface; the trade-off — assemble the stack yourself (Router, Query). mock-exams standardizes on React + FastAPI.

**Where in the course:** [01-landscape.md](01-landscape.md).

---

### 33. Class components vs hooks?

**Answer.** Classes: `this.state`, lifecycle methods — legacy. Hooks: compose logic, less boilerplate, the official recommendation. Maintain legacy, write new code with functions.

**Where in the course:** [01-landscape.md](01-landscape.md).

---

### 34. Error Boundary — what does it do? (overview)

**Answer.** A class component with `componentDidCatch` / `getDerivedStateFromError` — catches **render** errors in children and shows a fallback UI. It does **not** catch event handlers, async, or SSR the same way. react-intermediate goes deeper; in an interview — know that it exists.

**Where in the course:** README → react-intermediate.

---

### 35. How would you design a catalog SPA against a REST API?

**Answer (outline).** Vite+React+TS; React Router (`/`, `/items/:id`, `/cart`); TanStack Query for `GET /api/v1/items` to `:8090`; typed `api/client`; UI states loading/error/empty; cart in Context; controlled forms + mutation invalidate; CSS modules; structure `features/` + `pages/`; CORS on the API; capstone acceptance criteria ([38-capstone.md](38-capstone.md)).

**Where in the course:** the whole react-basic track.

---

## After the chapter

1. Go through [interview-cheatsheet.md](interview-cheatsheet.md) **without peeking**.
2. [38-capstone.md](38-capstone.md) — the final project.
3. Next: [react-intermediate](../react-intermediate/README.md), [javascript-testing](../javascript-path.md).
