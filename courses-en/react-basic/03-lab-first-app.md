# 03. Lab: first app

## Why this lab

The theory in [00–02](00-environment.md) explained Vite, JSX, and components. The **lab** turns this into muscle memory: you don't read about HMR — you **save the file** and see the update without pressing F5. At work it's the same cycle: a ticket "add a heading to the shop catalog", a branch, an edit to `App.tsx`, `npm run dev`, a screenshot in the PR.

The goal is not to "copy Hello World" but to get used to:

1. **The `examples/` directory** as a unit of work (git, CI, `npm run build`).
2. **A separate component file** + import in `App.tsx`.
3. **HMR** — fast feedback; a JSX error shows an overlay in the browser immediately.
4. **Typecheck** — `npm run typecheck` catches typos before deployment.

The **shop** domain is minimal for now (a heading, a greeting). The same files will later host a `ProductCard` ([06-lab-props.md](06-lab-props.md)) and data from FastAPI `:8090` ([18-cors-fastapi.md](18-cors-fastapi.md)).

## Prerequisites

- Node **LTS 20+**, having read [00. Environment](00-environment.md) and [02. JSX](02-jsx-components.md).
- You are in **`courses/react-basic/examples/`**:

```bash
cd courses/react-basic/examples
npm install
npm run dev
```

Open the URL from the terminal (usually `http://localhost:5173`). You should see the heading "Shop — react-basic".

Reference solutions — [`examples/solutions/03-first-app/`](examples/solutions/) — **after** your own attempt.

---

## Task 1. A Hello component

**Context:** in the monorepo, each UI block is a separate file for code review and tree-shaking.

Create `src/components/Hello.tsx`:

```tsx
export function Hello() {
  return (
    <section className="hello">
      <h2>Welcome to the shop</h2>
      <p>The mock-exams React client. The API is FastAPI on port 8090.</p>
    </section>
  );
}
```

**Criterion:** the file compiles, uses `className` (not `class`), and has a single root `<section>`.

---

## Task 2. Wire Hello into App

**Context:** `App` is the root of the component tree ([01-landscape.md](01-landscape.md)).

Edit [`src/App.tsx`](examples/src/App.tsx):

```tsx
import { Hello } from "./components/Hello";

export function App() {
  return (
    <main className="app">
      <h1>Shop — react-basic</h1>
      <Hello />
    </main>
  );
}
```

Save the file. **Don't refresh the browser manually** — verify that the text from `Hello` appeared (HMR).

**Criterion:** the page has the h1 heading and the block from `Hello`.

---

## Task 3. An intentional error and the overlay

**Context:** in CI, `vite build` is stricter than "accidentally working" dev.

In `Hello.tsx`, temporarily replace the closing `</section>` with `</div>`. Look at the error overlay in the browser and the message in the Vite terminal.

Restore the correct tag. Run:

```bash
npm run typecheck
```

**In a comment at the top of `Hello.tsx`** (1–2 sentences): why check the build locally and not just dev.

---

## Task 4. A mini shop layout

**Context:** the future catalog header — logo + subtitle.

Add under `<h1>` in `App.tsx`:

```tsx
<p className="app-subtitle">
  Local development · backend optional until lesson 18
</p>
```

In `src/index.css` (optional) add:

```css
.app-subtitle {
  color: #666;
  margin-top: 0;
}
```

Save — make sure the styles were picked up via HMR.

---

## Task 5. Production smoke test

**Context:** before a merge into main, the pipeline runs `npm run build`.

```bash
npm run build
npm run preview
```

Open the preview URL (usually `:4173`). The page should match dev in content.

**Criterion:** `dist/` is created without errors; preview shows Hello.

---

## Success criteria

- [ ] `src/components/Hello.tsx` with a named export
- [ ] `App.tsx` imports and renders `<Hello />`
- [ ] You saw HMR on save (without a full reload)
- [ ] You fixed the intentional JSX error; `npm run typecheck` is green
- [ ] `npm run build` and `preview` succeed

## If something went wrong

| Symptom | Check |
|---------|----------|
| `Failed to resolve import "./components/Hello"` | Does the file exist? Path casing on Linux CI |
| White screen, error in the console | DevTools → Console; often a typo in the export |
| HMR doesn't trigger | Did you save the file? Sometimes restarting `npm run dev` helps |
| `Cannot find module 'react'` | `npm install` in `examples/` |
| Typecheck fails on `className` | Make sure the file is `.tsx`, not `.ts` |

## Relation to the course

| Next step | Why |
|--------------|-------|
| [04. Props](04-props.md) | passing title, price into a card |
| [06. Lab: ProductCard](06-lab-props.md) | a shop component with data |
| [18. CORS and FastAPI](18-cors-fastapi.md) | a live catalog with :8090 |

Next lesson (theory): [04. Props: passing data down](04-props.md).
