# 00. Environment: create-next-app, the dev server, Next.js vs Vite

## Intro: a scenario from work

Monday, 10:00 AM. The tech lead posts in Slack: "We're moving the shop catalog from a Vite SPA to Next.js — we need SSR for SEO and a fast first paint." You clone the repo, cd into `courses/nextjs-basic/examples/`, run `npm install`, `npm run dev` — the terminal shows a green `Ready on http://localhost:3000`, but the browser shows a **404** on `/catalog`, because the page doesn't exist yet. A colleague from react-basic asks: "Why isn't it `5173`, like Vite? And where's `main.tsx`?" DevOps hits a wall in CI: `next build` fails with `Module not found: Can't resolve '@/components/Header'`. Three symptoms, three layers: **Node runtime**, the **Next dev server**, and the **App Router structure**.

In the [`react-basic`](../react-basic/00-environment.md) course you ran Vite on port **5173**: entry point `main.tsx`, `createRoot`, React Router. Next.js is **not a React replacement** — it's a **framework built on top of React** with file-based routing, server rendering, and a built-in bundler (Turbopack in dev, Webpack/Turbopack in prod). Without a map of the environment, every lesson turns into "Next.js magic."

In mock-exams, the Next.js client will talk to the shop API on FastAPI [`deploy/fastapi`](../../deploy/fastapi/README.md) on **:8090**. For now it's enough to run **just** the frontend in `examples/` on **:3000**; we'll wire up the backend in chapter 15.

## What you'll learn

- How to create and run a **Next.js 15 App Router** project via `create-next-app` and the `examples/` directory.
- The **edit → Fast Refresh → browser** cycle, and how it differs from Vite's HMR.
- Why the dev server listens on **port 3000** instead of 5173.
- A comparison of **Next.js vs Vite + React** for the mock-exams shop catalog.
- The `npm run dev` / `build` / `start` / `typecheck` scripts.
- Common Node version pitfalls and the "blank screen" on first run.

## Next.js vs Vite + React: why a second stack

In [`react-basic`](../react-basic/README.md) you built an **SPA**: one HTML file, one JS bundle, React Router swapping the URL on the client. Great for an admin panel or internal tools. For a **public-facing catalog** with SEO, Open Graph previews, and a fast first contentful paint, the product often picks **Next.js**:

| Aspect | Vite + React (react-basic) | Next.js App Router (nextjs-basic) |
|--------|---------------------------|-----------------------------------|
| Entry point | `src/main.tsx` + `index.html` | `app/layout.tsx` + `app/page.tsx` |
| Routes | React Router (`<Routes>`) | **File-based**: folder `app/catalog/page.tsx` → `/catalog` |
| Default rendering | Client only (CSR) | **Server Components** + optional client |
| Dev port | 5173 | **3000** |
| Dev server | Vite (esbuild) | Next (Turbopack / Webpack) |
| Production | static files in `dist/` | `next build` → Node server or static export |
| API proxy | `vite.config.ts` proxy | Route Handlers, rewrite (chapters 19–20) |

Next.js **includes** React 19 — the same components, hooks, and JSX. What changes is **where** the code runs (server vs browser) and **how** navigation works.

```text
react-basic (Vite SPA):
  Browser ──GET /──► static JS ──► React mounts #root ──► fetch /api → :8090

nextjs-basic (App Router):
  Browser ──GET /catalog──► Next Server ──► HTML + RSC payload ──► hydration of client islands
                                    └──► fetch to :8090 on the server (chapter 14)
```

## Installation and first run

### Requirements

- **Node.js LTS 20+** (or 22). Check with: `node --version`.
- npm ships with Node; we use npm throughout the course.
- You've completed [`javascript-basic`](../javascript-basic/README.md), [`typescript-basic`](../typescript-basic/README.md), and [`react-basic`](../react-basic/README.md).

### The examples directory (already set up in the repo)

```bash
cd courses/nextjs-basic/examples
npm install
npm run dev
```

Open **http://localhost:3000**. You should see the heading "Shop — nextjs-basic" and a Shop / Catalog / Contact nav in the header.

| Command | Purpose |
|---------|------------|
| `npm run dev` | dev server + Fast Refresh (port **3000**) |
| `npm run build` | production build into `.next/` |
| `npm run start` | run the production server after `build` |
| `npm run typecheck` | `tsc --noEmit`, no build |
| `npm run lint` | ESLint via `next lint` |

### Creating a new project from scratch (for reference)

If you were starting a project outside mock-exams:

```bash
npx create-next-app@latest my-shop \
  --typescript \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

