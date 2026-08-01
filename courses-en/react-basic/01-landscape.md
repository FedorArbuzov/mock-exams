# 01. The landscape: SPA, React, Virtual DOM

## Introduction: "Rewrite the admin panel in React, or keep the Django templates?"

At grooming, product shows a mockup: catalog filters, a cart that doesn't reload the page, live search. The tech lead asks: "SPA in React, or server-rendered Django?" The junior answers: "React is faster because of the Virtual DOM." The reviewer nods, unconvinced — and neither are you, really, ready to spell out **exactly** what problem React solves, **how** an SPA differs from a multi-page app, and **why** the Virtual DOM isn't about "DOM speed" in a vacuum.

After [`javascript-basic`](../javascript-basic/01-landscape.md) you know JS and the event loop. React is a **UI library**, not a language and not a replacement for HTTP. It answers the question: "how do I describe the interface as a function of data, and update the page **safely** when that data changes."

## What you'll learn

- **MPA vs SPA** — where React sits in the mock-exams shop architecture.
- What a **component** is, and what "declarative UI" means.
- **Virtual DOM** and reconciliation — an intuitive model, no myths.
- **React 19** and function components + hooks (the only style used in this course).
- Where React sits between **FastAPI :8090** and the browser.

## MPA vs SPA

**Multi-Page Application (MPA):** every link click triggers a **full** HTML reload from the server (classic Django templates, PHP). The server "draws" the page.

**Single Page Application (SPA):** the browser loads a JS bundle once; further "navigation" is just a change of **state** and **components**, with no full reload (React Router changes the URL and the UI tree).

```text
MPA:  Browser ──GET /items──► Django ──HTML──► Browser (new page)

SPA:  Browser ──GET /──► CDN/static ──JS bundle──► Browser
      Browser ──GET /api/v1/items──► FastAPI ──JSON──► React renders the list
      Click "Product #5" ──► Router ──► a different component, URL changes, no full HTML reload
```

| | MPA | SPA (React) |
|---|-----|-------------|
| First byte | usually shows content sooner | waiting on JS |
| Interactivity after load | full reload | local updates |
| SEO (without SSR) | simpler | needs SSR/SSG (Next — later) |
| Backend | HTML + forms | **JSON API** (FastAPI) |

In mock-exams, **react-basic** is a client for a **REST JSON** API on `:8090`. Django `:8092` is an alternative backend for the capstone in react-intermediate.

## Declarative UI: describing "how it should be"

**Imperative** (vanilla JS):

```javascript
const ul = document.getElementById("list");
ul.innerHTML = "";
for (const item of items) {
  const li = document.createElement("li");
  li.textContent = item.title;
  ul.appendChild(li);
}
```

**Declarative** (React — a preview):

```tsx
function ItemList({ items }: { items: { title: string }[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.title}>{item.title}</li>
      ))}
    </ul>
  );
}
```

You describe **UI = f(state, props)**. When `items` changes, React reconciles the DOM **for you**. Fewer manual `appendChild` calls means fewer "forgot to remove the old node" bugs.

## Components and the tree

The UI is a **tree of components**. A component is a function (or a class — we **don't** teach classes):

```tsx
function ProductCard({ title, price }: { title: string; price: number }) {
  return (
    <article>
      <h2>{title}</h2>
      <p>{price.toFixed(2)} €</p>
    </article>
  );
}
```

The root is `<App />`, and inside it: layout, lists, forms. Data flows **down** through props ([04-props.md](04-props.md)); events and state flow up, or through hooks/context.

## Virtual DOM and reconciliation

React keeps a **lightweight description** of the UI (the Virtual DOM — a tree of objects describing "which tag, which props, which children"). When state changes:

1. Render runs → a new VDOM tree.
2. It's **diffed** against the old tree (reconciliation).
3. **Commit** — the minimal set of changes is applied to the **real** DOM.

Myth: "the Virtual DOM is always faster than manual DOM manipulation." Reality: React saves **your** time and cuts out a whole class of bugs; for a 10,000-row table you still need virtualization and memoization ([27-ref-memo-callback.md](27-ref-memo-callback.md)).

**Keys** in lists help the diff figure out **which** element was added or removed ([07-lists-keys.md](07-lists-keys.md)).

## One-way data flow

```text
       props ↓
  Parent ──────► Child
       ↑
   callbacks / setState
```

State lives in the component that owns it. Children **don't mutate** props. If two siblings need the same data — **lift the state up** ([12-lifting-state.md](12-lifting-state.md)) or use Context ([29-context.md](29-context.md)).

This is a deliberate design choice: it's easier to debug than two-way binding à la Angular 1.x.

## React in the mock-exams ecosystem

| Layer | Technology | Course |
|------|------------|------|
| API | FastAPI :8090 | fastapi |
| Contract | OpenAPI, JSON | api-design |
| UI client | React + Vite | **react-basic** |
| Types | TypeScript | typescript-basic |
| Request cache | TanStack Query | [20-tanstack-query.md](20-tanstack-query.md) |
| Routes | React Router | [23-react-router.md](23-react-router.md) |

The domain running through all of it is **shop**: products, cart, filters — the same entities as in the FastAPI capstone and the javascript Task Tracker, just with an HTTP UI on top.

## React 19 and hooks-only

This course uses **function components** and hooks (`useState`, `useEffect`, …). Class components with `this.setState` are legacy; you'll run into them in older codebases, but new code uses hooks.

React 19 improves concurrent rendering and adds `use` (async resources) — we'll mention it in passing; the core patterns in this course are compatible with 18+.

## Common misconceptions

**"React is a frontend framework like Angular."** React is a **view library**. Routing, the data layer, forms — those are separate packages (Router, Query).

**"You need React for any page."** A landing page with three static sections and no interactivity is often better served by plain HTML/CSS or a Django template.

**"The Virtual DOM replaces the DOM API."** Under the hood it's still the browser DOM; React just orchestrates the updates.

**"An SPA doesn't need a backend."** An SPA actually depends **more heavily** on the API: without `:8090` there's nothing to show besides static assets.

## Summary

React helps you build **SPAs**: a UI as a tree of components, updated through **state** and declarative rendering. Virtual DOM + reconciliation minimize manual DOM work. In mock-exams, React is a **thin client** for the FastAPI shop API; next up: JSX, props, hooks.

## Checklist

- [ ] Explain the difference between MPA and SPA using the shop catalog as an example
- [ ] What does "declarative UI" mean
- [ ] Why keys matter in lists (preview)
- [ ] Where React fits into the mock-exams architecture
- [ ] Why this course teaches hooks, not class components

Next lesson: [02. JSX and function components](02-jsx-components.md).
