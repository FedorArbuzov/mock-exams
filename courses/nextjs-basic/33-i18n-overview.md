# 33. Internationalization (i18n): обзор App Router

## Сценарий с работы: «Нужен /en/catalog к релизу в EU»

PM: «Сейчас только русский, через месяц — английский и казахский. URL должны быть `/ru/catalog`, `/en/catalog`, hreflang для SEO, переключатель языка без полного reload как в старом PHP». Вы смотрите документацию Next.js — **нет** встроенного i18n routing как в Pages Router (`i18n` в `next.config.js`). В App Router паттерн — **dynamic segment `[locale]`** + dictionaries + middleware.

Это **обзорная** глава: полная локализация shop — extension capstone ([39-capstone.md](39-capstone.md)). Цель — понять архитектуру, не внедрять 3 языка во все 40 уроков.

---

## Что вы узнаете

- Почему App Router i18n — **самостоятельный** паттерн, не config flag.
- Структура **`app/[locale]/...`** и root redirect.
- **Middleware** для default locale и cookie.
- Dictionaries: JSON files vs CMS.
- **`generateStaticParams`** для locales.
- SEO: `hreflang`, localized metadata.
- Связь с [`next-intl`](https://next-intl.dev) (рекомендуемая lib).

---

## Архитектура: segment `[locale]`

```text
app/
  [locale]/
    layout.tsx       # lang на <html>, providers
    page.tsx         # home
    catalog/
      page.tsx
    items/
      [id]/
        page.tsx
  layout.tsx         # optional root redirect only
```

URL:

```text
/ru/catalog
/en/catalog
/en/items/42
```

**Root `/`** — middleware redirect на `/ru` или negotiates `Accept-Language`.

```tsx
// middleware.ts (упрощённо)
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

Matcher **исключает** `api`, `_next`, static files с extension.

---

## Layout с locale

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

## Dictionaries (словари)

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

**Server Components** загружают только нужный JSON — не тащите все языки в client bundle.

---

## Client Components и hooks

Client islands (корзина, theme) нуждаются в **`useTranslations`** — библиотека **`next-intl`**:

```tsx
"use client";
import { useTranslations } from "next-intl";

export function AddToCartButton() {
  const t = useTranslations("cart");
  return <button>{t("add")}</button>;
}
```

Provider в `[locale]/layout.tsx`:

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

## Navigation между локалями

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

`Link` сохраняет client navigation без full reload ([08-navigation.md](08-navigation.md)).

---

## Форматирование: dates, numbers, currency

Не хардкодьте `toFixed(2) + " ₽"`:

```tsx
new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "RUB",
}).format(price);
```

```tsx
new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date());
```

Server и client должны использовать **один locale** из params.

---

## RTL (опционально)

Для арабского (`ar`):

```tsx
<html lang="ar" dir="rtl">
```

Tailwind: `rtl:` variants или logical properties (`ms-`, `me-`).

---

## Static vs dynamic locales

| Подход | Когда |
|--------|-------|
| `generateStaticParams` для locales | 2–5 языков, SSG-friendly |
| Dynamic only | CMS добавляет языки |
| Subdomains `en.shop.com` | middleware rewrite, сложнее cookies |

---

## Сравнение с Pages Router i18n

| Pages Router | App Router |
|--------------|------------|
| `i18n` in `next.config.js` | `[locale]` segment |
| `router.locale` | params.locale |
| Automatic prefix | middleware + structure |

Миграция Pages → App: **перестройка** каталога `app/`, не toggle config.

---

## Shop mock-exams: минимальный scope

Если внедрять i18n в capstone:

1. Locales: `ru`, `en`.
2. Перевести UI strings (catalog, cart, contact) — **не** контент товаров с API (они на одном языке от backend).
3. Middleware default `ru`.
4. hreflang на catalog + item pages.
5. Metadata localized titles.

Backend `:8090` может позже отдать `title_en` — BFF merge в Route Handler ([19-route-handlers.md](19-route-handlers.md)).

---

## Типичные ошибки

**Дублирование `app/catalog` и `app/[locale]/catalog`** — выберите одну схему.

**Middleware matcher ловит `_next/static`** — broken assets; используйте negative lookahead.

**Все JSON словари в client bundle** — import только нужного locale на server.

**Забыли `lang` на `<html>`** — screen readers wrong language.

**hreflang на URL без locale prefix** — inconsistent с routing.

**Hardcoded `/catalog` links** — должны быть `/${locale}/catalog`.

**Перевод error messages только на клиенте** — server `notFound()` / `error.tsx` тоже локализуйте.

---

## Резюме

App Router **i18n** = **`[locale]` segment** + middleware + dictionaries + localized metadata/hreflang. Библиотека **`next-intl`** закрывает client/server split. Для shop достаточно обзора до capstone; полная локализация — отдельный epic с SEO review.

---

## Чек-лист

- [ ] Почему нет `i18n` key в next.config для App Router
- [ ] Структура `app/[locale]/layout.tsx`
- [ ] Middleware redirect и matcher exclusions
- [ ] Server-side dictionary loading
- [ ] `alternates.languages` для hreflang
- [ ] `Intl` для currency/dates
- [ ] Client switcher через `Link`

Следующий урок: [34. Production build и standalone](34-production-build.md).