The `--app` flag enables the **App Router** (not the legacy Pages Router). In this course, the `@/*` alias points to the project root; the reference is [`examples/tsconfig.json`](examples/tsconfig.json).

### What happens on `npm run dev`

```text
next dev
    │
    ▼
Compiles app/layout.tsx, app/page.tsx
    │
    ▼
HTTP :3000 — route / → app/page.tsx
    │
    ▼
Fast Refresh on saving a .tsx file (preserves client component state where possible)
```

Unlike Vite, there's **no** separate `index.html` with a `<div id="root">`. Next generates the HTML shell itself from [`app/layout.tsx`](examples/app/layout.tsx).

## Structure of examples/

```text
examples/
├── app/
│   ├── layout.tsx      ← root layout (html, body, header)
│   ├── page.tsx        ← route /
│   └── globals.css
├── next.config.ts
├── package.json
├── tsconfig.json
└── .env.example        ← NEXT_PUBLIC_API_URL (chapter 28)
```

Compare with react-basic:

```text
react-basic/examples/src/
├── main.tsx            ← createRoot
├── App.tsx
└── components/
```

In Next, **the route is the file system** under `app/`. Details in [02-app-router.md](02-app-router.md).

## Port 3000 and FastAPI :8090

| Service | Port | When you need it |
|--------|------|-------------|
| Next.js dev | **3000** | always, throughout this course |
| FastAPI shop API | **8090** | from chapter 15 (server fetch) |
| Vite (react-basic) | 5173 | a parallel course — don't mix them up |

Two terminals on the same machine:

```bash
# Terminal 1 — Next
cd courses/nextjs-basic/examples && npm run dev

# Terminal 2 — FastAPI (later)
cd deploy/fastapi && ...  # see the fastapi README
```

Until the API is wired up, pages show placeholder text — that's expected.

## Fast Refresh vs Vite HMR

Both give you updates without a full reload. In practice:

- **Vite HMR** — hot-replaces ES modules; shows an overlay on a syntax error in `.tsx`.
- **Next Fast Refresh** — rebuilds the affected route segment; Server Components are re-fetched from the server when a server file changes.

If the UI gets "stuck" after an error — hit **F5** or restart `npm run dev`.

## TypeScript and Next.js 15

[`examples/package.json`](examples/package.json) pins Next **15.1+** and React **19**. The App Router **natively** understands `.tsx`, async Server Components, and typed `metadata`. The TypeScript patterns from [`typescript-basic`](../typescript-basic/README.md) (props types, `Readonly<{ children }>`) show up in every layout and page.

## Continuity with previous courses

| Course | What carries over into Next |
|------|------------------------|
| javascript-basic | modules, async/await, fetch |
| typescript-basic | prop types, strict mode |
| react-basic | JSX, components, hooks → **Client Components** |
| react-basic/23 | React Router → **file-based routing** in Next |

## Common pitfalls

**"Cannot find module 'next'."** You didn't run `npm install` in `examples/`, or you're in the monorepo root instead of the course directory.

**"Port 3000 is already in use."** Another Next process or something else grabbed the port. Free it up, or: `npm run dev -- -p 3001` (though in this course we'll stick with 3000).

**"I'm looking for main.tsx — it's not here."** The App Router doesn't use `createRoot` manually. The root is `app/layout.tsx`.

**"404 on /catalog."** That page shows up after [03-lab-first-app.md](03-lab-first-app.md) or [07-lab-routing.md](07-lab-routing.md).

**"It works for my colleague, but I get a blank screen."** Compare `node --version` (≥20), delete `node_modules` and `.next`, then `npm install && npm run dev` again.

**"I keep mixing this up with Vite: I edit a file and the port is 5173."** Make sure your terminal is in `nextjs-basic/examples`, not `react-basic/examples`.

## Checklist

- [ ] `npm run dev` brings up the app at **http://localhost:3000**
- [ ] You know where the root layout (`app/layout.tsx`) and home page (`app/page.tsx`) live
- [ ] You can explain the difference between Next and a Vite SPA in one paragraph
- [ ] You understand that FastAPI :8090 gets wired up later, not in lesson 00
- [ ] `npm run typecheck` passes cleanly on the starter code

Next lesson: [01. The landscape: SPA, SSR, SSG, ISR, and when to use Next.js](01-landscape.md).
