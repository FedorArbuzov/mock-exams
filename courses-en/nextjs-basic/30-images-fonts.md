# 30. Assets: `next/image`, `next/font`, the `public/` directory

## A scenario from work: "Lighthouse says the homepage is 4 MB"

The product owner opens PageSpeed: "The hero image is a 2.1 MB JPEG, fonts block render for 800ms, and icons live in `src/assets` — they 404 in prod." In Vite you'd have done `import logo from './logo.png'`. In Next.js, **static assets** split into three layers: **`public/`** (URL as-is), **imported assets** (webpack/turbopack hash), and **`next/image`** + **`next/font`** (optimization out of the box).

For the shop catalog on SSR ([14-server-fetch.md](14-server-fetch.md)), product images come from FastAPI `:8090` or a CDN — `next/image` requires **`remotePatterns`** for that. Inter fonts for Cyrillic go through `next/font/google` with no layout shift.

---

## What you'll learn

- The **`public/`** directory: what to put there and how to reference it.
- **`next/image`**: `fill`, `sizes`, priority, remote images, placeholder.
- **`next/font`**: local and Google fonts, `variable`, subset.
- The difference between imported assets, `public/`, and external URLs.
- CLS (Cumulative Layout Shift) issues and how to close them off.

---

## The `public/` directory

Everything in `public/` is available at a **root URL**:

```text
public/
  favicon.ico          → /favicon.ico
  robots.txt           → /robots.txt
  images/
    placeholder.svg    → /images/placeholder.svg
  og-default.png       → /og-default.png
```

```tsx
// Not an import — a direct path
<img src="/images/placeholder.svg" alt="" /> // legacy HTML

// next/image is preferred for raster images
import Image from "next/image";

<Image src="/images/placeholder.svg" alt="No photo" width={200} height={150} />
```

| Belongs in `public/` | Doesn't belong in `public/` |
|-------------|----------------|
| `favicon.ico`, `robots.txt`, `sitemap.xml` | React components |
| Files that need a **fixed** URL for SEO/OG | Secrets, `.env` |
| SVG icons that don't need the optimization pipeline | Large hero JPEGs (better as import + Image) |

**Important:** `public/` does **not** go through the bundler — there's no content hash in the filename. For cache busting, use imports or CDN versioning.

---

## `next/image`: optimization by default

```tsx
import Image from "next/image";
import productPhoto from "@/assets/sample-product.jpg"; // local import

export function ProductHero() {
  return (
    <Image
      src={productPhoto}
      alt="Wireless headphones"
      placeholder="blur" // static imports get an auto blurDataURL
      priority // LCP image above the fold
      sizes="(max-width: 768px) 100vw, 50vw"
      className="rounded-lg object-cover"
    />
  );
}
```

### Required props

- **`width` + `height`** — for static imports or explicit dimensions (reserves space → **no CLS**).
- **`alt`** — accessibility; use empty `alt=""` only for decorative images.

### Responsive with `fill`

```tsx
<div className="relative aspect-[4/3] w-full">
  <Image
    src="/images/placeholder.svg"
    alt="Product"
    fill
    className="object-cover"
    sizes="(max-width: 640px) 100vw, 320px"
  />
</div>
```

The parent **must** be `position: relative` (or `fixed`/`absolute`) and have **defined** dimensions/aspect-ratio.

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

Without `remotePatterns` — you get an **error** at build/dev time.

### What the Image Optimization API does

In both dev and production (default), Next can:

- serve **WebP/AVIF** based on the Accept header;
- resize to match `sizes`;
- lazy load (except when `priority` is set).

With **`output: 'export'`** ([36-static-export.md](36-static-export.md)) you need `images: { unoptimized: true }` or an external loader.

---

## `next/font`: fonts without FOIT/FOUT chaos

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

The font is **self-hosted** at build time — no request to `fonts.googleapis.com` at runtime (privacy + perf win).

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

| API | Effect |
|-----|--------|
| `className={inter.className}` | applies the font to an element |
| `variable="--font-inter"` | CSS variable for selective use |

Don't load the same font via both a `<link>` in `<head>` **and** `next/font` — that's a double load.

---

## Imported assets vs public

```tsx
// import — hash in the filename, tree-shaken if unused
import banner from "./banner.png";

<Image src={banner} alt="Promo" />
// src becomes /_next/static/media/banner.xxx.jpg
```

| Approach | URL | Cache busting | Image optimization |
|--------|-----|------------|-------------------|
| `public/` | fixed `/file.png` | manual | yes, if used through `<Image>` |
| `import` | hashed | automatic | yes |
| external URL | as-is | CDN | yes + remotePatterns |

---

## Metadata and OG images ([31-metadata-seo.md](31-metadata-seo.md))

Static OG fallback:

```tsx
export const metadata = {
  openGraph: {
    images: ["/og-default.png"], // from public/
  },
};
```

Dynamic OG — the `opengraph-image.tsx` file convention, or `generateMetadata` with an absolute URL.

---

## SVG: a special case

- **Small UI icons** — inline SVG component, or `public/` + `<img>`.
- **`next/image` + SVG** — by default there's **no** raster optimization; a component is often simpler:

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

## Performance checklist for the shop

1. **LCP image** on `/catalog` — `priority`, correct `sizes`.
2. **Product grid** — lazy by default; don't set `priority` on every card.
3. **Fonts** — one sans + optional display; subset `cyrillic`.
4. **Placeholder** — `blur` for local images; `placeholder="empty"` + skeleton for remote ones.
5. **Width/height** — always set them, or you'll take a CLS hit in Core Web Vitals.

---

## Common mistakes

**`<img>` instead of `<Image>` for large JPEGs** — no lazy loading/format optimization; Lighthouse complains.

**Remote URL without `remotePatterns`** — `Invalid src prop`.

**`fill` without a sized parent** — image height collapses to 0 or the layout explodes.

**Forgot `alt`** — a11y failure + SEO hit.

**Duplicate font loading:** a Google `<link>` plus `next/font`.

**Dropping a 50 MB video into `public/`** — serve it via CDN/streaming, not Next static.

**`unoptimized` everywhere "because it's simpler"** — you lose the main benefit of `next/image`.

**Hardcoded `http://localhost:8090` in an Image src in prod** — use an env-based base URL instead ([28-env-config.md](28-env-config.md)).

---

## Summary

**`public/`** holds files with a canonical URL (favicon, robots, default OG). **Imports** are assets with hashing and tree-shaking. **`next/image`** gives you responsive, modern formats and CLS control; configure **`remotePatterns`** for API/CDN sources. **`next/font`** self-hosts fonts without layout shift. For the shop catalog, this closes out the classic "heavy homepage" ticket.

---

## Checklist

- [ ] The difference between `/logo.png` from public vs an import
- [ ] Why `width`, `height`, `sizes`, `priority` matter
- [ ] Setting up `images.remotePatterns` for `:8090`
- [ ] `next/font` subsets for Russian text
- [ ] When SVG should be a component, not an Image
- [ ] The connection to static export and `unoptimized`

Next lesson: [31. Metadata API and SEO](31-metadata-seo.md).
