# 02. App Router: the `app/` directory, layout, page, colocation

## Intro: a scenario from work

Code review, Tuesday. A junior dev added a header to `app/page.tsx` — it works on the home page. On `/catalog`, the header is gone: "I only copied the page, I didn't touch the layout." Senior: "In React Router we wrapped `<Routes>` in a `<Layout>` inside `App.tsx`. In Next, **layout is a file**, not a component you put in every page."

You open [`examples/app/layout.tsx`](examples/app/layout.tsx): `<html>`, `<body>`, `<header>`, `{children}`. Any page under `app/` automatically renders **inside** this shell. Product asks to "put the nav in one place" — that's already done in the starter code; your job in the lab is to add new **route segments** without duplicating the header.

Next.js 15's App Router is **convention over configuration**: the URL is read straight from the folder tree. After this chapter, you'll stop looking for "where are the routes declared," the way you used to with `routes.tsx` in react-basic.

## What you'll learn

- The structure of the **`app/`** directory and its special files: `layout.tsx`, `page.tsx`.
- How **route segments** (folders) map to URLs.
- **Colocation** — placing components next to the route they belong to, not only in `components/`.
- Root layout vs nested layouts (a preview).
- Why files under `app/` are **Server Components by default**.
- How this connects to [`examples/app/page.tsx`](examples/app/page.tsx) and the home route `/`.

## The `app/` directory — the heart of the App Router

In the **Pages Router** (legacy), routes lived under `pages/`. In this course, we only use the **App Router** (`app/`):

```text
app/
├── layout.tsx       → wrapper for every route (root layout)
├── page.tsx         → URL /
├── globals.css
└── catalog/
    └── page.tsx     → URL /catalog   (you'll add this in the lab)
```

**Rule:** a folder = a URL **segment** (unless a special file hides the segment). A `page.tsx` file is what makes a segment **reachable** as a page.

| File | Required | Role |
|------|------------|------|
| `layout.tsx` | yes, for root | shared UI, `{children}` |
| `page.tsx` | yes, for a URL | the route's unique content |
| `loading.tsx` | no | loading skeleton (chapter 06) |
| `error.tsx` | no | error boundary (chapter 18) |
| `not-found.tsx` | no | custom 404 segment |

## Root layout: the HTML document, defined once

```tsx
// app/layout.tsx — simplified from examples
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Shop — nextjs-basic", template: "%s | Shop" },
  description: "Next.js App Router course mock-exams",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <header className="site-header">
          <nav>
            <Link href="/">Shop</Link>
            <Link href="/catalog">Catalog</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
```

**Important:**

- Only the **root** layout contains `<html>` and `<body>`.
- `{children}` is a slot for the active page (plus any nested layouts).
- The `metadata` export handles SEO ([31-metadata-seo.md](31-metadata-seo.md)).
- No `"use client"` — this is a **Server Component**.

## page.tsx — the route's content

```tsx
// app/page.tsx
export default function HomePage() {
  return (
    <section>
      <h1>Shop — nextjs-basic</h1>
      <p className="muted">
        Fullstack catalog built on Next.js App Router. API — FastAPI on port 8090.
      </p>
    </section>
  );
}
```

The default export **must** be a component (sync or async). The function name is only for DevTools — it has no effect on the URL.

Compare with react-basic:

```tsx
// react-basic — route in JSX
<Route path="/" element={<HomePage />} />
```

```text
// nextjs-basic — route in the FS
app/page.tsx  →  /
```

## Route segments and URLs

```text
app/
├── page.tsx                 → /
├── catalog/
│   ├── page.tsx             → /catalog
│   └── [id]/
│       └── page.tsx         → /catalog/42
└── contact/
    └── page.tsx             → /contact
```

The **`catalog`** segment is a folder. Without a `page.tsx` inside it, the folder **doesn't** produce a URL (it can still be layout-only — more on that later, rarely covered in the basics).

**Private folders:** a `_components` prefix, or folders outside `app/`, don't create URLs. Colocation:

```text
app/catalog/
├── page.tsx
├── _components/
│   └── CatalogGrid.tsx    ← not part of the URL, sits next to the route
└── [id]/
    └── page.tsx
```

The underscore `_` is the convention for "not a route segment" (Next won't expose a `_folder` as a URL).

## Colocation vs a global `components/`

| Approach | When to use it |
|--------|-------|
| `app/catalog/_components/` | UI used only by the catalog |
| `components/ui/Button.tsx` | reused everywhere |

mock-exams: the header in the root layout is global; `ProductCard`, coming later, sits next to the catalog or lives in `components/`.

## Server by default

Files under `app/` without `"use client"` are **Server Components**:

- can be `async` and `await fetch` (chapter 14);
- **cannot** use `useState`, `useEffect`, or browser APIs;
- don't add to the client JS bundle.

Client islands are covered in [10-client-components.md](10-client-components.md).

## The render tree for `/`

```text
RootLayout
  ├── <header> nav </header>
  └── <main>
        └── HomePage (page.tsx)
```

For `/catalog`, it's the same layout, with `{children}` being `CatalogPage`.

## Metadata and the title template

```typescript
title: {
  default: "Shop — nextjs-basic",
  template: "%s | Shop",
}
```

A product page that exports `title: "Sneakers"` gets `<title>Sneakers | Shop</title>`.

## Connecting to FastAPI :8090

For now, `page.tsx` is just static text. In chapter 14:

```tsx
export default async function CatalogPage() {
  const res = await fetch("http://localhost:8090/api/v1/items");
  const items = await res.json();
  // ...
}
```

The fetch runs **on the server** when `/catalog` is requested (SSR).

## Common pitfalls

**Duplicating `<html>` in a nested layout.** Only the root layout should have it. A nested layout is just `<section>{children}</section>`.

**Looking for `App.tsx` or `main.tsx`.** The entry point is `app/layout.tsx` plus `page.tsx`.

**Expecting a URL from a folder without `page.tsx`.** You need a `page.tsx` (or a `route.ts` for an API endpoint).

**Adding `"use client"` to the root layout "just in case."** The whole subtree becomes client-rendered — you lose RSC. Use client components sparingly ([10-client-components.md](10-client-components.md)).

**Wrong casing:** `Page.tsx` won't work on Linux CI — only `page.tsx` is recognized.

**Importing CSS outside layout/page.** Global styles go in the root layout (`globals.css`); CSS Modules live next to the component ([29-styling.md](29-styling.md)).

## Checklist

- [ ] You can explain the role of `layout.tsx` vs `page.tsx`
- [ ] You can sketch the `app/` tree → URL mapping for `/` and `/catalog`
- [ ] You know files under `app/` are Server Components by default
- [ ] You understand colocating `_components` next to a route
- [ ] You've seen the starter code in `examples/app/`

Next lesson: [03. Lab: your first Next.js app](03-lab-first-app.md).
