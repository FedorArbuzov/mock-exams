# 30. Assets: `next/image`, `next/font`, каталог `public/`

## Сценарий с работы: «Lighthouse — 4 MB на главной»

Product owner открывает PageSpeed: «Hero-картинка 2.1 MB JPEG, шрифты блокируют render 800 ms, иконки лежат в `src/assets` — в prod 404». В Vite вы делали `import logo from './logo.png'`. В Next.js **статика** делится на три слоя: **`public/`** (URL as-is), **импортированные assets** (webpack/turbopack hash), **`next/image`** и **`next/font`** (оптимизация из коробки).

Для shop catalog на SSR ([14-server-fetch.md](14-server-fetch.md)) картинки товаров приходят с FastAPI `:8090` или CDN — `next/image` требует **`remotePatterns`**. Шрифты Inter для кириллицы — через `next/font/google` без layout shift.

---

## Что вы узнаете

- Каталог **`public/`**: что класть и как ссылаться.
- **`next/image`**: `fill`, `sizes`, priority, remote images, placeholder.
- **`next/font`**: local и Google fonts, `variable`, subset.
- Разница import asset vs `public/` vs external URL.
- Ошибки CLS (Cumulative Layout Shift) и как их закрыть.

---

## Каталог `public/`

Всё в `public/` доступно по **корневому URL**:

```text
public/
  favicon.ico          → /favicon.ico
  robots.txt           → /robots.txt
  images/
    placeholder.svg    → /images/placeholder.svg
  og-default.png       → /og-default.png
```

```tsx
// Не import — прямой path
<img src="/images/placeholder.svg" alt="" /> // legacy HTML

// Предпочтительно next/image для raster
import Image from "next/image";

<Image src="/images/placeholder.svg" alt="Нет фото" width={200} height={150} />
```

| В `public/` | Не в `public/` |
|-------------|----------------|
| `favicon.ico`, `robots.txt`, `sitemap.xml` | Компоненты React |
| Файлы с **фиксированным** URL для SEO/OG | Секреты, `.env` |
| SVG иконки без оптимизации pipeline | Большие JPEG hero (лучше import + image) |

**Важно:** `public/` **не** проходит через bundler — нет content hash в имени. Для cache busting используйте import или CDN versioning.

---

## `next/image`: оптимизация по умолчанию

```tsx
import Image from "next/image";
import productPhoto from "@/assets/sample-product.jpg"; // локальный import

export function ProductHero() {
  return (
    <Image
      src={productPhoto}
      alt="Беспроводные наушники"
      placeholder="blur" // если static import — blurDataURL auto
      priority // LCP image above the fold
      sizes="(max-width: 768px) 100vw, 50vw"
      className="rounded-lg object-cover"
    />
  );
}
```

### Обязательные props

- **`width` + `height`** — для static import или explicit dimensions (резервирует место → **нет CLS**).
- **`alt`** — accessibility; пустой `alt=""` только для decorative.

### Responsive с `fill`

```tsx
<div className="relative aspect-[4/3] w-full">
  <Image
    src="/images/placeholder.svg"
    alt="Товар"
    fill
    className="object-cover"
    sizes="(max-width: 640px) 100vw, 320px"
  />
</div>
```

Родитель **должен** быть `position: relative` (или `fixed`/`absolute`) и иметь **заданные** размеры/aspect-ratio.

### Remote images (FastAPI, CDN)

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8090",
        pathname: "/static/**",
      },
      {
        protocol: "https",
        hostname: "cdn.example.com",
        pathname: "/products/**",
      },
    ],
  },
};

export default nextConfig;
```

```tsx
<Image
  src="http://localhost:8090/static/items/42.jpg"
  alt={item.title}
  width={400}
  height={300}
/>
```

Без `remotePatterns` — **ошибка** при build/dev.

### Что делает Image Optimization API

В dev и production (default) Next может:

- отдавать **WebP/AVIF** по Accept;
- ресайзить под `sizes`;
- lazy load (кроме `priority`).

При **`output: 'export'`** ([36-static-export.md](36-static-export.md)) — нужен `images: { unoptimized: true }` или external loader.

---

## `next/font`: шрифты без FOIT/FOUT chaos

### Google Font

```tsx
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

