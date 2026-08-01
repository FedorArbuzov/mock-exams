# Next.js — Basic

A deeply detailed **Next.js (App Router)** course for the fullstack shop mock-exams: Server/Client Components, file-based routing, data fetching, Route Handlers, Server Actions, metadata, Docker. **40 lessons** + capstone + interview cheatsheet.

> Start of the JS track: [`javascript-path.md`](../javascript-path.md). **Prerequisites** — [`javascript-basic`](../javascript-basic/README.md), [`typescript-basic`](../typescript-basic/README.md), [`react-basic`](../react-basic/README.md). Next — [`react-intermediate`](../react-intermediate/README.md), [`javascript-testing`](../javascript-path.md).

**Prerequisites:** Node.js **LTS** (20 or 22), solid React (components, hooks, `fetch`), TypeScript (props, async/await). Understanding SPAs from react-basic is the starting point for comparing against SSR.

**Locally:** Next.js in the [`examples/`](examples/package.json) directory. FastAPI backend — from chapter 15; Django admin — in the capstone.

```bash
cd courses/nextjs-basic/examples
npm install
npm run dev          # http://localhost:3000
# in another terminal — FastAPI :8090 (deploy/fastapi)
```

## How to read the chapters

Each lesson is a **complete textbook chapter**, not a cheat sheet. The author moves from a **real working scenario** (a ticket, an SEO bug, "why is the page blank in prod") to concepts, code, and common pitfalls — like in [`javascript-basic`](../javascript-basic/README.md) and [`react-basic`](../react-basic/README.md).

1. **Theory** — "A scenario from work" → explanation → examples → "Common pitfalls" → "Checklist". Restate the checklist **in your own words** before the lab.
2. **Lab** — hands-on in [`examples/`](examples/package.json): `npm run dev`, edits in `app/`, success criteria. The lab **continues the storyline** of the theory.
3. After block 38 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **without peeking** at the chapters.
4. [39-capstone.md](39-capstone.md) — **8–10 hours**, a fullstack "Shop Catalog" with SSR and Route Handlers to `:8090`.

**Time:** **~50–70 minutes** per "theory + lab" pair. The whole course — **~20–24 hours**; the capstone separately.

## Curriculum (40 lessons)

### Phase 1. Environment and first app (00–03)

| # | Lesson |
|---|------|
| 00 | [Environment: create-next-app, dev server](00-environment.md) |
| 01 | [Landscape: SPA, SSR, SSG, Next.js](01-landscape.md) |
| 02 | [App Router: the `app/` directory, layout, page](02-app-router.md) |
| 03 | [Lab: your first Next.js app](03-lab-first-app.md) |

### Phase 2. Routing (04–08)

| 04 | [File-based routing: segments and nesting](04-routing.md) |
| 05 | [Dynamic routes: `[id]`, catch-all, optional](05-dynamic-routes.md) |
| 06 | [Layouts, templates, loading UI](06-layouts-templates.md) |
| 07 | [Lab: catalog and product page](07-lab-routing.md) |
| 08 | [`Link`, `useRouter`, navigation without reload](08-navigation.md) |

### Phase 3. Server and Client Components (09–13)

| 09 | [React Server Components: why and how](09-server-components.md) |
| 10 | [Client Components: `"use client"`, boundaries](10-client-components.md) |
| 11 | [Lab: split the server/client tree](11-lab-rsc-boundary.md) |
| 12 | [Composition: passing children and slots](12-composition-patterns.md) |
| 13 | [Suspense, streaming, skeleton UI](13-suspense-streaming.md) |

### Phase 4. Data fetching on the server (14–18)

| 14 | [`fetch` in Server Components](14-server-fetch.md) |
| 15 | [Lab: product list with FastAPI :8090](15-lab-server-fetch.md) |
| 16 | [Cache, `revalidate`, tags, no-store](16-caching-revalidate.md) |
| 17 | [Parallel requests, `Promise.all`, waterfall](17-parallel-fetch.md) |
| 18 | [Error boundaries: `error.tsx`, `notFound()`](18-error-not-found.md) |

### Phase 5. Route Handlers and BFF (19–23)

| 19 | [Route Handlers: REST in `app/api`](19-route-handlers.md) |
| 20 | [Lab: proxy to FastAPI through Next](20-lab-route-handlers.md) |
| 21 | [Server Actions: forms without a separate API](21-server-actions.md) |
| 22 | [Lab: feedback form](22-lab-server-actions.md) |
| 23 | [Middleware: rewrite, redirect, headers](23-middleware.md) |

### Phase 6. Client-side data and hybrid (24–28)

| 24 | [TanStack Query in Next.js (client islands)](24-tanstack-query.md) |
| 25 | [Lab: cart and mutations on the client](25-lab-client-state.md) |
| 26 | [Cookies, headers, `cookies()` / `headers()`](26-cookies-headers.md) |
| 27 | [Auth patterns: JWT, session (overview)](27-auth-patterns.md) |
| 28 | [Environment variables and config](28-env-config.md) |

### Phase 7. Styles, assets, SEO (29–33)

| 29 | [CSS Modules, Tailwind, global styles](29-styling.md) |
| 30 | [`next/image`, `next/font`, static files](30-images-fonts.md) |
| 31 | [Metadata API: title, OG, sitemap](31-metadata-seo.md) |
| 32 | [Lab: SEO for the product page](32-lab-metadata.md) |
| 33 | [Internationalization (App Router overview)](33-i18n-overview.md) |

### Phase 8. Production and Docker (34–37)

| 34 | [Production build, standalone output](34-production-build.md) |
| 35 | [Docker: multi-stage, `deploy/nextjs`](35-docker-deploy.md) |
| 36 | [Static export vs SSR: when to use which](36-static-export.md) |
| 37 | [Lab: build the image and check health](37-lab-docker.md) |

### Phase 9. Debugging and finale (38–39)

| 38 | [Interview Q&A (top 35)](38-interview-qa.md) |
| 39 | [Capstone: Shop Catalog fullstack](39-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you should end up with

- You can create a **Next.js App Router** project and explain how it differs from a Vite SPA.
- You build **file-based routing** with layouts, dynamic segments, and loading/error UI.
- You separate **Server vs Client Components** without "everything client" or "hooks in a server file."
- You fetch data on the **server** from FastAPI `:8090` and configure **revalidate**.
- You write **Route Handlers** as a BFF and **Server Actions** for forms.
- You use **middleware** for redirects and headers.
- You combine **SSR + client islands** (cart, theme) with TanStack Query.
- You configure **metadata**, `next/image`, and a production **Docker** image.
- You debug common prod bugs and answer interview questions.

## Related courses

| Course | Relation |
|------|-------|
| [`react-basic`](../react-basic/README.md) | components, hooks — Client Components |
| [`react-intermediate`](../react-intermediate/README.md) | auth, MSW, performance |
| [`fastapi`](../../deploy/fastapi/README.md) | shop API `:8090` |
| [`django`](../../deploy/django/README.md) | admin, capstone integration |
| [`api-design`](../api-design/README.md) | REST, BFF, cache |
| [`frontend-architecture`](../javascript-path.md) | SPA vs SSR, BFF |
| [`containers-basic`](../containers-basic/README.md) | Docker for chapter 35 |

## Examples

| Path | Purpose |
|------|------------|
| [`examples/package.json`](examples/package.json) | Next.js 15, App Router, Query |
| [`examples/app/`](examples/app/) | starter code for the labs |
| [`examples/solutions/`](examples/solutions/) | reference solutions (after your own attempt) |
