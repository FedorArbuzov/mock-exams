# 08. Navigation: `Link`, `useRouter`, soft navigation

## Intro: a scenario from work

A QA bug: "Clicking through the catalog **flashes the whole screen**, loses scroll, and is slow." The cause — a developer replaced `<Link>` with `<a href="/catalog">` "for simplicity." A full page reload: CSS, JS, the RSC payload all re-fetched from scratch.

In react-basic, React Router did **client-side navigation** via the History API. Next's **`<Link>`** from `next/link` is the same idea, plus an RSC prefetch for visible links. Programmatic navigation — `useRouter()` from **`next/navigation`** (not `next/router` — that's the Pages Router legacy).

After [07-lab-routing.md](07-lab-routing.md) you have a product list with `<Link>`. This chapter is the rules of navigation, prefetch, `replace`, `back`, and when you actually need a hard reload.

## What you'll learn

- The **`<Link>`** component vs `<a>`.
- **`useRouter`** from `next/navigation`: `push`, `replace`, `refresh`, `back`.
- **Soft navigation** — no full reload, layouts preserved.
- **Prefetch** — how Next preloads routes.
- **`redirect()`** on the server (preview).
- The difference from React Router's `useNavigate`.

## Link — declarative navigation

```tsx
import Link from "next/link";

<Link href="/catalog">Catalog</Link>
<Link href="/catalog/sku-001">Sneakers</Link>
```

Renders an `<a>` with the correct href (SEO, open in a new tab), but intercepts the click for a **client transition**.

| | `<a href>` | `<Link href>` |
|---|------------|---------------|
| Full reload | yes | **no** (same-origin) |
| Layout persist | no | **yes** |
| Prefetch | no | yes (default) |
| SEO crawl | yes | yes |

The starter [`layout.tsx`](examples/app/layout.tsx) already uses `<Link>` for nav.

### Link props (common ones)

```tsx
<Link href="/catalog" prefetch={false}>
  Catalog without prefetch
</Link>

<Link href="/catalog" replace>
  Replace the history entry (not push)
</Link>

<Link href="/catalog" scroll={false}>
  Don't scroll to the top after navigating
</Link>
```

`className`, `children` — like a regular anchor wrapper.

## useRouter — imperative navigation

Only in a **Client Component**:

```tsx
"use client";

import { useRouter } from "next/navigation";

export function GoToCartButton() {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.push("/cart")}>
      To the cart
    </button>
  );
}
```

| Method | Action |
|-------|----------|
| `router.push(href)` | navigate, add to history |
| `router.replace(href)` | navigate without a new history entry |
| `router.back()` | history back |
| `router.forward()` | history forward |
| `router.refresh()` | re-fetch the server data of the **current** route |
| `router.prefetch(href)` | manual prefetch |

**Don't confuse:** `next/router` (Pages) vs **`next/navigation`** (App Router).

react-basic comparison:

```tsx
const navigate = useNavigate();
navigate("/catalog");
```

```tsx
const router = useRouter();
router.push("/catalog");
```

## Soft navigation under the hood (simplified)

```text
Click <Link /catalog/42>
    │
    ▼
Next client router
    │
    ├─ fetch RSC payload for /catalog/42 (Flight)
    ├─ update browser URL (pushState)
    ├─ reconcile React tree — swap page segment
    └─ layouts above the page — REUSE (no remount)
```

The user doesn't see a white document flash; the header from the root layout stays.

## Prefetch

By default Next **prefetches** `<Link>`s in the viewport (production + dev with caveats):

- preloads the JS and RSC for the target route;
- the transition feels instant.

Many links (1000 SKUs) — consider `prefetch={false}` on lists or pagination.

## redirect() on the server

```tsx
import { redirect } from "next/navigation";

export default async function LegacyProductPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/catalog/${id}`);
}
```

HTTP 307 — **not** a client hook. Use case: canonical URLs, auth guard (chapter 27).

## usePathname and useSearchParams

```tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";

export function ActiveNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link href={href} className={active ? "active" : undefined}>
      {children}
    </Link>
  );
}
```

`useSearchParams()` — the query string on the client; on the server — the page's `searchParams` prop ([05-dynamic-routes.md](05-dynamic-routes.md)).

## External links and the API

```tsx
<Link href="https://docs.mock-exams.local">Docs</Link>
<a href="http://localhost:8090/docs" target="_blank" rel="noopener noreferrer">
  OpenAPI FastAPI
</a>
```

External — a regular `<a>`. FastAPI `:8090` is a different origin, don't use `<Link>` for API calls.

## Navigation after a mutation (preview)

After a Server Action form, often:

```tsx
router.refresh(); // refresh the server components on the current page
router.push("/thank-you");
```

Chapter 21 — Server Actions.

## scrollRestoration

Next scrolls to the top on navigation by default. For a long catalog:

```tsx
<Link href={`/catalog/${id}`} scroll={false}>
```

Or manual scroll restore — advanced.

## Common pitfalls

**`<a href="/catalog">` for internal routes.** A full reload — you lose the RSC benefits.

**`useRouter` from `next/router`.** App Router → **`next/navigation`**.

**`useRouter` in a Server Component.** Hooks are client-only — move the button into `"use client"`.

**Expecting `router.push` to update the URL and server state synchronously in the same tick.** For fresh data — `router.refresh()`.

**A Link to a dynamic route without a string template.** `href={"/catalog/" + id}` is fine; an object `{ pathname, query }` is Pages style — in App, use a string.

**Prefetch on an admin page with sensitive data.** Disable prefetch for auth routes.

## Checklist

- [ ] Internal links — `<Link>`, external — `<a>`
- [ ] `useRouter` only from `next/navigation` in a client component
- [ ] You can explain soft navigation vs a full reload
- [ ] You know `router.refresh()` after server-side changes
- [ ] Active nav via `usePathname`

Next lesson: [09. React Server Components: why and how](09-server-components.md).
