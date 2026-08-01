# 32. Lab: dynamic metadata for the product page

## A scenario from work: "Ticket SEO-042 — OG for /items/:id"

The product owner attached a screenshot: the link `https://shop/items/7` in Slack shows "Shop — mock-exams" without a description and with a default image. Acceptance criteria:

1. `<title>` = product name + brand template.
2. `<meta description>` — the first ~160 characters of the description.
3. Open Graph: title, description, url, image (placeholder or API).
4. `/cart` — `noindex`.
5. `sitemap.xml` contains the URLs of all products from `:8090`.

The lab continues [31-metadata-seo.md](31-metadata-seo.md) in [`examples/`](examples/package.json). FastAPI must be available on `:8090`.

**Time:** ~50–70 minutes.

---

## What you'll do

- Set up **`metadataBase`** and root metadata in `layout.tsx`.
- Implement **`generateMetadata`** for `app/items/[id]/page.tsx`.
- Add **`robots.ts`** and **`sitemap.ts`**.
- Put **`noindex`** on `/cart`.
- Check the preview and View Source.

---

## Setup

```bash
cd courses/nextjs-basic/examples
npm install
npm run dev
# second terminal:
cd deploy/fastapi && docker compose up -d
curl http://localhost:8090/api/v1/items
```

Make sure the dynamic route `app/items/[id]/page.tsx` already loads an item (lessons [05-dynamic-routes.md](05-dynamic-routes.md), [15-lab-server-fetch.md](15-lab-server-fetch.md)). If the page doesn't exist — create a minimal version with `fetchItem`.

`.env.local`:

```env
FASTAPI_URL=http://localhost:8090
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Step 1. Root layout metadata

Open [`app/layout.tsx`](examples/app/layout.tsx). Extend the metadata:

```tsx
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shop — nextjs-basic",
    template: "%s | Shop",
  },
  description: "Product catalog — the Next.js mock-exams course",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Shop",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Shop" }],
  },
  twitter: {
    card: "summary_large_image",
  },
};
```

Create `public/og-default.png` (any 1200×630 placeholder) or temporarily use `/images/placeholder.svg`, keeping in mind that OG prefers PNG/JPG.

---

## Step 2. Metadata for `/catalog`

```tsx
// app/catalog/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalog",
  description: "All shop mock-exams products",
  openGraph: {
    title: "Product catalog",
    description: "A list of products from FastAPI",
    url: "/catalog",
  },
};

export default async function CatalogPage() {
  // ... existing list code
}
```

---

## Step 3. `generateMetadata` for a product

```tsx
// app/items/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Item = { id: number; title: string; description: string };

type PageProps = { params: Promise<{ id: string }> };

async function getItem(id: string): Promise<Item | null> {
  const base = process.env.FASTAPI_URL ?? "http://localhost:8090";
  const res = await fetch(`${base}/api/v1/items/${id}`, {
    next: { revalidate: 60, tags: [`item-${id}`] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load item ${id}`);
  return res.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);

  if (!item) {
    return {
      title: "Item not found",
      robots: { index: false, follow: false },
    };
  }

  const description =
    item.description.length > 160
      ? `${item.description.slice(0, 157)}...`
      : item.description;

  return {
    title: item.title,
    description,
    openGraph: {
      title: item.title,
      description,
      url: `/items/${id}`,
      type: "website",
      images: [
        {
          url: "/og-default.png", // extension: per-item image
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

export default async function ItemPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  return (
    <article className="card">
      <h1>{item.title}</h1>
      <p className="muted">{item.description}</p>
    </article>
  );
}
```

**Dedupe:** use the **same** `getItem` function in the page and in metadata — one fetch per request.

---

## Step 4. Noindex for the cart

```tsx
// app/cart/page.tsx
"use client"; // if the cart is client-only

// metadata can't be exported from a client file!
```

If `cart/page.tsx` is a Client Component, move the metadata into the segment's **`layout.tsx`**:

```tsx
// app/cart/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: true },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

---

## Step 5. `robots.ts` and `sitemap.ts`

```ts
// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
```

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";

type Item = { id: number };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const api = process.env.FASTAPI_URL ?? "http://localhost:8090";

  let items: Item[] = [];
  try {
    const res = await fetch(`${api}/api/v1/items`, { next: { revalidate: 3600 } });
    if (res.ok) items = await res.json();
  } catch {
    // a sitemap without items — don't fail the build
  }

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.5 },
    ...items.map((item) => ({
      url: `${base}/items/${item.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
```

---

## Step 6. Verification

| Check | Command / action |
|----------|-------------------|
| Product title | View Source `/items/1` → `<title>Name \| Shop</title>` |
| OG tags | `curl -s localhost:3000/items/1 \| findstr og:` (Windows) or DevTools Elements |
| robots | `http://localhost:3000/robots.txt` |
| sitemap | `http://localhost:3000/sitemap.xml` — item URLs |
| cart noindex | View Source `/cart` → `noindex` |
| 404 item | `/items/99999` — title "Item not found", noindex |

```bash
curl -s http://localhost:3000/sitemap.xml
curl -s http://localhost:3000/robots.txt
```

---

## Extension (optional)

1. **`app/items/[id]/opengraph-image.tsx`** — OG with the product name (`@vercel/og` / `ImageResponse`).
2. **JSON-LD Product** script on the product page.
3. Per-item image from the API in `openGraph.images`.

---

## Success criteria

- [ ] `generateMetadata` uses FastAPI data
- [ ] The title template works
- [ ] `metadataBase` is set
- [ ] `sitemap.xml` contains `/items/{id}`
- [ ] `/cart` has `noindex`
- [ ] `/robots.txt` disallows `/api/`
- [ ] No duplicate fetch (shared `getItem`)

---

## Common mistakes in the lab

**Exporting metadata in a `"use client"` file** — build error; use `cart/layout.tsx`.

**Forgetting `await params`** — wrong id in metadata.

**The sitemap fails if the API is down** — wrap the fetch in try/catch.

**An SVG OG image** — some crawlers ignore it; PNG 1200×630 is more reliable.

**Description not truncated** — a long snippet gets cut off unattractively in SERP.

**No `.env.local`** — a localhost `metadataBase` is OK for dev, but an absolute OG URL is needed for staging.

---

## Summary

The lab reinforces the **production SEO minimum** for a shop: dynamic **`generateMetadata`** on the product, static on the catalog, **`robots`/`sitemap`**, and noindex on private routes. This is a typical fullstack-team ticket before release.

---

## Checklist

- [ ] Root `metadataBase` + `title.template`
- [ ] Shared `getItem` for page + metadata
- [ ] `cart/layout.tsx` for robots if the page is client
- [ ] Checked the sitemap and robots in the browser
- [ ] You understand the shallow merge of openGraph

Next lesson: [33. Internationalization — overview](33-i18n-overview.md).
