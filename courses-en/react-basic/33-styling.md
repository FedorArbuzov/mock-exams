# 33. Styling: CSS modules, inline, Tailwind (overview)

## Introduction: "Why is the button blue on catalog and red in cart?"

The shop SPA has no design system — every developer writes class names their own way. A `.button` in the global CSS breaks the admin form. The tech lead suggests **CSS Modules** in Vite or **Tailwind** "like in the Figma mockup." You need to understand the trade-offs, not a holy war.

React **doesn't dictate** styling. The mock-exams course uses **CSS Modules** in `examples/` + CSS variables for the theme from [30-lab-context.md](30-lab-context.md). Tailwind — an overview for interviews and greenfield. Inline styles — sparingly.

## What you'll learn

- Global CSS vs CSS Modules vs CSS-in-JS (overview).
- CSS variables + `data-theme`.
- Inline `style` — when it's appropriate.
- Tailwind utility-first — pros, cons, install in Vite.
- a11y and focus styles for the shop UI.
- Connection to the structure [35-project-structure.md](35-project-structure.md).

---

## Styling levels in React

```text
index.css (global reset, variables, typography)
    │
    ├── *.module.css (component-scoped)
    ├── Tailwind utilities (className="flex gap-4")
    └── style={{ }} (dynamic rare cases)
```

---

## Global CSS

`src/index.css` — imported in `main.tsx`:

```tsx
import "./index.css";
```

Good for:
- reset / normalize;
- `:root` variables;
- `body`, `#root` layout;
- utility classes `.sr-only`, `.muted`.

**Don't** put `.card` here without a namespace — name conflicts.

### Theme variables (from lab 30)

```css
:root,
[data-theme="light"] {
  --color-bg: #fafafa;
  --color-text: #111;
  --color-primary: #2563eb;
  --radius: 8px;
  --shadow: 0 1px 3px rgb(0 0 0 / 0.1);
}

[data-theme="dark"] {
  --color-bg: #121212;
  --color-text: #eee;
  --color-primary: #60a5fa;
}
```

Components use `var(--color-primary)` — a theme switch without recompilation.

---

## CSS Modules

File `ProductCard.module.css`:

```css
.card {
  background: var(--color-card, #fff);
  border-radius: var(--radius);
  padding: 1rem;
  box-shadow: var(--shadow);
}

.title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.addButton {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  cursor: pointer;
}

.addButton:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

Component:

```tsx
import styles from "./ProductCard.module.css";

export function ProductCard({ item }: { item: Item }) {
  return (
    <article className={styles.card}>
      <h3 className={styles.title}>{item.title}</h3>
      <button type="button" className={styles.addButton}>
        Add to cart
      </button>
    </article>
  );
}
```

Vite generates **unique** class names (`ProductCard_card_x7f2a`) — no collisions.

### Composing classes

```tsx
import clsx from "clsx"; // optional dependency

<div className={clsx(styles.card, isFeatured && styles.featured)} />
```

Without a library — a template string, used carefully.

### Grid catalog

`CatalogPage.module.css`:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}
```

---

## Inline styles

```tsx
<div style={{ width: `${progress}%`, transition: "width 0.3s" }} />
```

**When:**
- the value is **computed** at runtime (progress bar, drag position);
- a prototype / story for a single property.

**When not:**
- the whole theme — use CSS variables;
- hover/focus/media — CSS, not inline (no pseudo in a style object).

Inline doesn't support `:hover` without JS. Performance: OK for individual properties; not for the whole layout.

---

## Tailwind CSS (overview)

**Utility-first:** `className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900"`.

### Install in Vite (reference)

```bash
npm install -D tailwindcss @tailwindcss/vite
```

`vite.config.ts`:

```ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

`index.css`:

```css
@import "tailwindcss";
```

ProductCard example:

```tsx
<article className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
  <h3 className="text-lg font-semibold">{item.title}</h3>
  <button
    type="button"
    className="mt-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
  >
    Add to cart
  </button>
</article>
```

### Pros

- Fast UI without inventing class names;
- design tokens in the config;
- purge/tree-shake of unused utilities.

### Cons

- Verbose JSX;
- needs `@apply` / component discipline for repeats;
- the team must know the conventions.

**mock-exams examples** — Modules; the capstone allows Tailwind if agreed with the team.

---

## CSS-in-JS (Styled Components, Emotion) — overview only

A runtime or compile-time styled API:

```tsx
const Button = styled.button`
  background: var(--color-primary);
`;
```

Fewer separate files; bundle size and SSR nuances. In react-intermediate — a comparison; in basic it's enough to know it **exists**.

---

## Skeleton and feedback ([31-ui-states.md](31-ui-states.md))

The shimmer animation — in a module or global:

```css
@keyframes shimmer {
  to { background-position: -200% 0; }
}

.skeletonLine {
  composes: /* optional */ ;
  animation: shimmer 1.2s infinite linear;
}
```

`composes` — a postcss feature; in pure Modules — duplicate it or use a shared utility class in `index.css`.

---

## Responsive shop layout

```css
/* CatalogPage.module.css */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

Mobile-first: base styles — mobile, `@media (min-width: …)` — desktop.

---

## a11y styling

- **Focus visible:** `:focus-visible` on interactive elements, not `outline: none` without a replacement.
- **Contrast:** WCAG AA for text on `--color-bg`.
- **Touch targets:** min ~44×44px for cart buttons.
- **`.sr-only`** in global for screen-reader-only text ([31-ui-states.md](31-ui-states.md)).

---

## File organization

```text
components/
  ProductCard/
    ProductCard.tsx
    ProductCard.module.css
pages/
  CatalogPage.tsx
  CatalogPage.module.css
```

Co-location — the style next to the component. Shared tokens — `styles/tokens.css` imported once.

---

## Common mistakes

**Global `.button`** — breaks third-party widgets.

**Inline for the whole dark theme** — duplication; use `data-theme` + variables.

**Tailwind without design tokens** — random `p-3` vs `p-4` everywhere.

**Forgetting `focus-visible`** — keyboard users lost.

**CSS Modules import default typo** — `styles.card` undefined → no styles, check the import.

**z-index wars** — modal/drawer cart: one scale in variables (`--z-modal: 50`).

---

## Summary

For react-basic: **global variables + CSS Modules**; inline — dynamic edge cases; Tailwind — know it for interviews. Theme via Context + `data-theme`. Style feedback states reusably. Structure — co-located modules.

## Checklist

- [ ] Why CSS Modules in Vite
- [ ] Theme via CSS variables
- [ ] When inline vs class
- [ ] Tailwind trade-offs in one paragraph
- [ ] focus-visible on shop buttons

Next lesson: [34. Lab: typed catalog](34-lab-typescript.md).
