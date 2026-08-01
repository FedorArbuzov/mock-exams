# 01. The landscape: SPA, SSR, SSG, ISR, and when to choose Next.js

## Intro: a scenario from work

Planning, Thursday. Product pulls up the metrics: **Lighthouse SEO score — 42**, and Google isn't indexing product pages because the SPA serves an empty `<div id="root">` and content only shows up after JS runs. Marketing: "We need Slack/Telegram previews with price and image." Tech lead: "We're on React — do we rewrite in Vue?" Senior engineer: "No, we go with **Next.js**: SSR for the catalog, client islands for the cart."

Coming from [`react-basic`](../react-basic/01-landscape.md), you know **SPA**: Vite, React Router, JSON from FastAPI on `:8090`. The question isn't "React or not" — it's **how to deliver HTML** to users and bots: client-only, per-request server rendering, build-time static, or a hybrid with revalidation.

This chapter is a map of the terminology, no magic involved. By the end, you'll be able to explain at grooming **why** the mock-exams shop is moving from Vite to Next, and **when** SSR is overkill.

## What you'll learn

- **CSR, SSR, SSG, ISR** — what renders, where, and when.
- The pros and cons of each approach for a **shop catalog**.
- A comparison of the **react-basic Vite SPA** vs the **nextjs-basic App Router**.
- Criteria for choosing Next.js vs sticking with an SPA.
- How Next.js 15's App Router fits **React Server Components** into this picture.

## Four models for delivering UI

### CSR — Client-Side Rendering (your react-basic)

The browser loads JS, React mounts, `fetch('/api/v1/items')` fires, and the list gets drawn.

```text
GET /items  →  HTML (empty shell) + app.js
Browser     →  execute JS → fetch API :8090 → render list
```

| Pros | Cons |
|-------|--------|
| Simple static-file deploy (CDN) | Poor SEO without an extra layer |
| Rich interactivity | Slow first contentful paint |
| One language on the client | All data fetching is visible in the Network tab |

This is [`react-basic/examples`](../react-basic/examples/): Vite, port 5173, React Router.

### SSR — Server-Side Rendering

On **every request**, the server (Node) runs React and returns **ready-made HTML** plus the data needed for hydration.

```text
GET /catalog/42  →  Next Server  →  fetch :8090  →  HTML with <h1>Product 42</h1>
Browser          →  hydrate client components (the "Add to cart" button)
```

| Pros | Cons |
|-------|--------|
| SEO, OG tags out of the box | Load on Node for every hit |
| Fast first content | Harder to cache than static |
| API secrets stay on the server | Cold starts in serverless |

### SSG — Static Site Generation

HTML is generated **at `next build` time** and served from a CDN. Good for pages that rarely change.

```text
build time  →  generate /about, /legal  →  static files
request     →  CDN serves the file, no Node involved
```

For **10,000 SKUs** with hourly price updates, pure SSG without ISR is painful: you'd need a rebuild for every change.

### ISR — Incremental Static Regeneration

A hybrid: the page is static, but gets **regenerated** on a timer or on demand (`revalidate: 60`). Users usually get the cached CDN copy, and the data refreshes in the background.

```typescript
// preview — details in chapter 16
export const revalidate = 60;
```

| Model | When to use it for the shop |
|--------|----------------|
| CSR | account area, admin panel behind login |
| SSR | product page with a live price, personalization |
| SSG | landing page, docs, "About us" |
| ISR | catalog, listings with moderate freshness needs |

## Comparison: react-basic vs nextjs-basic

```text
                    react-basic (Vite)          nextjs-basic (App Router)
First HTML          minimal shell               content is in the HTML (RSC/SSR)
Routes              React Router config         app/catalog/page.tsx
Data                useEffect + fetch           async Server Component fetch
SEO                 needs a prerender/SSR addon metadata API, SSR by default
Deploy              dist/ on a CDN              Node or a Vercel-like platform
Dev port            5173                        3000
```

The same **FastAPI :8090** stays the source of truth. What changes is **who** calls the API first: the browser alone (SPA), or the Next server (RSC).

## When Next.js is the right call

**Reach for Next.js (App Router) when:**

