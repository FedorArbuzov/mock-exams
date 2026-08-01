# 29. Styling: CSS Modules, global CSS, Tailwind in Next.js

## A scenario from work: "The styles 'leaked' across the whole site"

A ticket from QA: "On the product page the `.btn` button is blue, and in the cart it's blue too, though it should be green. After the deploy, the grid on `/catalog` broke — the `.grid` class conflicts with the global reset." You open `components/ProductCard.tsx` and see `className="card btn primary"`. In a Vite SPA you got used to one `index.css` and utility classes — in the Next.js App Router the **style boundaries** are different: global import only in the layout, local styles via CSS Modules, Tailwind via the PostCSS pipeline.

The mock-exams shop already has [`globals.css`](examples/app/globals.css) with CSS variables for the dark theme. The task is to **not break** the global typography and header, but to isolate the catalog cards and the client cart island.

Relation to the course: Client Components ([10-client-components.md](10-client-components.md)) can import `.module.css`; Server Components too. Env and config ([28-env-config.md](28-env-config.md)) don't change styles, but Tailwind often requires `content` paths in `tailwind.config`.

---

## What you'll learn

- Where **global** vs **local** styles live in the App Router.
- **CSS Modules**: automatic scope, composition, `:global()`.
- **Tailwind CSS** in Next.js 15: installation, `globals.css`, `@apply`, dark mode.
- When CSS-in-JS (styled-components) is **not** the default in the RSC world.
- How not to mix three approaches in one component without a system.

---

## Global CSS: a single entry in the tree

In the App Router, **global** styles are imported **only** from the root `layout.tsx` (or a nested layout, if done deliberately):

```tsx
// app/layout.tsx
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
```

```css
/* app/globals.css */
:root {
  --bg: #0f1419;
  --surface: #1a2332;
  --text: #e7ecf3;
  --accent: #3b82f6;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
}
```

**Rule:** reset, typography, CSS variables, `.site-header` — in `globals.css`. Don't import global CSS from an arbitrary `page.tsx` — Next will throw an error, or you'll get duplication on HMR.

| What to put in global | What **not** to put |
|---------------------|-------------------|
| CSS variables (`--accent`) | Styles for a single product card |
| `body`, `a`, `main` layout | `.productTitle` for one component |
| Shared utilities (rarely) | BEM blocks for the whole catalog without modules |

---

## CSS Modules: local scope

A `*.module.css` file is compiled with **unique** class names:

```css
/* components/ProductCard.module.css */
.card {
  background: var(--surface);
  border: 1px solid var(--border, #2d3a4f);
  border-radius: 8px;
  padding: 1rem;
}

.title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.price {
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}
```

```tsx
// components/ProductCard.tsx — Server or Client Component
import styles from "./ProductCard.module.css";

type Props = { title: string; price: number };

export function ProductCard({ title, price }: Props) {
  return (
    <article className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.price}>{price.toFixed(2)} ₽</p>
    </article>
  );
}
```

The compiled class will look like `ProductCard_card__x7f3a` — **no collisions** between `.card` in the cart and in the catalog.

### Composing multiple classes

```tsx
import styles from "./ProductCard.module.css";
import clsx from "clsx"; // optional, npm install clsx

<article
  className={clsx(styles.card, isFeatured && styles.featured)}
>
```

Without `clsx` — template strings: `` `${styles.card} ${styles.featured}` ``.

### `:global()` inside a module

When you need to affect a **nested** global element (rarely):

```css
/* MarkdownContent.module.css */
.prose :global(a) {
  color: var(--accent);
  text-decoration: underline;
}
```

Use `:global()` **surgically** — otherwise you lose the point of modules.

### TypeScript

Next.js generates types for modules (with the `typescript` plugin). Importing `styles.unknown` — a compile-time error.

---

## Tailwind CSS: utility-first in Next.js

Tailwind is the **de facto** standard in the Next ecosystem. Installation (in `examples/` or a new project):

```bash
npm install -D tailwindcss @tailwindcss/postcss postcss
```

Next.js 15 + Tailwind v4 (simplified config):

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-shop-accent: #3b82f6;
}
```

The classic v3 approach — `tailwind.config.ts` + `content`:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        shop: {
          surface: "#1a2332",
          accent: "#3b82f6",
        },
      },
    },
  },
};

export default config;
```

```tsx
// components/ProductCard.tsx with Tailwind
export function ProductCard({ title, price }: Props) {
  return (
    <article className="rounded-lg border border-shop-surface bg-shop-surface p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-shop-accent tabular-nums">{price.toFixed(2)} ₽</p>
    </article>
  );
}
```

