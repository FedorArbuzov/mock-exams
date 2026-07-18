# 32. Лаба: dynamic metadata для страницы товара

## Сценарий с работы: «Тикет SEO-042 — OG для /items/:id»

Product owner приложил скрин: ссылка `https://shop/items/7` в Slack показывает «Shop — mock-exams» без описания и с дефолтной картинкой. Acceptance criteria:

1. `<title>` = название товара + template бренда.
2. `<meta description>` — первые ~160 символов описания.
3. Open Graph: title, description, url, image (placeholder или API).
4. `/cart` — `noindex`.
5. `sitemap.xml` содержит URL всех товаров с `:8090`.

Лаба продолжает [31-metadata-seo.md](31-metadata-seo.md) в [`examples/`](examples/package.json). FastAPI должен быть доступен на `:8090`.

**Время:** ~50–70 минут.

---

## Что вы сделаете

- Настроите **`metadataBase`** и root metadata в `layout.tsx`.
- Реализуете **`generateMetadata`** для `app/items/[id]/page.tsx`.
- Добавите **`robots.ts`** и **`sitemap.ts`**.
- Поставите **`noindex`** на `/cart`.
- Проверите превью и View Source.

---

## Подготовка

```bash
cd courses/nextjs-basic/examples
npm install
npm run dev
# второй терминал:
cd deploy/fastapi && docker compose up -d
curl http://localhost:8090/api/v1/items
```

Убедитесь, что dynamic route `app/items/[id]/page.tsx` уже загружает item (уроки [05-dynamic-routes.md](05-dynamic-routes.md), [15-lab-server-fetch.md](15-lab-server-fetch.md)). Если страницы нет — создайте минимальную версию с `fetchItem`.

`.env.local`:

```env
FASTAPI_URL=http://localhost:8090
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Шаг 1. Root layout metadata

Откройте [`app/layout.tsx`](examples/app/layout.tsx). Расширьте metadata:

```tsx
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shop — nextjs-basic",
    template: "%s | Shop",
  },
  description: "Каталог товаров — курс Next.js mock-exams",
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

Создайте `public/og-default.png` (любой 1200×630 placeholder) или временно используйте `/images/placeholder.svg` с пониманием, что OG prefers PNG/JPG.

---

## Шаг 2. Metadata для `/catalog`

```tsx
// app/catalog/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Каталог",
  description: "Все товары shop mock-exams",
  openGraph: {
    title: "Каталог товаров",
    description: "Список товаров с FastAPI",
    url: "/catalog",
  },
};

export default async function CatalogPage() {
  // ... существующий код списка
}
```

---

## Шаг 3. `generateMetadata` для товара

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
      title: "Товар не найден",
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

**Dedupe:** используйте **ту же** функцию `getItem` в page и metadata — один fetch на request.

---

## Шаг 4. Noindex для корзины

```tsx
// app/cart/page.tsx
"use client"; // если корзина client-only

// metadata нельзя export из client file!
```

Если `cart/page.tsx` — Client Component, вынесите metadata в **`layout.tsx`** сегмента:

```tsx
// app/cart/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Корзина",
  robots: { index: false, follow: true },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

---

## Шаг 5. `robots.ts` и `sitemap.ts`

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
    // sitemap без items — не падать build
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

## Шаг 6. Проверка

| Проверка | Команда / действие |
|----------|-------------------|
| Title товара | View Source `/items/1` → `<title>Название \| Shop</title>` |
| OG tags | `curl -s localhost:3000/items/1 \| findstr og:` (Windows) или DevTools Elements |
| robots | `http://localhost:3000/robots.txt` |
| sitemap | `http://localhost:3000/sitemap.xml` — URLs items |
| cart noindex | View Source `/cart` → `noindex` |
| 404 item | `/items/99999` — title «Товар не найден», noindex |

```bash
curl -s http://localhost:3000/sitemap.xml
curl -s http://localhost:3000/robots.txt
```

---

## Extension (опционально)

1. **`app/items/[id]/opengraph-image.tsx`** — OG с названием товара ( `@vercel/og` / `ImageResponse`).
2. **JSON-LD Product** script на странице товара.
3. Per-item image из API в `openGraph.images`.

---

## Критерии успеха

- [ ] `generateMetadata` использует данные FastAPI
- [ ] Title template работает
- [ ] `metadataBase` задан
- [ ] `sitemap.xml` содержит `/items/{id}`
- [ ] `/cart` с `noindex`
- [ ] `/robots.txt` disallow `/api/`
- [ ] Нет duplicate fetch (общая `getItem`)

---

## Типичные ошибки в лабе

**Metadata export в `"use client"` file** — build error; используйте `cart/layout.tsx`.

**Забыли `await params`** — wrong id в metadata.

**Sitemap падает если API down** — оберните fetch в try/catch.

**OG image SVG** — некоторые crawlers игнорируют; PNG 1200×630 надёжнее.

**Description не обрезан** — длинный snippet в SERP обрезается некрасиво.

**Нет `.env.local`** — `metadataBase` localhost OK для dev, но OG absolute URL нужен для staging.

---

## Резюме

Лаба закрепляет **production SEO минимум** для shop: dynamic **`generateMetadata`** на товаре, static на каталоге, **`robots`/`sitemap`**, noindex на private routes. Это типичный тикет fullstack команды до релиза.

---

## Чек-лист

- [ ] Root `metadataBase` + `title.template`
- [ ] Shared `getItem` для page + metadata
- [ ] `cart/layout.tsx` для robots если page client
- [ ] Проверили sitemap и robots в браузере
- [ ] Понимаете shallow merge openGraph

Следующий урок: [33. Internationalization — обзор](33-i18n-overview.md).
