# 33. Internationalization (i18n): App Router overview

## A scenario from work: "We need /en/catalog by the EU release"

PM: "Right now it's Russian only; in a month — English and Kazakh. The URLs should be `/ru/catalog`, `/en/catalog`, hreflang for SEO, and a language switcher without a full reload like in the old PHP." You check the Next.js docs — there is **no** built-in i18n routing like in the Pages Router (`i18n` in `next.config.js`). In the App Router the pattern is a **dynamic segment `[locale]`** + dictionaries + middleware.

This is an **overview** chapter: full shop localization is a capstone extension ([39-capstone.md](39-capstone.md)). The goal is to understand the architecture, not to roll out 3 languages across all 40 lessons.

---

## What you'll learn

- Why App Router i18n is a **standalone** pattern, not a config flag.
- The structure of **`app/[locale]/...`** and the root redirect.
- **Middleware** for the default locale and cookie.
- Dictionaries: JSON files vs CMS.
- **`generateStaticParams`** for locales.
- SEO: `hreflang`, localized metadata.
- The relation to [`next-intl`](https://next-intl.dev) (the recommended lib).

---

## Architecture: the `[locale]` segment

```text
app/
  [locale]/
    layout.tsx       # lang on <html>, providers
    page.tsx         # home
    catalog/
      page.tsx
    items/
      [id]/
        page.tsx
  layout.tsx         # optional root redirect only
```

URLs:

```text
/ru/catalog
/en/catalog
/en/items/42
```

**Root `/`** — a middleware redirect to `/ru`, or it negotiates `Accept-Language`.

```tsx
// middleware.ts (simplified)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["ru", "en"] as const;
const defaultLocale = "ru";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  );
  if (hasLocale) return NextResponse.next();

  const locale = request.cookies.get("locale")?.value ?? defaultLocale;
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
```

The matcher **excludes** `api`, `_next`, and static files with an extension.

---

## Layout with a locale

```tsx
// app/[locale]/layout.tsx
import { notFound } from "next/navigation";

const locales = ["ru", "en"] as const;
type Locale = (typeof locales)[number];

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
```

`<html lang={locale}>` — accessibility + SEO signal.

---

## Dictionaries

```text
messages/
  ru.json
  en.json
```

```json
// messages/ru.json
{
  "catalog": {
    "title": "Каталог",
    "empty": "Товаров пока нет"
  },
  "cart": {
    "add": "В корзину"
  }
}
```

```tsx
// lib/i18n.ts
import ru from "@/messages/ru.json";
import en from "@/messages/en.json";

const dicts = { ru, en } as const;

export type Locale = keyof typeof dicts;

export function getDictionary(locale: Locale) {
  return dicts[locale] ?? dicts.ru;
}
```

```tsx
// app/[locale]/catalog/page.tsx
import { getDictionary, type Locale } from "@/lib/i18n";

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale);

  return (
    <main>
      <h1>{t.catalog.title}</h1>
    </main>
  );
}
```

**Server Components** load only the needed JSON — don't drag all languages into the client bundle.

---

## Client Components and hooks

Client islands (cart, theme) need **`useTranslations`** — the **`next-intl`** library:

```tsx
"use client";
import { useTranslations } from "next-intl";

export function AddToCartButton() {
  const t = useTranslations("cart");
  return <button>{t("add")}</button>;
}
```

The provider in `[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/lib/getMessages";

// ...
const messages = await getMessages(locale);
<NextIntlClientProvider locale={locale} messages={messages}>
  {children}
</NextIntlClientProvider>
```

---

## Localized metadata

```tsx
// app/[locale]/catalog/page.tsx
import type { Metadata } from "next";
import { getDictionary, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(locale);

  return {
    title: t.catalog.title,
    alternates: {
      canonical: `/${locale}/catalog`,
      languages: {
        ru: "/ru/catalog",
        en: "/en/catalog",
      },
    },
  };
}
```

`alternates.languages` → `<link rel="alternate" hreflang="...">`.

---

## Navigation between locales

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const locales = ["ru", "en"] as const;

export function LocaleSwitcher({ current }: { current: string }) {
  const pathname = usePathname(); // /ru/catalog
  const pathWithoutLocale = pathname.replace(/^\/(ru|en)/, "") || "/";

  return (
    <div>
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${pathWithoutLocale}`}
          aria-current={l === current ? "page" : undefined}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
```

`Link` preserves client navigation without a full reload ([08-navigation.md](08-navigation.md)).

---

## Formatting: dates, numbers, currency

Don't hardcode `toFixed(2) + " ₽"`:

```tsx
new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "RUB",
}).format(price);
```

```tsx
new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date());
```

The server and client must use the **same locale** from params.

---

## RTL (optional)

For Arabic (`ar`):

```tsx
<html lang="ar" dir="rtl">
```

Tailwind: `rtl:` variants or logical properties (`ms-`, `me-`).

---

## Static vs dynamic locales

| Approach | When |
|--------|-------|
| `generateStaticParams` for locales | 2–5 languages, SSG-friendly |
| Dynamic only | a CMS adds languages |
| Subdomains `en.shop.com` | middleware rewrite, cookies are trickier |

---

## Comparison with Pages Router i18n

| Pages Router | App Router |
|--------------|------------|
| `i18n` in `next.config.js` | `[locale]` segment |
| `router.locale` | params.locale |
| Automatic prefix | middleware + structure |

Pages → App migration: **rebuilding** the `app/` directory, not toggling config.

---

## Shop mock-exams: minimal scope

If you introduce i18n in the capstone:

1. Locales: `ru`, `en`.
2. Translate the UI strings (catalog, cart, contact) — **not** the product content from the API (it comes in one language from the backend).
3. Middleware default `ru`.
4. hreflang on the catalog + item pages.
5. Localized metadata titles.

The backend `:8090` may later return `title_en` — a BFF merge in a Route Handler ([19-route-handlers.md](19-route-handlers.md)).

---

## Common mistakes

**Duplicating `app/catalog` and `app/[locale]/catalog`** — pick one scheme.

**The middleware matcher catching `_next/static`** — broken assets; use a negative lookahead.

**All JSON dictionaries in the client bundle** — import only the needed locale on the server.

**Forgetting `lang` on `<html>`** — screen readers get the wrong language.

**hreflang on a URL without a locale prefix** — inconsistent with routing.

**Hardcoded `/catalog` links** — they should be `/${locale}/catalog`.

**Translating error messages only on the client** — localize server `notFound()` / `error.tsx` too.

---

## Summary

App Router **i18n** = **`[locale]` segment** + middleware + dictionaries + localized metadata/hreflang. The **`next-intl`** library covers the client/server split. For the shop, an overview is enough before the capstone; full localization is a separate epic with an SEO review.

---

## Checklist

- [ ] Why there's no `i18n` key in next.config for the App Router
- [ ] The structure of `app/[locale]/layout.tsx`
- [ ] Middleware redirect and matcher exclusions
- [ ] Server-side dictionary loading
- [ ] `alternates.languages` for hreflang
- [ ] `Intl` for currency/dates
- [ ] Client switcher via `Link`

Next lesson: [34. Production build and standalone](34-production-build.md).