Шрифт **self-hosted** at build time — нет запроса к `fonts.googleapis.com` в runtime (privacy + perf).

### Local font

```tsx
import localFont from "next/font/local";

const shopDisplay = localFont({
  src: "../public/fonts/ShopDisplay.woff2",
  variable: "--font-display",
  weight: "700",
});
```

```css
/* globals.css */
h1 {
  font-family: var(--font-display), var(--font-inter), system-ui, sans-serif;
}
```

### `variable` vs `className`

| API | Эффект |
|-----|--------|
| `className={inter.className}` | применяет font к элементу |
| `variable="--font-inter"` | CSS variable для selective use |

Не подключайте тот же шрифт через `<link>` в `<head>` **и** `next/font` — двойная загрузка.

---

## Import assets vs public

```tsx
// import — hash в filename, tree-shaking если не использован
import banner from "./banner.png";

<Image src={banner} alt="Акция" />
// src станет /_next/static/media/banner.xxx.jpg
```

| Способ | URL | Cache bust | Оптимизация Image |
|--------|-----|------------|-------------------|
| `public/` | фиксированный `/file.png` | вручную | да, если через `<Image>` |
| `import` | hashed | автоматически | да |
| external URL | as-is | CDN | да + remotePatterns |

---

## Metadata и OG images ([31-metadata-seo.md](31-metadata-seo.md))

Статический OG fallback:

```tsx
export const metadata = {
  openGraph: {
    images: ["/og-default.png"], // из public/
  },
};
```

Dynamic OG — `opengraph-image.tsx` file convention или `generateMetadata` с absolute URL.

---

## SVG: особый случай

- **Маленькие иконки UI** — inline SVG component или `public/` + `<img>`.
- **`next/image` + SVG** — по умолчанию **без** raster optimization; часто проще компонент:

```tsx
function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {/* paths */}
    </svg>
  );
}
```

---

## Performance checklist для shop

1. **LCP image** на `/catalog` — `priority`, correct `sizes`.
2. **Product grid** — lazy (default), не ставить `priority` на каждую карточку.
3. **Шрифты** — один sans + optional display; subset `cyrillic`.
4. **Placeholder** — `blur` для локальных; `placeholder="empty"` + skeleton для remote.
5. **Width/height** — всегда, иначе CLS штраф в Core Web Vitals.

---

## Типичные ошибки

**`<img>` вместо `<Image>` для больших JPEG** — нет lazy/opt format; Lighthouse ругается.

**Remote URL без `remotePatterns`** — `Invalid src prop`.

**`fill` без sized parent** — image height 0 или layout explosion.

**Забыли `alt`** — a11y fail + SEO.

**Дублирование font:** Google `<link>` + `next/font`.

**Класть 50 MB видео в `public/`** — отдавайте через CDN/streaming, не через Next static.

**`unoptimized` везде «потому что проще»** — теряете главный profit `next/image`.

**Hardcoded `http://localhost:8090` в Image src в prod** — env-based base URL ([28-env-config.md](28-env-config.md)).

---

## Резюме

**`public/`** — файлы с каноническим URL (favicon, robots, default OG). **Import** — assets с hash и tree-shaking. **`next/image`** — responsive, modern formats, CLS control; для API/CDN настройте **`remotePatterns`**. **`next/font`** — self-hosted fonts без layout shift. Для shop catalog это закрывает типичный тикет «тяжёлая главная».

---

## Чек-лист

- [ ] Разница `/logo.png` из public vs import
- [ ] Зачем `width`, `height`, `sizes`, `priority`
- [ ] Настройка `images.remotePatterns` для `:8090`
- [ ] `next/font` subsets для русского текста
- [ ] Когда SVG — компонент, не Image
- [ ] Связь с static export и `unoptimized`

Следующий урок: [31. Metadata API и SEO](31-metadata-seo.md).
