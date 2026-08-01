# 09. React Server Components: why and how

## Intro: a scenario from work

Security review. The auditor opens DevTools → Sources and sees, in the bundle, the **connection string to the internal API** and a **mapper with margin fields** — because the entire catalog was `"use client"` + `useEffect(fetch)`. Tech lead: "The data and the list markup — that's a **Server Component**. Only the 'Add to cart' button goes to the client."

Coming from react-basic you're used to: **component = browser**, hooks everywhere. The App Router **inverts the default**: files in `app/` are **Server Components (RSC)** unless there's a `"use client"`. They run **on Node** at request time (or at build for static), and do **not** end up in the client JS bundle.

This chapter is a mental model of RSC without the RFC wall of text. After it, the "useState in page.tsx" error becomes clear rather than mysterious.

## What you'll learn

- What **RSC** is and how it differs from React 18 SSR.
- **Server by default** in the App Router.
- What you **can** and **cannot** do in a Server Component.
- How RSC **shrinks the bundle** of a shop catalog.
- Fetching FastAPI **:8090** on the server (preview).
- The boundary with Client Components ([10-client-components.md](10-client-components.md)).

## SSR vs RSC — don't confuse the terms

| | Classic SSR (React 18) | RSC (Next App Router) |
|---|------------------------|------------------------|
| Where it renders | Server → HTML string | Server → **Flight tree** |
| Hydration | the whole interactive tree | only **client** subtrees |
| Bundle | all component code in JS | server components **not in the bundle** |
| Data fetch | getServerSideProps / manual | async component + fetch |

**Hydration** — the client "brings the HTML to life." RSC **reduces** what needs hydrating: a card's static markup is server; a click is a client button.

```text
Browser bundle (client):
  - AddToCartButton.tsx
  - CartProvider.tsx
  NOT:
  - ProductList.tsx (server)
  - formatPrice.ts used only on server
```

## Server by default

```tsx
// app/catalog/page.tsx — Server Component (no "use client")
export default async function CatalogPage() {
  const res = await fetch("http://localhost:8090/api/v1/items", {
    next: { revalidate: 60 },
  });
  const items = await res.json();

  return (
    <section>
      <h1>Catalog</h1>
      <ul>
        {items.map((item: { id: string; title: string }) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </section>
  );
}
```

- An **`async` component** — legal only on the server.
- **`fetch`** runs on the server — tokens aren't in the browser.
- The result is serialized into HTML + an RSC payload.

## What you can do in a Server Component

- `async/await`, direct `fetch`, reading files, DB drivers.
- `import fs from 'fs'` (server-only modules).
- Large dependencies (a markdown parser) — **not** in the client bundle.
- Passing **serializable** props to client children (string, number, plain objects, arrays).

## What you cannot do in a Server Component

| Forbidden | Why |
|-----------|--------|
| `useState`, `useEffect`, hooks | no lifecycle in a server render |
| `onClick`, browser events | no DOM on the server |
| `window`, `document`, `localStorage` | browser-only |
| a consumer of some client contexts | boundary |

A typical build error:

```text
You're importing a component that needs useState.
It only works in a Client Component but none of its parents are marked with "use client"
```

**Fix:** a client island, or hoist `"use client"` surgically ([10-client-components.md](10-client-components.md)).

## The shop tree: server + client (preview)

```text
CatalogPage (server)
  ├── ProductList (server)
  │     └── ProductCard (server)
  │           ├── title, price, image
  │           └── AddToCartButton (client) ← "use client"
  └── FiltersSidebar (client) ← if interactive
```

The rule is push `"use client"` **as low as possible** — less JS.

## The RSC payload (Flight) — intuition

The client doesn't receive the original server component TSX. The server sends a **serialized tree**: placeholders for client components + HTML streams.

You don't need to parse Flight by hand — Next abstracts it. What matters: you **can't** import a server component **into** a client file directly (a reverse import). You can pass it as **children** ([12-composition-patterns.md](12-composition-patterns.md)).

## Fetch and FastAPI :8090

```tsx
const API = process.env.API_URL ?? "http://localhost:8090";

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const res = await fetch(`${API}/api/v1/items/${id}`, {
    cache: "no-store", // preview — always fresh
  });

  if (!res.ok) throw new Error("Failed to load product");

  const product = await res.json();
  return <h1>{product.title}</h1>;
}
```

`localhost:8090` from the **Next server** is not a CORS problem (it's not a browser). CORS applies when fetching from the browser ([18-cors in react-basic](../react-basic/18-cors-fastapi.md)).

## Fetch cache (preview)

| Option | Behavior |
|--------|-----------|
| default | cached, deduped |
| `{ cache: 'no-store' }` | SSR on every request |
| `{ next: { revalidate: 60 } }` | ISR-like |

Chapter 16 — the full table.

## When to keep it server

- Markdown docs, legal pages.
- Product list/detail **read-only** markup.
- SEO-critical content.
- Access to secrets, a server-only SDK.

## When you need client

- `useState`, forms with instant validation.
- `useEffect`, subscriptions, browser APIs.
- TanStack Query client cache ([24-tanstack-query.md](24-tanstack-query.md)).
- Animations, drag-and-drop.

## Comparison with the react-basic mental model

```tsx
// react-basic — all client
function Catalog() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch("/api/v1/items").then(r => r.json()).then(setItems);
  }, []);
  return <ul>...</ul>;
}
```

```tsx
// nextjs-basic — fetch on server
async function Catalog() {
  const items = await fetch(...).then(r => r.json());
  return <ul>...</ul>;
}
```

Fewer loading states on the client; `loading.tsx` covers suspense ([06-layouts-templates.md](06-layouts-templates.md)).

## Common pitfalls

**Marking the entire `app/` as `"use client"`.** You lose RSC — like a Vite SPA with extra steps.

**`useState` in `page.tsx`.** Move the interactivity into a child client component.

**Importing a server component inside a client file.** A boundary violation — use composition.

**Thinking server = no interactivity ever.** The server renders static HTML; client siblings are interactive.

**Fetch in a server component with no error handling.** An unhandled throw → error.tsx ([18-error-not-found.md](18-error-not-found.md)).

**Secrets in NEXT_PUBLIC_.** `NEXT_PUBLIC_*` goes to the browser; API keys go only in server env ([28-env-config.md](28-env-config.md)).

## Checklist

- [ ] You can explain RSC vs "all of React in the browser"
- [ ] You know hooks are forbidden in server files
- [ ] You can describe fetching items from :8090 in a Server Component
- [ ] You understand server code isn't in the client bundle
- [ ] You're ready for `"use client"` in the next chapter

Next lesson: [10. Client Components: `"use client"` and boundaries](10-client-components.md).