- it's a public catalog, blog, or landing page that needs **SEO and social previews**;
- you want a **single** TypeScript full-stack setup (UI + Route Handlers as a BFF);
- the team is already on React — no need to learn a second framework;
- you need **streaming**, Suspense, or server fetches without exposing API keys.

**Stick with a Vite SPA (or add just a prerender step) when:**

- the app sits **entirely behind auth**, and SEO doesn't matter;
- you need extreme offline/PWA support with no Node at the edge;
- the team only deploys **static files** and doesn't want Node in production.

The mock-exams **nextjs-basic** course models a public shop: the catalog gets indexed, the cart is a client island.

## Next.js 15's App Router, in one diagram

```text
Request /catalog/[id]
        │
        ▼
┌───────────────────────────────────────┐
│  Next.js Server (Node)                │
│  ├─ layout.tsx (Server)               │
│  ├─ page.tsx async fetch → :8090      │
│  └─ stream HTML + RSC Flight          │
└───────────────────────────────────────┘
        │
        ▼
Browser hydrates only the "use client" parts (buttons, cart)
```

**React Server Components (RSC)** are components that run on the server by default and never ship to the client bundle. Details in [09-server-components.md](09-server-components.md).

## Terms that trip people up in interviews

| Term | Meaning |
|--------|-------|
| Hydration | React "wakes up" the HTML on the client and attaches listeners |
| RSC | Server Components — rendered on the server, no `useState` |
| Flight | the serialization format used to send the RSC tree over the network |
| Streaming | HTML chunks arrive as they become ready (Suspense) |
| Partial Prerendering (PPR) | an experimental hybrid of a static shell with dynamic holes |

You don't need to memorize PPR for the basics — it's enough to know Next is evolving toward **shipping less JS to the browser**.

## Migrating your mental model from react-basic

| react-basic habit | nextjs-basic equivalent |
|---------------------|---------------------|
| `<BrowserRouter>` | files under `app/` |
| `useEffect(() => fetch…)` | `async function Page()` with a server-side fetch |
| `useState` everywhere | `useState` only inside `"use client"` |
| `vite.config` proxy | Route Handler / env URL (chapters 19–20) |
| loading spinner inside a component | `loading.tsx` + Suspense (chapters 06, 13) |

## FastAPI :8090 in the architecture

```text
┌─────────────┐     JSON      ┌──────────────┐
│  Next :3000 │ ◄────────────►│ FastAPI :8090│
│  (UI + BFF) │               │  shop API    │
└─────────────┘               └──────────────┘
```

Next can call it three ways:

1. **Server Component** — `fetch('http://localhost:8090/api/v1/items')` on the server.
2. **Client Component** — `fetch` from the browser (we'll set up CORS later).
3. **Route Handler** — `app/api/.../route.ts` proxies to FastAPI.

## Common pitfalls

**"SSR is always slower than an SPA."** SSR adds a round trip to Node, but the user sees content **sooner** — an SPA has to wait for JS plus a fetch. Compare **LCP**, not just TTFB.

**"Next replaces FastAPI."** Next is the **UI and BFF**; business logic and the database stay in the API ([`deploy/fastapi`](../../deploy/fastapi/README.md)).

**"SSG and ISR are the same thing."** SSG is fixed at build time; ISR updates after deploy without a full rebuild.

**"Next has no SPA-style navigation."** `<Link>` gives you a **client-side transition** without a full reload — soft navigation ([08-navigation.md](08-navigation.md)).

**"Admin panels need SSR."** Usually CSR plus auth is enough; SSR is for **public** URLs.

## Summary

**CSR (Vite SPA)** — react-basic's approach: simple, interactive, weak SEO out of the box. **Next.js App Router** adds **server-first** rendering, file-based routing, and a hybrid of SSG/ISR/SSR. The mock-exams shop chooses Next for the catalog and metadata, while keeping FastAPI as the API layer.

## Checklist

- [ ] You can explain CSR, SSR, SSG, and ISR using the product page as an example
- [ ] You named 2 reasons the shop is moving from Vite to Next
- [ ] You understand that RSC means rendering on the server, not a separate "language"
- [ ] You know :8090 stays the backend, and Next runs on :3000
- [ ] You can say when an SPA still makes sense

Next lesson: [02. App Router: the `app/` directory, layout, and page](02-app-router.md).
