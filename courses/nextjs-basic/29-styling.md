# 29. Стили: CSS Modules, global CSS, Tailwind в Next.js

## Сценарий с работы: «Стили «утекли» на весь сайт»

Тикет от QA: «На странице товара кнопка `.btn` синяя, а в корзине — тоже синяя, хотя должна быть зелёной. После деплоя на `/catalog` сломалась сетка — класс `.grid` конфликтует с глобальным reset». Вы открываете `components/ProductCard.tsx` и видите `className="card btn primary"`. В Vite SPA вы привыкли к одному `index.css` и utility-классам — в Next.js App Router **границы стилей** другие: global импорт только в layout, локальные — через CSS Modules, Tailwind — через PostCSS pipeline.

Shop mock-exams уже имеет [`globals.css`](examples/app/globals.css) с CSS variables для тёмной темы. Задача — **не сломать** глобальную типографику и header, но изолировать карточки каталога и client island корзины.

Связь с курсом: Client Components ([10-client-components.md](10-client-components.md)) могут импортировать `.module.css`; Server Components — тоже. Env и конфиг ([28-env-config.md](28-env-config.md)) не меняют стили, но Tailwind часто требует `content` paths в `tailwind.config`.

---

## Что вы узнаете

- Где в App Router живут **global** vs **локальные** стили.
- **CSS Modules**: автоматическое scope, composition, `:global()`.
- **Tailwind CSS** в Next.js 15: установка, `globals.css`, `@apply`, dark mode.
- Когда CSS-in-JS (styled-components) **не** default в RSC-мире.
- Как не смешивать три подхода в одном компоненте без системы.

---

## Global CSS: один вход в дереве

В App Router **глобальные** стили импортируются **только** из root `layout.tsx` (или nested layout, если осознанно):

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

**Правило:** reset, typography, CSS variables, `.site-header` — в `globals.css`. Не импортируйте global CSS из произвольного `page.tsx` — Next выдаст ошибку или получите дублирование при HMR.

| Что класть в global | Что **не** класть |
|---------------------|-------------------|
| CSS variables (`--accent`) | Стили одной карточки товара |
| `body`, `a`, `main` layout | `.productTitle` для одного компонента |
| Shared utilities (редко) | BEM-блоки всего каталога без modules |

---

## CSS Modules: локальный scope

Файл `*.module.css` компилируется с **уникальными** именами классов:

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
// components/ProductCard.tsx — Server или Client Component
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

Скомпилированный класс будет вида `ProductCard_card__x7f3a` — **нет коллизий** между `.card` в корзине и в каталоге.

### Composition нескольких классов

```tsx
import styles from "./ProductCard.module.css";
import clsx from "clsx"; // опционально, npm install clsx

<article
  className={clsx(styles.card, isFeatured && styles.featured)}
>
```

Без `clsx` — шаблонные строки: `` `${styles.card} ${styles.featured}` ``.

### `:global()` внутри module

Когда нужно затронуть **вложенный** глобальный элемент (редко):

```css
/* MarkdownContent.module.css */
.prose :global(a) {
  color: var(--accent);
  text-decoration: underline;
}
```

Используйте `:global()` **точечно** — иначе теряете смысл modules.

### TypeScript

Next.js генерирует типы для modules (при `typescript` plugin). Импорт `styles.unknown` — ошибка на этапе компиляции.

---

## Tailwind CSS: utility-first в Next.js

Tailwind — **de facto** стандарт в экосистеме Next. Установка (в `examples/` или новом проекте):

```bash
npm install -D tailwindcss @tailwindcss/postcss postcss
```

Next.js 15 + Tailwind v4 (упрощённый конфиг):

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-shop-accent: #3b82f6;
}
```

Классический v3 путь — `tailwind.config.ts` + `content`:

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
// components/ProductCard.tsx с Tailwind
export function ProductCard({ title, price }: Props) {
  return (
    <article className="rounded-lg border border-shop-surface bg-shop-surface p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-shop-accent tabular-nums">{price.toFixed(2)} ₽</p>
    </article>
  );
}
```

### Tailwind + CSS Modules вместе

Допустимо: module для сложной анимации, Tailwind для layout:

