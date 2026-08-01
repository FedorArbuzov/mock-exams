# 06. Layouts, templates, loading UI, parallel routes (overview)

## Introduction: a scenario from work

Demo for stakeholders. When you click "Catalog" → "Product #1" → "Product #2," the **sidebar with filters flickers** and resets scroll — because every page was manually re-rendering the whole layout. After adding `app/catalog/layout.tsx` the sidebar **stays put**, and only `{children}` changes.

Product asks: "Show a 200ms skeleton during transitions, not a white screen." We add `loading.tsx` — Next automatically wraps the segment in **Suspense**. Analytics complains: "The view counter in the header resets on every navigation" — that probably calls for a **template**, not a layout: a template **remounts** on every transition.

Parallel routes (`@modal`, `@sidebar`) are advanced; at the basic level an **overview** is enough, so you don't panic when you see `@` in someone else's PR.

## What you'll learn

- **Layout vs template** — persisting state vs remounting.
- Nested **layouts** for `/catalog/*`.
- **`loading.tsx`** — instant loading UI and the Suspense boundary.
- **`error.tsx`** (preview) — isolating errors per segment.
- **Parallel routes** — why `@folder` exists, without going deep into the implementation.
- The connection to streaming ([13-suspense-streaming.md](13-suspense-streaming.md)).

## Layout: UI that survives navigation

```tsx
// app/catalog/layout.tsx
export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="catalog-layout">
      <aside aria-label="Filters">
        <p>Categories (placeholder)</p>
      </aside>
      <section>{children}</section>
    </div>
  );
}
```

When navigating from `/catalog` → `/catalog/42`:

- **CatalogLayout does not remount** — React state in the sidebar is preserved.
- Only `children` changes (the active page).

```text
RootLayout (persist)
  └── CatalogLayout (persist)
        └── ProductPage → another ProductPage
```

The root layout should **never** remount on internal navigation — only the `{children}` swap.

## Template: remounts on every transition

```tsx
// app/catalog/template.tsx
export default function CatalogTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="catalog-template">{children}</div>;
}
```

If you have **both** a layout **and** a template:

```text
Layout (persist)
  └── Template (remount on navigation)
        └── Page
```

| | layout.tsx | template.tsx |
|---|------------|--------------|
| State on navigation | preserved | **reset** |
| useEffect on mount | not every route | **every** route |
| When to use | shell, nav, sidebar | enter animation, analytics ping |

For a shop, **just a layout** is usually enough. Templates are for page-transition animations or "fresh" analytics.

## loading.tsx — a skeleton without manual Suspense

```tsx
// app/catalog/loading.tsx
export default function CatalogLoading() {
  return (
    <div aria-busy="true" className="card">
      <p className="muted">Loading the catalog…</p>
      <div style={{ height: 8, background: "#eee", marginTop: 8 }} />
      <div style={{ height: 8, background: "#eee", marginTop: 8, width: "80%" }} />
    </div>
  );
}
```

Next automatically:

1. Wraps `page.tsx` in **Suspense**.
2. Shows `loading.tsx` until the page (async fetch) resolves.
3. **Streams** the HTML — the user sees the shell sooner ([13-suspense-streaming.md](13-suspense-streaming.md)).

```text
Request /catalog
  → RootLayout HTML immediately
  → CatalogLayout + loading.tsx
  → stream → CatalogPage with data
```

`loading.tsx` operates at the **segment level** where the file lives.

## error.tsx (preview)

```tsx
"use client"; // error boundaries — client

export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Catalog error</h2>
      <button type="button" onClick={() => reset()}>
        Retry
      </button>
    </div>
  );
}
```

Isolates the error **inside the segment** — the header from the root layout stays put. Covered in detail in [18-error-not-found.md](18-error-not-found.md).

## Nested layout example for the shop

```text
app/
├── layout.tsx              ← site header
└── catalog/
    ├── layout.tsx          ← catalog sidebar
    ├── loading.tsx
    ├── page.tsx            ← /catalog
    └── [id]/
        ├── loading.tsx     ← product card skeleton
        └── page.tsx
```

Two levels of loading — list vs. detail — give a better UX than a single global spinner.

## Parallel routes — overview

The `@slot` syntax:

```text
app/
├── layout.tsx
├── @modal/
│   └── default.tsx
├── @sidebar/
│   └── default.tsx
└── catalog/
    └── page.tsx
```

```tsx
export default function RootLayout({
  children,
  modal,
  sidebar,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <>
      {sidebar}
      {children}
      {modal}
    </>
  );
}
```

**Why:** independent **slots** (a modal over the page, dashboard panels), with separate loading/error states per slot. The mock-exams capstone might use an `@cart` drawer — at the basic level, just **know the term**.

`default.tsx` is the fallback shown when a slot isn't active.

## Layouts vs. the react-basic Outlet

| react-basic | App Router |
|-------------|------------|
| `<Outlet />` | `{children}` in a layout |
| `<Route element={<Layout>}>` | `layout.tsx` in a folder |
| manual `<Suspense>` | `loading.tsx` convention |

## Performance note

Layouts **don't automatically re-fetch** on child navigation — only the page segment does. If sidebar filter data lives in a layout fetch, be **careful** (caching, dedup — chapter 16).

## Common mistakes

**Duplicating the header in a nested layout.** The header belongs in root; the catalog layout should hold only catalog chrome.

**Waiting for a remount to reset a form — using a layout for that.** You need a **template**, or a key on the page, instead.

**Forgetting `"use client"` in error.tsx.** Error boundaries are client components.

**loading.tsx with a synchronous page.** The loading state won't show — the page is sync, the fetch is instant; for a demo, add `await delay` or a real fetch.

**Parallel routes without a `default.tsx`.** You get a 404 in the slot on hard refresh — you need a default.

**Confusing loading.tsx with an inline skeleton inside a page.** The loading convention is **segment-level**; an inline skeleton is fine-grained Suspense inside the page ([13-suspense-streaming.md](13-suspense-streaming.md)).

## Checklist

- [ ] You can explain layout persistence vs. template remounting
- [ ] You add `loading.tsx` for segments with an async fetch
- [ ] You understand nested layouts for `/catalog/*`
- [ ] You know that parallel routes are `@slot` + `default.tsx`
- [ ] You can sketch the layout tree for a shop catalog

Next lesson: [07. Lab: catalog and product page](07-lab-routing.md).
