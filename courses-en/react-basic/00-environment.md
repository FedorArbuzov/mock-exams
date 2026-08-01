# 00. Environment: Vite, React, DevTools

## Introduction: "It's a blank white screen on my machine"

It's Tuesday. You've just cloned the shop-frontend repo, run `npm install`, `npm run dev` — and the browser shows a **blank white page**, with a wall of red `Uncaught SyntaxError` in the console. A colleague says: "Works fine for me, are you sure you're on Node 20?" DevOps reports that CI's `vite build` fails on `Cannot find module '@/components/Button'`. Three symptoms, three different layers: the **Node runtime**, the **Vite dev server**, and the **browser + React**.

In [`javascript-basic`](../javascript-basic/00-environment.md) you learned to run `node script.js`. A React app is **not a single file**: `.tsx` sources get compiled on the fly, modules are resolved by a bundler, and the UI mounts into the DOM via `createRoot`. Without a mental map of the environment, every lesson starts to feel like "Vite magic."

In mock-exams, the React client talks to the shop API on FastAPI [`deploy/fastapi`](../../deploy/fastapi/README.md) **:8090**. For now it's enough to run **just** the frontend in `examples/`; we'll wire up the backend in chapter 18.

## What you'll learn

- Why **Vite** beats "bare HTML + script tag" for React.
- How the **edit → HMR → browser** cycle works.
- The structure of the **`examples/`** directory and the `npm run dev` / `build` scripts.
- **Node LTS**, `npm install`, and common version issues.
- The basics of **React DevTools** — where to look when "nothing renders."

## Why Vite instead of a React CDN

You could load React via `<script src="unpkg.com/react">` — that's how it was done in 2018. Fine for a one-off teaching page. For a shop SPA with TypeScript, dozens of components, React Router, and TanStack Query — **not fine**:

| Approach | Pros | Cons for this course |
|--------|-------|------------------|
| CDN + Babel in browser | zero setup | slow, no TS, no tree-shaking |
| Create React App (legacy) | familiar | deprecated, slow dev |
| **Vite** | fast HMR, TS out of the box | requires Node |

In dev mode, **Vite** serves ES modules straight to the browser; it transforms TypeScript and JSX via **esbuild**. The production build uses Rollup. Same stack as in [`typescript-basic`](../typescript-basic/01-landscape.md) and the upcoming `react-intermediate`.

## Installation and first run

### Requirements

- **Node.js LTS 20+** (or 22). Check with: `node --version`.
- npm ships with Node; pnpm/yarn are alternatives (this course uses npm).

### The examples directory

```bash
cd courses/react-basic/examples
npm install
npm run dev
```

Open the URL printed in the terminal (usually `http://localhost:5173`). You should see the heading "Shop — react-basic".

| Command | Purpose |
|---------|------------|
| `npm run dev` | dev server + HMR |
| `npm run build` | production bundle into `dist/` |
| `npm run preview` | local preview of `dist/` |
| `npm run typecheck` | `tsc` with no emit |

### What happens on `npm run dev`

```text
main.tsx  →  import App  →  createRoot(#root).render(<App />)
                │
                ▼
         Vite transforms .tsx → JS
                │
                ▼
         The browser executes the modules, React draws the DOM
```

The file [`examples/src/main.tsx`](examples/src/main.tsx) is the **entry point**. [`App.tsx`](examples/src/App.tsx) is the root component. [`index.html`](examples/index.html) contains `<div id="root">` — a container, **not** a place to hand-write JSX.

## StrictMode and the double render

In `main.tsx`, there's a `<StrictMode>` wrapper:

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

In **development**, React 18+ **deliberately** mounts components twice, to surface side effects that lack cleanup. This is **not a bug** and **doesn't** happen in the production build. If you see a duplicate `fetch` inside a `useEffect` without cleanup — StrictMode just caught the problem before it reached production ([14-useEffect.md](14-useEffect.md)).

## Proxying to FastAPI :8090

[`vite.config.ts`](examples/vite.config.ts) sets up a proxy:

```typescript
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8090",
      changeOrigin: true,
    },
  },
},
```

From the frontend you can call `fetch("/api/v1/items")` and Vite will forward it to the backend. This sidesteps CORS in dev without touching FastAPI on every machine. More on this in [18-cors-fastapi.md](18-cors-fastapi.md).

## React DevTools

The [React Developer Tools](https://react.dev/learn/react-developer-tools) extension for Chrome/Firefox:

- **Components** tab — the component tree, props, hooks state;
- **Profiler** tab — who re-rendered unnecessarily (overview here; deeper dive in react-intermediate).

If the tree is empty, React never mounted: check **Console** and **Network** — don't guess.

## Common mistakes

**"Blank screen, no errors."** Usually `#root` wasn't found, or `main.tsx` isn't wired into `index.html`. Check Elements: is there anything inside `#root`?

**"Cannot find module '@/…'".** The `@` alias → `src/` is set in `vite.config.ts` and `tsconfig.json`. Your IDE should pick up the `paths`; after cloning, run `npm install`.

**"Port 5173 is in use."** Vite will offer a different port — use it, or free up the port.

**"Works for my colleague, not for me."** Compare `node --version`, delete `node_modules`, and run `npm install` again.

**Editing a file, but the browser doesn't update.** HMR occasionally "breaks" after a syntax error — save the file again or reload the page (F5).

## How this connects to the course

| Lesson | Connection |
|------|-------|
| [01. The landscape](01-landscape.md) | why React and SPAs |
| [02. JSX](02-jsx-components.md) | your first component |
| [`javascript-basic/00`](../javascript-basic/00-environment.md) | Node on the host |
| [`typescript-basic/00`](../typescript-basic/00-environment.md) | tsc + tsx |

## Checklist

- [ ] `npm run dev` gets the app running on localhost
- [ ] You know where the entry point (`main.tsx`) and the UI root (`App.tsx`) are
- [ ] You understand why `StrictMode` produces a "double" effect in dev
- [ ] React DevTools is installed
- [ ] You know about the `/api` → `:8090` proxy

Next lesson: [01. The landscape: SPA, React, Virtual DOM](01-landscape.md).