```tsx
<article className={`${styles.cardGlow} flex flex-col gap-2 p-4`}>
```

**Анти-паттерн:** три парадигмы в одном файле без договорённости команды (global BEM + modules + Tailwind arbitrary values).

### Dark mode

| Стратегия | Когда |
|-----------|-------|
| `class` на `<html>` | theme toggle в client island ([25-lab-client-state.md](25-lab-client-state.md)) |
| `prefers-color-scheme` | только системная тема |
| CSS variables в `:root` / `.dark` | уже есть в mock-exams globals |

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

## Стили в Server vs Client Components

| Компонент | CSS Modules | Tailwind | styled-components |
|-----------|-------------|----------|-------------------|
| Server (default) | ✅ import `.module.css` | ✅ className | ⚠️ runtime CSS, осторожно |
| Client (`"use client"`) | ✅ | ✅ | ✅ с registry в layout |

**React Server Components** не отправляют «лишний» JS для static class names — Tailwind и modules идеально ложатся на RSC.

**CSS-in-JS** (Emotion, styled-components): требует client boundary и часто `StyledComponentsRegistry` — для greenfield App Router **не** первый выбор.

---

## Организация файлов в shop-проекте

```text
app/
  globals.css          # reset, variables, @import tailwind
  layout.tsx           # единственный global import
components/
  ui/
    Button.module.css  # или Button.tsx только Tailwind
  catalog/
    ProductCard.module.css
    ProductCard.tsx
features/
  cart/
    CartDrawer.tsx     # client + Tailwind
```

Правило mock-exams: **design tokens** (цвета, spacing) — в CSS variables или `@theme`; компоненты не хардкодят `#3b82f6` в десяти местах.

---

## `@apply` и когда не злоупотреблять

```css
/* globals.css или module */
@layer components {
  .btn-primary {
    @apply rounded-md bg-shop-accent px-4 py-2 font-medium text-white hover:opacity-90;
  }
}
```

`@apply` удобен для **повторяющихся** паттернов (кнопки формы contact). Не дублируйте в `@apply` то, что проще оставить inline Tailwind на JSX — иначе теряете читаемость в DevTools.

---

## Типичные ошибки

**Global `.btn` в `globals.css` для одной страницы** — через неделю `.btn` переопределён в корзине; используйте module или Tailwind component class.

**Импорт `globals.css` в `ProductCard.tsx`** — Next запретит или получите двойной bundle CSS.

**Tailwind `content` не включает `components/`** — классы **вырезаются** при build; в dev иногда «работает», в prod пустые стили.

**Условные className без clsx** — `className={styles.card + isActive && styles.active}` даёт `"cardfalse"`; используйте `clsx` или тернарник.

**Стилизация через inline `style={{}}` для всего layout** — нет pseudo (`:hover`), media queries; только для динамических значений (progress bar width).

**Забыли `"use client"` для framer-motion + styled** — animation library в server file → build error.

**Конфликт specificity** — global `a { color: red }` перебивает module; порядок импорта и `:where()` в reset.

---

## Сравнение подходов (шпаргалка)

| Подход | Плюсы | Минусы |
|--------|-------|--------|
| Global CSS | просто, variables | коллизии имён |
| CSS Modules | изоляция, RSC-friendly | verbose import |
| Tailwind | скорость, consistency | learning curve, длинные className |
| CSS-in-JS | dynamic styles | bundle, RSC friction |

Для mock-exams shop: **globals + (Tailwind или modules)** — практичный default.

---

## Резюме

Next.js не навязывает один способ стилизации, но **App Router** с RSC тянет к **static CSS**: global только из layout, локальность через **CSS Modules**, быстрая вёрстка через **Tailwind**. Держите tokens в variables, изолируйте domain-компоненты (каталог, корзина), не размазывайте `.btn` по `globals.css`.

---

## Чек-лист

- [ ] Где единственное место импорта global CSS
- [ ] Как работает scope в `*.module.css`
- [ ] Зачем `content` в Tailwind config
- [ ] Server Component может импортировать `.module.css`
- [ ] Когда `:global()` в module оправдан
- [ ] Почему CSS-in-JS — не default для RSC

Следующий урок: [30. `next/image`, `next/font`, static files](30-images-fonts.md).
