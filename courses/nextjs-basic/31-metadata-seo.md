# 31. Metadata API: title, Open Graph, robots

## Сценарий с работы: «В Slack превью пустое, Google индексирует /cart»

Маркетинг: «Ссылка на товар в Telegram показывает generic "Create Next App", без картинки». SEO: «Страницы `/cart` и `/api` в выдаче». Вы открываете `app/layout.tsx` — один `title` на весь сайт, `<head>` правят вручную через deprecated `next/head` из Pages Router tutorials.

В **App Router** metadata — **declarative API**: `export const metadata` или async **`generateMetadata`** на layout/page. Next генерирует `<title>`, `<meta name="description">`, **`openGraph`**, **`twitter`**, **`robots`**, canonical — без ручного `<Head>`.

Shop mock-exams: root layout — brand + template; `/catalog` — listing; `/items/[id]` — dynamic title/description/OG ([32-lab-metadata.md](32-lab-metadata.md)).

---

## Что вы узнаете

- **`Metadata` type** и static `export const metadata`.
- **`generateMetadata`** для dynamic routes с `fetch` item.
- **`openGraph`**, **`twitter`**, **`alternates.canonical`**.
- **`robots`**: index/noindex, `robots.ts`, `sitemap.ts`.
- File conventions: `icon.tsx`, `opengraph-image.tsx`.

---

## Static metadata в layout

```tsx
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Shop — mock-exams",
    template: "%s | Shop",
  },
  description: "Каталог товаров Next.js + FastAPI",
  applicationName: "Shop Catalog",
  keywords: ["shop", "catalog", "next.js"],
  authors: [{ name: "mock-exams" }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Shop",
    title: "Shop — mock-exams",
    description: "Каталог товаров",
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
    description: "Каталог товаров",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### `metadataBase` — критично для OG

Относительные пути `/og-default.png` резолвятся в **absolute** URL только с `metadataBase`. Без него Slack/Telegram могут не подхватить image.

```tsx
metadataBase: new URL("https://shop.example.com"),
// openGraph.images: [{ url: "/og.png" }] → https://shop.example.com/og.png
```

Env: `NEXT_PUBLIC_SITE_URL` ([28-env-config.md](28-env-config.md)).

### Title template

```tsx
// app/catalog/page.tsx
export const metadata: Metadata = {
  title: "Каталог",
};
// → <title>Каталог | Shop</title>
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
    return { title: "Товар не найден" };
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
          url: `/api/og/item/${id}`, // Route Handler или static fallback
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

### Правила `generateMetadata`

| Правило | Деталь |
|---------|--------|
| Только Server | async function в server file |
| `params` в Next 15 | часто `Promise` — `await params` |
| Дедупликация fetch | тот же `fetch` в page + metadata — Next **dedupe** ([16-caching-revalidate.md](16-caching-revalidate.md)) |
| Ошибки | throw → error boundary; 404 item → soft metadata или `notFound()` в page |

---

## Open Graph и соцсети

Минимальный набор для rich preview:

```tsx
openGraph: {
  title: "...",
  description: "...",
  url: "https://...",      // или path с metadataBase
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

**Проверка:** [opengraph.xyz](https://www.opengraph.xyz), Facebook Sharing Debugger, Telegram paste link.

---

## Robots: что индексировать

### Per-page metadata

```tsx
// app/cart/page.tsx — client-heavy, не для SEO
export const metadata: Metadata = {
  title: "Корзина",
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

| File | Назначение |
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

## Merge metadata: layout → page

Child **overrides** parent fields; `title.template` применяется к child `title` string.

```text
layout: title.template = "%s | Shop"
page:   title = "Каталог"
result: <title>Каталог | Shop</title>
```

`openGraph` — **shallow merge**; явно переопределяйте `images` на dynamic pages.

---

## JSON-LD (structured data) — дополнение

Metadata API не заменяет JSON-LD для Product rich results:

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

Или отдельный компонент `ProductJsonLd`.

---

## Типичные ошибки

**Нет `metadataBase`** — OG images с relative URL не работают в мессенджерах.

**Duplicate `<title>`** — смешение `next/head` (Pages) и App Router metadata.

**`generateMetadata` fetch без cache policy** — лишняя нагрузка на `:8090`; используйте `revalidate`.

**Index `/cart`, `/checkout`** — duplicate thin content; `robots: { index: false }`.

**OG description 2000 символов** — обрежьте до ~160.

**Забыли `await params`** в Next 15 — runtime error или wrong id.

**Hardcoded production URL в dev** — используйте env.

**Один OG image для всех товаров** — низкий CTR; dynamic OG в [32-lab-metadata.md](32-lab-metadata.md).

---

## Резюме

**Metadata API** — декларативный SEO слой App Router: static `metadata`, dynamic **`generateMetadata`**, **`openGraph`** / **twitter** для превью, **`robots.ts`** + **`sitemap.ts`** для краулеров. **`metadataBase`** обязателен для absolute OG URLs. Shop catalog: template title в layout, per-item metadata на `[id]`, noindex на корзине.

---

## Чек-лист

- [ ] `metadata` vs `generateMetadata`
- [ ] Роль `metadataBase`
- [ ] `title.template` в nested pages
- [ ] Минимальный набор `openGraph` полей
- [ ] `robots.ts` disallow `/api/`, `/cart`
- [ ] Dynamic `sitemap.ts` из FastAPI items
- [ ] Dedupe fetch между metadata и page

Следующий урок: [32. Лаба: SEO страницы товара](32-lab-metadata.md).
