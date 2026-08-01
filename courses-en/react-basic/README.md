# React — Basic

An extremely detailed **React** course for building the UI on top of the shop API mock-exams: components, JSX, props, state, hooks, forms, React Router, `fetch`, and **TanStack Query** against [`deploy/fastapi`](../../deploy/fastapi/README.md) `:8090`. **38 lessons** + capstone + interview cheatsheet.

> Start of the JS track: [`javascript-path.md`](../javascript-path.md). **Prerequisites** — [`javascript-basic`](../javascript-basic/README.md) and ideally [`typescript-basic`](../typescript-basic/README.md). Next up — [`react-intermediate`](../react-intermediate/README.md), [`javascript-testing`](../javascript-path.md).

**Prerequisites:** Node.js **LTS** (20 or 22), solid JS (functions, arrays, `async/await`, `fetch`), basic TypeScript (props, unions, Zod — for the API labs).

**Locally:** Vite + React in the [`examples/`](examples/package.json) directory. The FastAPI backend is optional through chapter 18, required from chapter 19 on.

```bash
cd courses/react-basic/examples
npm install
npm run dev          # http://localhost:5173
# in another terminal — FastAPI stand :8090 (see deploy/fastapi)
```

## How to read the chapters

Each lesson is a **full textbook chapter**, not a cheatsheet. The author walks from a **real work scenario** (a Jira ticket, a prod bug, a code review) to concepts, code, and common mistakes — same approach as javascript-basic.

1. **Theory** — "Scenario from work" → explanation → examples → "Common mistakes" → "Checklist". Nail the checklist **in your own words** before the lab.
2. **Lab** — hands-on in [`examples/`](examples/package.json): `npm run dev`, edits in `src/`, success criteria. The lab **continues the story** from the theory.
3. After block 37 — [`interview-cheatsheet.md`](interview-cheatsheet.md), **without peeking** back at the chapters.
4. [38-capstone.md](38-capstone.md) — **6–8 hours**, a "Shop Catalog" SPA against `:8090`.

**Time:** **~50–70 minutes** per "theory + lab" pair. The whole course — **~16–20 hours**; capstone is separate.

## Curriculum (38 lessons)

### Phase 1. Environment and first app (00–03)

| # | Lesson |
|---|------|
| 00 | [Environment: Vite, React, DevTools](00-environment.md) |
| 01 | [The landscape: SPA, React, Virtual DOM](01-landscape.md) |
| 02 | [JSX and function components](02-jsx-components.md) |
| 03 | [Lab: your first app](03-lab-first-app.md) |

### Phase 2. Props and composition (04–08)

| 04 | [Props: passing data down](04-props.md) |
| 05 | [Children, composition, slots](05-children-composition.md) |
| 06 | [Lab: product card](06-lab-props.md) |
| 07 | [Lists, keys, fragments](07-lists-keys.md) |
| 08 | [Conditional rendering](08-conditional-rendering.md) |

### Phase 3. State and events (09–13)

| 09 | [`useState`: local state](09-useState.md) |
| 10 | [Events and controlled inputs](10-events-controlled.md) |
| 11 | [Lab: cart and counter](11-lab-state.md) |
| 12 | [Lifting state up](12-lifting-state.md) |
| 13 | [Lab: catalog filter](13-lab-lifting-state.md) |

### Phase 4. Side effects (14–17)

| 14 | [`useEffect`: syncing with the outside world](14-useEffect.md) |
| 15 | [Dependencies, cleanup, common patterns](15-effect-patterns.md) |
| 16 | [Lab: search with debounce](16-lab-effects.md) |
| 17 | [`fetch` in React: loading and errors](17-fetch-react.md) |

### Phase 5. API and TanStack Query (18–22)

| 18 | [CORS, FastAPI :8090, API contract](18-cors-fastapi.md) |
| 19 | [Lab: product list from the API](19-lab-fetch-items.md) |
| 20 | [TanStack Query: queries and cache](20-tanstack-query.md) |
| 21 | [Mutations, invalidation, optimistic UI](21-mutations.md) |
| 22 | [Lab: CRUD via Query](22-lab-query.md) |

### Phase 6. Routing (23–26)

| 23 | [React Router: routes and navigation](23-react-router.md) |
| 24 | [Nested routes, layout, loaders (overview)](24-nested-routes.md) |
| 25 | [Lab: catalog / product / 404](25-lab-router.md) |
| 26 | [URL as state: search params](26-url-state.md) |

### Phase 7. Advanced hooks and context (27–31)

| 27 | [`useRef`, `useMemo`, `useCallback`](27-ref-memo-callback.md) |
| 28 | [Custom hooks](28-custom-hooks.md) |
| 29 | [Context: global state without prop drilling](29-context.md) |
| 30 | [Lab: theme and cart via Context](30-lab-context.md) |
| 31 | [Loading, error, empty states in the UI](31-ui-states.md) |

### Phase 8. TypeScript, styling, structure (32–35)

| 32 | [TypeScript in React: props, events, children](32-typescript-react.md) |
| 33 | [Styling: CSS modules, Tailwind (overview)](33-styling.md) |
| 34 | [Lab: typed catalog](34-lab-typescript.md) |
| 35 | [Project structure and conventions](35-project-structure.md) |

### Phase 9. Debugging and wrap-up (36–38)

| 36 | [React DevTools and debugging](36-devtools.md) |
| 37 | [Interview Q&A (top 35)](37-interview-qa.md) |
| 38 | [Capstone: Shop Catalog SPA](38-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you'll come away with

- You can create a **Vite + React + TypeScript** project and explain the dev/build cycle.
- You write **function components** with JSX, props, children, lists, and keys.
- You manage **local state** (`useState`) and lift state up to a shared parent.
- You handle **events** and **controlled forms** without the "cursor jumping to the end" bug.
- You use **`useEffect`** deliberately: dependencies, cleanup, no redundant requests.
- You load data from **FastAPI :8090** via `fetch` and **TanStack Query**.
- You set up **React Router**: list, detail, 404, query params.
- You extract logic into **custom hooks** and **Context** without a "god component".
- You type props and API responses; you show **loading/error/empty** states in the UI.
- You debug with **React DevTools** and know the common interview questions.

## How this connects to other courses

| Course | Connection |
|------|-------|
| [`javascript-basic`](../javascript-basic/README.md) | the language, `fetch`, the event loop |
| [`typescript-basic`](../typescript-basic/README.md) | props types, Zod, typed fetch |
| [`fastapi`](../../deploy/fastapi/README.md) | shop API `:8090`, CORS |
| [`api-design`](../api-design/README.md) | REST, status codes, pagination |
| [`react-intermediate`](../react-intermediate/README.md) | auth, error boundaries, performance |
| [`javascript-testing`](../javascript-path.md) | Testing Library, MSW |

## Examples

| Path | Purpose |
|------|------|
| [`examples/package.json`](examples/package.json) | Vite, React 19, Router, Query |
| [`examples/src/`](examples/src/) | starter code for the labs |
| [`examples/solutions/`](examples/solutions/) | reference solutions (check after your own attempt) |
