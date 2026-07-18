# 33. Стили: CSS modules, inline, Tailwind (обзор)

## Введение: «Почему кнопка синяя на catalog и красная в cart?»

Shop SPA без design system — каждый разработчик пишет class names по-своему. `.button` в глобальном CSS ломает admin-форму. Tech lead предлагает **CSS Modules** в Vite или **Tailwind** «как в макете Figma». Вам нужно понимать trade-offs, не holy war.

React **не навязывает** styling. Курс mock-exams использует **CSS Modules** в `examples/` + CSS variables для theme из [30-lab-context.md](30-lab-context.md). Tailwind — обзор для собесов и greenfield. Inline styles — точечно.

## Что вы узнаете

- Глобальный CSS vs CSS Modules vs CSS-in-JS (обзор).
- CSS variables + `data-theme`.
- Inline `style` — когда уместен.
- Tailwind utility-first — плюсы, минусы, установка в Vite.
- a11y и focus styles для shop UI.
- Связь со структурой [35-project-structure.md](35-project-structure.md).

---

## Уровни styling в React

```text
index.css (global reset, variables, typography)
    │
    ├── *.module.css (component-scoped)
    ├── Tailwind utilities (className="flex gap-4")
    └── style={{ }} (dynamic rare cases)
```

---

## Глобальный CSS

`src/index.css` — импорт в `main.tsx`:

```tsx
import "./index.css";
```

Подходит для:
- reset / normalize;
- `:root` variables;
- `body`, `#root` layout;
- utility classes `.sr-only`, `.muted`.

**Не** кладите сюда `.card` без namespace — конфликты имён.

### Theme variables (из lab 30)

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

Компоненты используют `var(--color-primary)` — theme switch без перекомпиляции.

---

## CSS Modules

Файл `ProductCard.module.css`:

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

Комponent:

```tsx
import styles from "./ProductCard.module.css";

export function ProductCard({ item }: { item: Item }) {
  return (
    <article className={styles.card}>
      <h3 className={styles.title}>{item.title}</h3>
      <button type="button" className={styles.addButton}>
        В корзину
      </button>
    </article>
  );
}
```

Vite генерирует **уникальные** class names (`ProductCard_card_x7f2a`) — нет коллизий.

### Композиция классов

```tsx
import clsx from "clsx"; // optional dependency

<div className={clsx(styles.card, isFeatured && styles.featured)} />
```

Без библиотеки — template string с осторожностью.

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

**Когда:**
- значение **вычисляется** runtime (progress bar, drag position);
- prototype / story одного свойства.

**Когда нет:**
- вся тема — use CSS variables;
- hover/focus/media — CSS, не inline (нет pseudo в style object).

Inline не поддерживает `:hover` без JS. Performance: OK для единичных свойств; не для всего layout.

---

## Tailwind CSS (обзор)

**Utility-first:** `className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900"`.

### Установка в Vite (справка)

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

Пример ProductCard:

```tsx
<article className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
  <h3 className="text-lg font-semibold">{item.title}</h3>
  <button
    type="button"
    className="mt-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
  >
    В корзину
  </button>
</article>
```

### Плюсы

- Быстрый UI без придумывания имён классов;
- design tokens в config;
- purge/tree-shake неиспользуемых utilities.

### Минусы

- Verbose JSX;
- нужна дисциплина `@apply` / компоненты для повторов;
- команда должна знать conventions.

**mock-exams examples** — Modules; capstone допускает Tailwind по согласованию с командой.

---

## CSS-in-JS (Styled Components, Emotion) — только обзор

Runtime или compile-time styled API:

```tsx
const Button = styled.button`
  background: var(--color-primary);
`;
```

Меньше отдельных файлов; bundle size и SSR нюансы. В react-intermediate — сравнение; basic достаточно знать, что **существует**.

---

## Skeleton и feedback ([31-ui-states.md](31-ui-states.md))

Анимация shimmer — в module или global:

```css
@keyframes shimmer {
  to { background-position: -200% 0; }
}

.skeletonLine {
  composes: /* optional */ ;
  animation: shimmer 1.2s infinite linear;
}
```

`composes` — postcss feature; в чистых Modules — дублируйте или shared utility class в `index.css`.

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

- **Focus visible:** `:focus-visible` на интерактивных элементах, не `outline: none` без замены.
- **Contrast:** WCAG AA для text на `--color-bg`.
- **Touch targets:** min ~44×44px для кнопок cart.
- **`.sr-only`** в global для screen reader only text ([31-ui-states.md](31-ui-states.md)).

---

## Организация файлов

```text
components/
  ProductCard/
    ProductCard.tsx
    ProductCard.module.css
pages/
  CatalogPage.tsx
  CatalogPage.module.css
```

Co-location — стиль рядом с компонентом. Shared tokens — `styles/tokens.css` imported once.

---

## Типичные ошибки

**Global `.button`** — ломает third-party widgets.

**Inline для всего dark theme** — дублирование; use `data-theme` + variables.

**Tailwind без design tokens** — random `p-3` vs `p-4` everywhere.

**Забыли `focus-visible`** — keyboard users lost.

**CSS Modules import default typo** — `styles.card` undefined → no styles, check import.

**z-index wars** — modal/drawer cart: один scale в variables (`--z-modal: 50`).

---

## Резюме

Для react-basic: **global variables + CSS Modules**; inline — dynamic edge cases; Tailwind — знать на собесе. Theme через Context + `data-theme`. Feedback states стилизуйте переиспользуемо. Структура — co-located modules.

## Чек-лист

- [ ] Зачем CSS Modules в Vite
- [ ] Theme через CSS variables
- [ ] Когда inline vs class
- [ ] Tailwind trade-offs одним абзацем
- [ ] focus-visible на кнопках shop

Следующий урок: [34. Лаба: типизированный каталог](34-lab-typescript.md).
