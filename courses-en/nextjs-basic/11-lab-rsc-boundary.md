# 11. Lab: ProductCard (server) + AddToCartButton (client)

## Why this lab

The theory in [09–10](09-server-components.md) described RSC and `"use client"`. The **lab** is the first **real split** for the shop: the product card renders on the server, and the "Add to cart" interactivity is a client leaf. That's what a typical PR looks like after a security review of "remove unnecessary JS."

The data is mock for now; the pattern is the same as with the `fetch` to :8090 in [15-lab-server-fetch.md](15-lab-server-fetch.md).

## Prerequisites

- [07. Lab routing](07-lab-routing.md) done.
- You've read [09. RSC](09-server-components.md) and [10. Client](10-client-components.md).
- The dev server:

```bash
cd courses/nextjs-basic/examples
npm run dev
```

Reference solutions — [`examples/solutions/11-rsc-boundary/`](examples/solutions/) — **after** your own attempt.

---

## Task 1. Client: AddToCartButton

**Context:** the only file with hooks in the card.

Create `components/AddToCartButton.tsx`:

```tsx
"use client";

import { useState } from "react";

type Props = {
  productId: string;
  title: string;
};

export function AddToCartButton({ productId, title }: Props) {
  const [status, setStatus] = useState<"idle" | "added">("idle");

  function handleClick() {
    setStatus("added");
    // lesson 25 — POST cart; for now local feedback
    console.log("add to cart", productId, title);
  }

  return (
    <button type="button" onClick={handleClick} className="card" style={{ marginTop: "1rem" }}>
      {status === "added" ? "Added ✓" : "Add to cart"}
    </button>
  );
}
```

**Criterion:** `"use client"` as the first line; `useState` works without build errors.

---

## Task 2. Server: ProductCard

**Context:** the markup and price are server, without the directive.

Create `components/ProductCard.tsx` (**without** `"use client"`):

```tsx
import { AddToCartButton } from "./AddToCartButton";

export type Product = {
  id: string;
  title: string;
  price: number;
  description?: string;
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card">
      <h2>{product.title}</h2>
      <p>{product.price.toLocaleString("ru-RU")} ₽</p>
      {product.description && <p className="muted">{product.description}</p>}
      <AddToCartButton productId={product.id} title={product.title} />
    </article>
  );
}
```

**Criterion:** a Server Component imports a client child — `npm run build` ok.

---

## Task 3. Wire it up on the product page

**Context:** `[id]/page.tsx` stays an async server page.

Update `app/catalog/[id]/page.tsx`:

```tsx
import { ProductCard } from "@/components/ProductCard";

type PageProps = {
  params: Promise<{ id: string }>;
};

const MOCK: Record<string, { title: string; price: number; description?: string }> = {
  "sku-001": { title: "Runner Sneakers", price: 8990, description: "Lightweight, for the city." },
  "sku-002": { title: "City Backpack", price: 4590 },
  "sku-003": { title: "Basic T-shirt", price: 1990 },
};

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const data = MOCK[id];

  if (!data) {
    return (
      <section>
        <h1>Product not found</h1>
      </section>
    );
  }

  return (
    <section>
      <ProductCard product={{ id, ...data }} />
    </section>
  );
}
```

Make sure `@/*` resolves ([`tsconfig.json`](examples/tsconfig.json)).

**Criterion:** the product page shows the card + a working button.

---

## Task 4. Catalog list — server grid

**Context:** reuse ProductCard on the list (compact — without description).

In `app/catalog/page.tsx`:

```tsx
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";

const ITEMS = [
  { id: "sku-001", title: "Runner Sneakers", price: 8990 },
  { id: "sku-002", title: "City Backpack", price: 4590 },
  { id: "sku-003", title: "Basic T-shirt", price: 1990 },
];

export default function CatalogPage() {
  return (
    <section>
      <h1>Catalog</h1>
      <div style={{ display: "grid", gap: "1rem" }}>
        {ITEMS.map((p) => (
          <div key={p.id}>
            <ProductCard product={p} />
            <Link href={`/catalog/${p.id}`} className="muted">
              Details →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Criterion:** three cards, each with a button; clicking "Add to cart" changes the text of only its own button.

---

## Task 5. Boundary check

**Context:** a code review checklist.

1. `npm run typecheck`
2. `npm run build` — no server/client warnings
3. React DevTools: `ProductCard` server, `AddToCartButton` client

In a comment in `ProductCard.tsx` (1–2 sentences): why the button is client and the card is server.

**Criterion:** build green; the comment in the spirit of a PR.

---

## Success criteria

- [ ] `AddToCartButton.tsx` with `"use client"` and `useState`
- [ ] `ProductCard.tsx` without the directive, imports the button
- [ ] Catalog and product pages use `ProductCard`
- [ ] The buttons are independent on the list page
- [ ] `npm run build` succeeds

## If something went wrong

| Symptom | Check |
|---------|----------|
| useState error in ProductCard | Keep `"use client"` only on the Button |
| Cannot import @/components | paths in tsconfig; the file is in `components/` |
| The whole page is client | No `"use client"` in page.tsx |
| Buttons sync state | Each ProductCard has its own AddToCartButton instance — ok |
| Build: serializable props | Don't pass functions to the Button |

## Related to the course

| Step | Lesson |
|-----|------|
| children pattern | [12-composition-patterns.md](12-composition-patterns.md) |
| Suspense skeleton | [13-suspense-streaming.md](13-suspense-streaming.md) |
| fetch product | [15-lab-server-fetch.md](15-lab-server-fetch.md) |

Next lesson (theory): [12. Composition: children and slots](12-composition-patterns.md).
