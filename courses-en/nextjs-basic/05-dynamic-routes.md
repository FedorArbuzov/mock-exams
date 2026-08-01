# 05. Dynamic routes: `[id]`, catch-all, optional catch-all

## Intro: a scenario from work

Friday, prod. Marketing shares the link `/catalog/sneaker-x-pro` — **404**. It turned out that in the SPA there was a single `ProductDetail` component with `useParams().id`. In Next, a junior created `app/catalog/product/page.tsx` — a URL hardwired to `/catalog/product`, not `/catalog/42`.

Tech lead: "A dynamic segment is a **folder in square brackets** `[id]`; params arrive in the page props." Another case: the CMS serves `/docs/getting-started/install` — you need a **catch-all** `[...slug]`. And `/settings` **and** `/settings/profile` — an **optional catch-all** `[[...slug]]`.

After this chapter you'll build `/catalog/[id]` in [07-lab-routing.md](07-lab-routing.md) and wire up a product fetch from FastAPI `:8090` in chapter 14.

## What you'll learn

- **Dynamic segment** `[param]` and typed `params` in Next.js 15.
- **Catch-all** `[...slug]` for arbitrary path depth.
- **Optional catch-all** `[[...slug]]` — zero or more segments.
- `generateStaticParams` (an SSG preview for N products).
- The difference from React Router's `:id`, and common params pitfalls.

## Dynamic segment `[id]`

```text
app/catalog/[id]/page.tsx  →  /catalog/1, /catalog/sneaker-x, /catalog/anything
```

```tsx
// app/catalog/[id]/page.tsx
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <section>
      <h1>Product: {id}</h1>
      <p className="muted">
        Placeholder. In lesson 15 we'll fetch GET /api/v1/items/{id} from :8090.
      </p>
    </section>
  );
}
```

**Next.js 15:** `params` (and `searchParams`) is a **Promise**; you need `await params`. This is a breaking change from 14 — it comes up in interviews.

react-basic comparison:

```tsx
// React Router
const { id } = useParams();
```

```tsx
// App Router — server page
const { id } = await params;
```

## Parameter names

The `[id]` folder → the `id` key. `[productId]` → `productId`. The folder name = the prop name in `params`.

| File folder | URL | params |
|----------------|-----|--------|
| `[id]` | `/catalog/42` | `{ id: "42" }` |
| `[category]/[id]` | `/catalog/shoes/42` | `{ category: "shoes", id: "42" }` |

## Catch-all: `[...slug]`

A single segment, an **array** of path parts:

```text
app/docs/[...slug]/page.tsx
```

| URL | params.slug |
|-----|-------------|
| `/docs/a` | `["a"]` |
| `/docs/a/b/c` | `["a", "b", "c"]` |
| `/docs` | **404** — needs at least one segment |

```tsx
type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export default async function DocsPage({ params }: PageProps) {
  const { slug } = await params;
  const path = slug.join("/");

  return (
    <article>
      <h1>Docs: {path}</h1>
    </article>
  );
}
```

Use case: CMS markdown paths, a nested help center without a separate file for each level.

## Optional catch-all: `[[...slug]]`

```text
app/settings/[[...slug]]/page.tsx
```

| URL | params.slug |
|-----|-------------|
| `/settings` | `undefined` or handle it as `[]` |
| `/settings/profile` | `["profile"]` |
| `/settings/profile/email` | `["profile", "email"]` |

```tsx
export default async function SettingsPage({ params }: PageProps) {
  const { slug } = await params;
  const parts = slug ?? [];

  if (parts.length === 0) {
    return <p>General shop settings</p>;
  }

  return <p>Section: {parts.join(" / ")}</p>;
}
```

A single `page.tsx` covers the index + nesting — handy for a tab-like settings UI.

## Comparison of the three forms

| Syntax | `/base` | `/base/x` | `/base/x/y` |
|-----------|---------|-----------|-------------|
| `[id]` | 404 | match | 404 (one segment) |
| `[...slug]` | 404 | match | match |
| `[[...slug]]` | match | match | match |

## generateStaticParams (SSG preview)

For ISR/SSG of a product list, Next can **prebuild** the known ids:

```tsx
export async function generateStaticParams() {
  const res = await fetch("http://localhost:8090/api/v1/items?limit=100");
  const items: { id: string }[] = await res.json();

  return items.map((item) => ({ id: item.id }));
}
```

The build creates HTML for each `id`; an unknown id is on-demand SSR (depends on `dynamicParams`, default `true`). Cache details — [16-caching-revalidate.md](16-caching-revalidate.md).

## searchParams vs params

```tsx
// /catalog?sort=price&page=2
type PageProps = {
  searchParams: Promise<{ sort?: string; page?: string }>;
};

export default async function CatalogPage({ searchParams }: PageProps) {
  const { sort, page } = await searchParams;
  // filter on the server
}
```

`params` is the **path**; `searchParams` is the **query string**. Both are Promises in Next 15.

## notFound() for a nonexistent product

```tsx
import { notFound } from "next/navigation";

const res = await fetch(`http://localhost:8090/api/v1/items/${id}`);
if (res.status === 404) notFound();
```

Renders `not-found.tsx` ([18-error-not-found.md](18-error-not-found.md)).

## FastAPI :8090 and the id

A REST API typically:

```text
GET /api/v1/items       → a list
GET /api/v1/items/{id}  → a single product
```

Dynamic `[id]` in Next **mirrors** the last segment of the API path — the type doesn't have to match (a string in the URL is always a string; parse `Number(id)` carefully).

## Common pitfalls

**Forgetting `await params` in Next 15.** Runtime warning / an empty id.

**An `[id].tsx` file instead of an `[id]/page.tsx` folder.** Dynamic is a **folder** with brackets.

**A catch-all on `/docs` without optional.** You need `[[...slug]]`.

**Confusing `slug` as string vs string[].** A catch-all is always an **array**.

**Hardcoding `product` in the path instead of `[id]`.** SEO URLs require a dynamic segment.

**Passing a number in the URL without validation.** `NaN` in the UI — validate with Zod ([typescript-basic](../typescript-basic/README.md)).

## Checklist

- [ ] You create `app/catalog/[id]/page.tsx` with `await params`
- [ ] You can explain the difference between `[...slug]` and `[[...slug]]`
- [ ] You know that params/path is a Promise in Next 15
- [ ] You can connect `[id]` to a GET item on :8090
- [ ] You remember `notFound()` for a 404 product

Next lesson: [06. Layouts, templates, loading UI](06-layouts-templates.md).
