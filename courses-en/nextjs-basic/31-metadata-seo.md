# 31. Metadata API: title, Open Graph, robots

## A scenario from work: "The Slack preview is empty, Google is indexing /cart"

Marketing: "A product link in Telegram shows a generic 'Create Next App', without an image." SEO: "The `/cart` and `/api` pages are in the results." You open `app/layout.tsx` — a single `title` for the whole site, and `<head>` is edited by hand via the deprecated `next/head` from Pages Router tutorials.

In the **App Router**, metadata is a **declarative API**: `export const metadata` or an async **`generateMetadata`** on a layout/page. Next generates `<title>`, `<meta name="description">`, **`openGraph`**, **`twitter`**, **`robots`**, canonical — without a manual `<Head>`.

The mock-exams shop: root layout — brand + template; `/catalog` — listing; `/items/[id]` — dynamic title/description/OG ([32-lab-metadata.md](32-lab-metadata.md)).

---

## What you'll learn

- The **`Metadata` type** and static `export const metadata`.
- **`generateMetadata`** for dynamic routes with an item `fetch`.
- **`openGraph`**, **`twitter`**, **`alternates.canonical`**.
- **`robots`**: index/noindex, `robots.ts`, `sitemap.ts`.
- File conventions: `icon.tsx`, `opengraph-image.tsx`.

---

## Static metadata in the layout

```tsx
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Shop — mock-exams",
    template: "%s | Shop",
  },
  description: "A Next.js + FastAPI product catalog",
  applicationName: "Shop Catalog",
  keywords: ["shop", "catalog", "next.js"],
  authors: [{ name: "mock-exams" }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Shop",
    title: "Shop — mock-exams",
    description: "Product catalog",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Shop catalog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop — mock-exams",
    description: "Product catalog",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### `metadataBase` — critical for OG

Relative paths like `/og-default.png` resolve to an **absolute** URL only with `metadataBase`. Without it, Slack/Telegram may not pick up the image.

```tsx
metadataBase: new URL("https://shop.example.com"),
// openGraph.images: [{ url: "/og.png" }] → https://shop.example.com/og.png
```

Env: `NEXT_PUBLIC_SITE_URL` ([28-env-config.md](28-env-config.md)).

### Title template

```tsx
// app/catalog/page.tsx
export const metadata: Metadata = {
  title: "Catalog",
};
// → <title>Catalog | Shop</title>
```

---

## Dynamic metadata: `generateMetadata`

```tsx
// app/items/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

async function fetchItem(id: string) {
  const res = await fetch(`${process.env.FASTAPI_URL}/api/v1/items/${id}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("API error");
  return res.json() as Promise<{ id: number; title: string; description: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchItem(id);

  if (!item) {
    return { title: "Item not found" };
  }

  return {
    title: item.title,
    description: item.description.slice(0, 160),
    openGraph: {
      title: item.title,
      description: item.description,
      type: "website",
      url: `/items/${id}`,
      images: [
        {
          url: `/api/og/item/${id}`, // Route Handler or static fallback
          width: 1200,
          height: 630,
          alt: item.title,
        },
      ],
    },
    alternates: {
      canonical: `/items/${id}`,
    },
  };
}

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) notFound();
  return <main>{/* ... */}</main>;
}
```

### `generateMetadata` rules

| Rule | Detail |
|---------|--------|
| Server only | an async function in a server file |
| `params` in Next 15 | often a `Promise` — `await params` |
| Fetch deduplication | the same `fetch` in page + metadata — Next **dedupes** ([16-caching-revalidate.md](16-caching-revalidate.md)) |
| Errors | throw → error boundary; a 404 item → soft metadata or `notFound()` in the page |

---

## Open Graph and social networks

The minimal set for a rich preview:

```tsx
openGraph: {
  title: "...",
  description: "...",
  url: "https://...",      // or a path with metadataBase
  siteName: "Shop",
  locale: "ru_RU",
  type: "website",         // product — extension OG product tags
  images: [{ url, width, height, alt }],
},
twitter: {
  card: "summary_large_image",
  title: "...",
  images: ["..."],
},
```

**Testing:** [opengraph.xyz](https://www.opengraph.xyz), Facebook Sharing Debugger, Telegram paste link.

---

## Robots: what to index

### Per-page metadata

```tsx
// app/cart/page.tsx — client-heavy, not for SEO
export const metadata: Metadata = {
  title: "Cart",
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};
```

```tsx
// app/contact/page.tsx
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};
```

### `app/robots.ts`

```ts
// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cart", "/api/", "/admin/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
```

### `app/sitemap.ts`

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${process.env.FASTAPI_URL}/api/v1/items`, {
    next: { revalidate: 3600 },
  });
  const items: { id: number }[] = await res.json();

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalog`, changeFrequency: "daily", priority: 0.9 },
    ...items.map((item) => ({
      url: `${base}/items/${item.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
```

---

## File conventions (Metadata files)

| File | Purpose |
|------|------------|
| `app/favicon.ico` | favicon |
| `app/icon.tsx` | dynamic icon |
| `app/opengraph-image.tsx` | OG image generation (ImageResponse) |
| `app/twitter-image.tsx` | Twitter card image |
| `app/manifest.ts` | PWA manifest |

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "#1a2332",
          color: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Shop Catalog
      </div>
    ),
    { ...size }
  );
}
```

---

## Merging metadata: layout → page

The child **overrides** parent fields; `title.template` applies to the child `title` string.

```text
layout: title.template = "%s | Shop"
page:   title = "Catalog"
result: <title>Catalog | Shop</title>
```

`openGraph` — a **shallow merge**; explicitly override `images` on dynamic pages.

---

## JSON-LD (structured data) — an addition

The Metadata API doesn't replace JSON-LD for Product rich results:

```tsx
// app/items/[id]/page.tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: item.title,
      description: item.description,
    }),
  }}
/>
```

Or a separate `ProductJsonLd` component.

---

## Common mistakes

**No `metadataBase`** — OG images with a relative URL don't work in messengers.

**Duplicate `<title>`** — mixing `next/head` (Pages) and App Router metadata.

**`generateMetadata` fetch without a cache policy** — extra load on `:8090`; use `revalidate`.

**Indexing `/cart`, `/checkout`** — duplicate thin content; `robots: { index: false }`.

**A 2000-character OG description** — trim to ~160.

**Forgetting `await params`** in Next 15 — runtime error or wrong id.

**A hardcoded production URL in dev** — use env.

**One OG image for all products** — low CTR; dynamic OG in [32-lab-metadata.md](32-lab-metadata.md).

---

## Summary

The **Metadata API** is the declarative SEO layer of the App Router: static `metadata`, dynamic **`generateMetadata`**, **`openGraph`** / **twitter** for previews, **`robots.ts`** + **`sitemap.ts`** for crawlers. **`metadataBase`** is required for absolute OG URLs. Shop catalog: a template title in the layout, per-item metadata on `[id]`, noindex on the cart.

---

## Checklist

- [ ] `metadata` vs `generateMetadata`
- [ ] The role of `metadataBase`
- [ ] `title.template` in nested pages
- [ ] The minimal set of `openGraph` fields
- [ ] `robots.ts` disallow `/api/`, `/cart`
- [ ] Dynamic `sitemap.ts` from FastAPI items
- [ ] Dedupe fetch between metadata and page

Next lesson: [32. Lab: product page SEO](32-lab-metadata.md).
