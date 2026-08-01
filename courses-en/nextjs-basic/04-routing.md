# 04. File-based routing: segments, nesting, index routes

## Intro: a scenario from work

Sprint planning. Product: "We need `/catalog`, `/catalog/electronics`, `/catalog/electronics/phones` — and a **shared** catalog sidebar across all three levels." In react-basic you'd write nested `<Route path="catalog/*">` and `<Outlet />`. In Next the route is **already drawn** by folders: `app/catalog/page.tsx`, `app/catalog/electronics/page.tsx`.

A junior created `app/catalog/electronics.tsx` — Next **ignores** the file: you need a **folder** `electronics/` with a `page.tsx`. Another created `app/(shop)/catalog/` — the URL stayed `/catalog`, not `/(shop)/catalog`: **route groups** in parentheses do **not** appear in the URL. This chapter is the rules of the game for file-based routing, with no surprises at code review.

After [03-lab-first-app.md](03-lab-first-app.md) you have `/catalog`. Now we'll learn to **nest** segments, understand **index** routes, and **group** routes for different layouts without changing the URL.

## What you'll learn

- How **nested folders** form a path.
- **Index route** — a `page.tsx` at each nesting level.
- **Route groups** `(name)` — organization without a prefix in the URL.
- When a segment does **not** appear in the URL (`page` vs `layout`-only).
- A comparison with React Router nested routes from react-basic.
- Preparation for dynamic `[id]` ([05-dynamic-routes.md](05-dynamic-routes.md)).

## The base rule: a folder = a URL segment

```text
app/catalog/page.tsx                    →  /catalog
app/catalog/electronics/page.tsx        →  /catalog/electronics
app/catalog/electronics/phones/page.tsx →  /catalog/electronics/phones
```

Each **leaf** `page.tsx` is a separate URL. Intermediate folders **without** a `page.tsx` are just a namespace (a layout can still exist — chapter 06).

```text
app/
└── catalog/
    ├── layout.tsx          ← wrapper for all of /catalog/*
    ├── page.tsx            ← /catalog  (catalog index)
    └── electronics/
        └── page.tsx        ← /catalog/electronics
```

## Index routes

An **index route** is a `page.tsx` in a segment's folder — the "root" of that segment:

| File path | URL | Role |
|------------|-----|------|
| `app/page.tsx` | `/` | the whole app's index |
| `app/catalog/page.tsx` | `/catalog` | catalog index |
| `app/catalog/[id]/page.tsx` | `/catalog/42` | not an index — dynamic |

React Router analog:

```tsx
<Route path="catalog">
  <Route index element={<CatalogHome />} />
  <Route path="electronics" element={<Electronics />} />
</Route>
```

```text
app/catalog/page.tsx              ≈ index
app/catalog/electronics/page.tsx  ≈ path="electronics"
```

## Nested layouts (preview)

`app/catalog/layout.tsx`:

```tsx
export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="catalog-shell">
      <aside>Filters (placeholder)</aside>
      <div>{children}</div>
    </div>
  );
}
```

The tree for `/catalog/electronics`:

```text
RootLayout
  └── CatalogLayout
        └── ElectronicsPage
```

The layout is **preserved** during client navigation between sibling routes under `/catalog/*` — the sidebar's state isn't reset ([06-layouts-templates.md](06-layouts-templates.md)).

## Route groups: `(groupName)`

Parentheses **exclude** the name from the URL — organization only:

```text
app/
├── (marketing)/
│   ├── layout.tsx       ← a different layout for the landing
│   ├── page.tsx         →  /  (conflict! only one root page)
│   └── about/
│       └── page.tsx     →  /about
└── (shop)/
    ├── catalog/
    │   └── page.tsx     →  /catalog
    └── cart/
        └── page.tsx     →  /cart
```

**Why at work:**

- different **layouts** for marketing vs shop without `/shop/catalog`;
- teams put code in `(team-a)/` vs `(team-b)/`;
- you **can't** have multiple root layouts without route groups at the same level — only one `app/page.tsx` for `/`.

```text
URL:  /catalog
FS:   app/(shop)/catalog/page.tsx
      ─────┬────
      not in the URL
```

## Colocation and private folders

| Pattern | In the URL? |
|---------|--------|
| `app/catalog/page.tsx` | yes |
| `app/catalog/_components/Card.tsx` | no |
| `app/_lib/formatPrice.ts` | no |

Importing from `_components` into `page.tsx` is a regular TypeScript import.

## Special files — a quick table

| File | Effect on routing |
|------|-------------------|
| `page.tsx` | makes the route **public** |
| `layout.tsx` | doesn't add a segment |
| `route.ts` | API endpoint, not a page |
| `default.tsx` | parallel routes (chapter 06, overview) |
| `template.tsx` | like a layout, but remounts (chapter 06) |

## Comparison with react-basic React Router

| React Router | App Router |
|--------------|------------|
| `<Routes>` + `<Route path>` | the `app/` tree |
| `path="catalog/:id"` | `app/catalog/[id]/page.tsx` |
| `<Outlet />` | `{children}` in `layout.tsx` |
| `Navigate to=` | `redirect()` / middleware |
| config in one file | colocation by the FS |

Next's plus: **less** "config vs files" divergence; the minus: **renaming a URL = renaming folders**.

## mock-exams shop routes (course roadmap)

```text
/                     app/page.tsx
/catalog              app/catalog/page.tsx
/catalog/[id]         app/catalog/[id]/page.tsx      ← lab 07
/contact              app/contact/page.tsx
/api/...              app/api/.../route.ts           ← chapter 19
```

FastAPI `:8090` stays `/api/v1/...` — Next doesn't duplicate the API path, only UI routes.

## Resolving: what Next sees on GET /catalog/electronics

```text
1. Match segments: catalog, electronics
2. Load layouts: root → catalog (if exists)
3. Load page: app/catalog/electronics/page.tsx
4. Render RSC tree → HTML
```

A 404 error means there's no `page.tsx` on any resolved leaf.

## Common pitfalls

**A file instead of a folder:** `catalog.tsx` is **not** a route. You need `catalog/page.tsx`.

**Two `page.tsx` for one URL:** duplicate routes — a build error.

**Thinking `(shop)` is visible in the URL.** Parentheses are only for the FS and layouts.

**Forgetting `page.tsx` on the parent:** `/catalog` 404s even though `/catalog/item` exists — you need the index `catalog/page.tsx`.

**A route group with two `app/page.tsx` at the root** without a careful split — conflict. One `/` per app.

**Copying react-router's `*` catch-all mentally** — Next uses different syntax: `[...slug]` ([05-dynamic-routes.md](05-dynamic-routes.md)).

## Checklist

- [ ] You can build a URL from the folder tree without hints
- [ ] You can explain a route group `(name)` — not in the path
- [ ] You know that `page.tsx` = a segment index
- [ ] You can map a nested Route to `app/a/b/page.tsx`
- [ ] You're ready for dynamic `[id]` in the next chapter

Next lesson: [05. Dynamic routes: `[id]`, catch-all, optional](05-dynamic-routes.md).