### Tailwind + CSS Modules together

Acceptable: a module for a complex animation, Tailwind for layout:

```tsx
<article className={`${styles.cardGlow} flex flex-col gap-2 p-4`}>
```

**Anti-pattern:** three paradigms in one file without a team agreement (global BEM + modules + Tailwind arbitrary values).

### Dark mode

| Strategy | When |
|-----------|-------|
| `class` on `<html>` | theme toggle in a client island ([25-lab-client-state.md](25-lab-client-state.md)) |
| `prefers-color-scheme` | system theme only |
| CSS variables in `:root` / `.dark` | already present in the mock-exams globals |

```tsx
// Client theme toggle
document.documentElement.classList.toggle("dark");
```

```css
.dark {
  --bg: #0f1419;
}
```

Tailwind `dark:` prefix: `className="bg-white dark:bg-shop-surface"`.

---

## Styles in Server vs Client Components

| Component | CSS Modules | Tailwind | styled-components |
|-----------|-------------|----------|-------------------|
| Server (default) | ✅ import `.module.css` | ✅ className | ⚠️ runtime CSS, be careful |
| Client (`"use client"`) | ✅ | ✅ | ✅ with a registry in the layout |

**React Server Components** don't ship "extra" JS for static class names — Tailwind and modules fit RSC perfectly.

**CSS-in-JS** (Emotion, styled-components): requires a client boundary and often a `StyledComponentsRegistry` — for greenfield App Router it's **not** the first choice.

---

## File organization in the shop project

```text
app/
  globals.css          # reset, variables, @import tailwind
  layout.tsx           # the only global import
components/
  ui/
    Button.module.css  # or Button.tsx with Tailwind only
  catalog/
    ProductCard.module.css
    ProductCard.tsx
features/
  cart/
    CartDrawer.tsx     # client + Tailwind
```

The mock-exams rule: **design tokens** (colors, spacing) — in CSS variables or `@theme`; components don't hardcode `#3b82f6` in ten places.

---

## `@apply` and when not to overuse it

```css
/* globals.css or a module */
@layer components {
  .btn-primary {
    @apply rounded-md bg-shop-accent px-4 py-2 font-medium text-white hover:opacity-90;
  }
}
```

`@apply` is handy for **repeated** patterns (the contact form buttons). Don't duplicate in `@apply` what's simpler to leave as inline Tailwind on the JSX — otherwise you lose readability in DevTools.

---

## Common mistakes

**A global `.btn` in `globals.css` for one page** — a week later `.btn` is overridden in the cart; use a module or a Tailwind component class.

**Importing `globals.css` in `ProductCard.tsx`** — Next will forbid it, or you'll get a double CSS bundle.

**Tailwind `content` doesn't include `components/`** — the classes are **stripped** at build; in dev it sometimes "works", in prod the styles are empty.

**Conditional className without clsx** — `className={styles.card + isActive && styles.active}` produces `"cardfalse"`; use `clsx` or a ternary.

**Styling the whole layout via inline `style={{}}`** — no pseudo (`:hover`), no media queries; only for dynamic values (progress bar width).

**Forgetting `"use client"` for framer-motion + styled** — an animation library in a server file → build error.

**Specificity conflict** — a global `a { color: red }` overrides a module; import order and `:where()` in the reset.

---

## Comparison of approaches (cheat sheet)

| Approach | Pros | Cons |
|--------|-------|--------|
| Global CSS | simple, variables | name collisions |
| CSS Modules | isolation, RSC-friendly | verbose imports |
| Tailwind | speed, consistency | learning curve, long className |
| CSS-in-JS | dynamic styles | bundle, RSC friction |

For the mock-exams shop: **globals + (Tailwind or modules)** — a practical default.

---

## Summary

Next.js doesn't force one styling approach, but the **App Router** with RSC leans toward **static CSS**: global only from the layout, locality via **CSS Modules**, fast markup via **Tailwind**. Keep tokens in variables, isolate domain components (catalog, cart), and don't smear `.btn` across `globals.css`.

---

## Checklist

- [ ] Where is the single place to import global CSS
- [ ] How scope works in `*.module.css`
- [ ] Why `content` is needed in the Tailwind config
- [ ] A Server Component can import `.module.css`
- [ ] When `:global()` in a module is justified
- [ ] Why CSS-in-JS isn't the default for RSC

Next lesson: [30. `next/image`, `next/font`, static files](30-images-fonts.md).
