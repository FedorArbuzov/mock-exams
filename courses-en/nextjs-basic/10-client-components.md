# 10. Client Components: `"use client"`, boundaries, and patterns

## Intro: a scenario from work

PR review. The diff: the first line of the new `Header.tsx` is `"use client"`. Reviewer: "Why client? It only has `<Link>` and text." The author added `"use client"` to **layout.tsx** "to make it work" — and the **whole site** became a client bundle, RSC benefits evaporated.

The mock-exams shop rule: **`"use client"` is a scalpel, not a blanket**. You put the directive in the file that **actually** needs hooks or browser APIs. Everything imported into a client file becomes client — **the boundary is contagious**.

After [09-server-components.md](09-server-components.md) you know server is the default. Here — how to draw **client islands**: buttons, cart, theme toggle, without turning the catalog into a SPA.

## What you'll learn

- The **`"use client"`** directive — what it does and where to put it.
- **Client boundary** — transitive client imports.
- Patterns: **leaf client**, **provider wrapper**, **composition** (preview 12).
- When you **don't** need client for `Link`.
- Server → client props interop (serialization rules).
- Anti-patterns at code review.

## "use client" — entry in a file

```tsx
"use client";

import { useState } from "react";

export function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false);

  return (
    <button type="button" onClick={() => setAdded(true)}>
      {added ? "In cart ✓" : "Add to cart"}
    </button>
  );
}
```

- The directive is the **first line** (before imports, comments are ok after a shebang).
- The file and **all its exports** are Client Components.
- It can be imported into a Server Component **as child JSX**:

```tsx
// Server — app/catalog/[id]/page.tsx
import { AddToCartButton } from "@/components/AddToCartButton";

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <section>
      <h1>Product</h1>
      <AddToCartButton productId={id} />
    </section>
  );
}
```

Server **imports** client — ok. Client **doesn't import** server — no.

## Boundary infection diagram

```text
ServerPage
  imports AddToCartButton ("use client")  →  boundary here
  AddToCartButton imports utils.ts       →  utils is client bundle too
  AddToCartButton imports BigChart       →  BigChart in the bundle (even without hooks!)
```

**Move** heavy non-interactive parts **out** of the client file — keep them in the server parent.

## When to add "use client"

| Needed | Client? |
|-------|---------|
| `useState`, `useReducer` | **yes** |
| `useEffect`, `useLayoutEffect` | **yes** |
| `useRef` for the DOM | **yes** |
| event handlers `onClick` | **yes** |
| `useRouter`, `usePathname` (navigation hooks) | **yes** |
| a Context Provider with state | **yes** |
| only `<Link>`, `<Image>`, static markup | **no** (server ok) |
| `async` fetch in the component body | **no** — server |

`Link` works in Server Components — that's not a reason for `"use client"` in a nav-only header.

## Leaf client pattern (shop)

```text
ProductCard (server)
  ├── Image, title, price — server HTML
  └── AddToCartButton (client leaf)
```

Minimal JS — just the button on each card.

## Provider wrapper pattern

TanStack Query, Theme, Cart context — client:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

```tsx
// app/layout.tsx — server
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Providers** — client; `{children}` can be **server pages** passed through — a supported pattern.

## Props: serialization

Server → Client props must be **JSON-serializable**:

| OK | NOT OK |
|----|--------|
| string, number, boolean | functions |
| plain object, array | Date (use a string) |
| null, undefined | class instances |
| JSX children (special) | Map, Set (convert) |

```tsx
<AddToCartButton productId="sku-001" price={8990} />
```

## children as a boundary trick (preview)

```tsx
"use client";
export function ClientShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div>{open && children}</div>;
}
```

```tsx
// server page
<ClientShell>
  <ServerHeavyList />  {/* passed as children — stays server! */}
</ClientShell>
```

Details — [12-composition-patterns.md](12-composition-patterns.md).

## use client in a layout — be careful

```tsx
"use client"; // in app/catalog/layout.tsx — BAD for all of /catalog/*
```

The whole catalog subtree becomes client. Prefer a server layout + client widgets inside the `{children}` slot.

## FastAPI mutations — client preview

A cart POST from the browser:

```tsx
"use client";

async function addToCart(productId: string) {
  await fetch("/api/cart", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}
```

The Route Handler `/api/cart` proxies :8090 — chapter 20. An alternative is a Server Action (chapter 21).

## DevTools: how to check

React DevTools marks client components. If **everything** is client — reconsider your boundaries.

## Common pitfalls

**"use client" in every file "for the future".** The bundle size grows.

**Importing `page.tsx` server utils into client.** Split modules: `lib/formatPrice.ts` is pure — ok for both; `lib/db.ts` is server only (the `import 'server-only'` package — optional).

**Passing a function prop server → client.** `onAdd={() => ...}` — only from a client parent.

**A ThemeProvider in the layout without need + the whole app client.** Isolate Providers, keep pages server.

**Duplicating on the client a fetch that's already server.** Single source — server fetch; client only for mutations.

## Checklist

- [ ] `"use client"` only where hooks/events are used
- [ ] A server page can import a client child
- [ ] Client doesn't import a server component
- [ ] You know the leaf pattern for AddToCart
- [ ] Props are serializable across the boundary

Next lesson: [11. Lab: split the server/client tree](11-lab-rsc-boundary.md).
