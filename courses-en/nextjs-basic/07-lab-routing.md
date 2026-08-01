# 07. Lab: the `/catalog` and `/catalog/[id]` routes

## Why this lab

The theory in [04–06](04-routing.md) gave you file-based routing, dynamic `[id]`, and `loading.tsx`. The **lab** assembles the **shop catalog flow**: a list → a product card with a skeleton during loading. Still without FastAPI — hardcoded ids; in [15-lab-server-fetch.md](15-lab-server-fetch.md) you'll plug in a `fetch` to **:8090**.

At work an "Add product detail route" PR looks the same: `app/catalog/[id]/page.tsx`, a nested layout, loading states — before the API integration.

## Prerequisites

- [03. Lab](03-lab-first-app.md) done (`/catalog` placeholder).
- You've read [05. Dynamic routes](05-dynamic-routes.md) and [06. Layouts](06-layouts-templates.md).
- The dev server in **`courses/nextjs-basic/examples/`**:

```bash
cd courses/nextjs-basic/examples
npm run dev
```

Reference solutions — [`examples/solutions/07-routing/`](examples/solutions/) — **after** your own attempt.

---

## Task 1. Catalog layout with a sidebar

**Context:** the shared catalog chrome is a single layout, not copied into the page.

Create `app/catalog/layout.tsx`:

```tsx
export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="catalog-layout" style={{ display: "flex", gap: "1.5rem" }}>
      <aside className="card" style={{ minWidth: 180, padding: "1rem" }}>
        <strong>Filters</strong>
        <p className="muted" style={{ fontSize: "0.875rem" }}>
          Placeholder until server fetch
        </p>
      </aside>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
```

Open `/catalog` — the sidebar should appear.

**Criterion:** the sidebar is visible on `/catalog` and stays on `/catalog/[id]`.

---

## Task 2. Update the catalog page — a list of links

**Context:** simulating a list of SKUs before the API.

Replace the contents of `app/catalog/page.tsx`:

```tsx
import Link from "next/link";

const PLACEHOLDER_ITEMS = [
  { id: "sku-001", title: "Runner Sneakers" },
  { id: "sku-002", title: "City Backpack" },
  { id: "sku-003", title: "Basic T-shirt" },
];

export default function CatalogPage() {
  return (
    <section>
      <h1>Catalog</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {PLACEHOLDER_ITEMS.map((item) => (
          <li key={item.id} className="card" style={{ marginBottom: "0.75rem", padding: "1rem" }}>
            <Link href={`/catalog/${item.id}`}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

**Criterion:** the three links lead to `/catalog/sku-00X`.

---

## Task 3. Dynamic page `[id]`

**Context:** URL-driven detail — the basis of product SSR.

Create `app/catalog/[id]/page.tsx`:

```tsx
type PageProps = {
  params: Promise<{ id: string }>;
};

const MOCK: Record<string, { title: string; price: number }> = {
  "sku-001": { title: "Runner Sneakers", price: 8990 },
  "sku-002": { title: "City Backpack", price: 4590 },
  "sku-003": { title: "Basic T-shirt", price: 1990 },
};

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = MOCK[id];

  if (!product) {
    return (
      <section>
        <h1>Product not found</h1>
        <p className="muted">id: {id}</p>
      </section>
    );
  }

  return (
    <section>
      <h1>{product.title}</h1>
      <p>{product.price.toLocaleString("ru-RU")} ₽</p>
      <p className="muted">SKU: {id} · data from :8090 in lesson 15</p>
    </section>
  );
}
```

Check `/catalog/sku-001` and `/catalog/unknown`.

**Criterion:** `await params`; known ids show title/price.

---

## Task 4. loading.tsx for catalog and [id]

**Context:** UX during a slow fetch — a skeleton until lesson 15.

Create `app/catalog/loading.tsx`:

```tsx
export default function CatalogLoading() {
  return <p className="muted" aria-busy="true">Loading the list…</p>;
}
```

Create `app/catalog/[id]/loading.tsx`:

```tsx
export default function ProductLoading() {
  return (
    <div className="card" aria-busy="true">
      <div style={{ height: 24, width: "60%", background: "#eee" }} />
      <div style={{ height: 16, width: "30%", background: "#eee", marginTop: 12 }} />
    </div>
  );
}
```

To see the skeleton, temporarily add this in `[id]/page.tsx`:

```tsx
await new Promise((r) => setTimeout(r, 800));
```

before the return. **Remove** the delay after checking.

**Criterion:** with the artificial delay, the skeleton is visible, not a blank main.

---

## Task 5. Navigation smoke

**Context:** the layout sidebar shouldn't "flicker".

1. `/catalog` → click a product → `/catalog/sku-002`
2. Back → forward
3. The "Filters" sidebar stays in place

**Criterion:** the nested layout persists (theory 06).

---

## Success criteria

- [ ] `app/catalog/layout.tsx` with a sidebar
- [ ] `app/catalog/page.tsx` with links via `<Link>`
- [ ] `app/catalog/[id]/page.tsx` with `await params`
- [ ] `loading.tsx` for catalog and [id]
- [ ] `npm run build` succeeds

## If something went wrong

| Symptom | Check |
|---------|----------|
| `/catalog/[id]` 404 | The folder is literally `[id]`, with `page.tsx` inside |
| `params.id` undefined | `await params` (Next 15) |
| Sidebar disappears | The layout is in `app/catalog/layout.tsx`, not in the page |
| loading doesn't show | Is there an async delay or fetch? A sync page is instant |
| Link full reload | Use `next/link`, not `<a href>` |
| Build: duplicate slug | Two pages for one path? |

## Related to the course

| Step | Lesson |
|-----|------|
| Soft navigation | [08-navigation.md](08-navigation.md) |
| Server fetch items | [15-lab-server-fetch.md](15-lab-server-fetch.md) |
| notFound() | [18-error-not-found.md](18-error-not-found.md) |

Next lesson (theory): [08. Link, useRouter, soft navigation](08-navigation.md).
