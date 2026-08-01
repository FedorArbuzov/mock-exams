# 12. Composition: passing Server Components into Client via children

## Introduction: a scenario from work

Architectural review. The team built `InteractiveCatalog.tsx` with `"use client"` and **imported** `ProductList` from `./ProductList.tsx` — a list of 50 cards ended up in the client bundle, and Lighthouse's **TBT** shot up. Fix: **don't import** `ProductList` in the client file — **pass it as children** from the server page instead:

```tsx
// server page
<CartDrawer>
  <ProductList items={items} />
</CartDrawer>
```

`CartDrawer` is client (open/close state). `ProductList` is server, rendered **before** being passed in — it stays a server component. This is the **composition pattern** — the main tool for keeping `"use client"` at the **leaves**, not spreading it through the whole tree.

Without this pattern, RSC just becomes "everything client with an extra step." With it, the shop catalog works the way Next intended.

## What you'll learn

- Why **importing server into client** is forbidden.
- The **`children` prop** as a slot for server UI.
- Patterns: **Modal**, **Tabs shell**, **Cart drawer**.
- **`{...}` slots** without parallel routes.
- Serializable props vs **ReactNode children**.
- The connection to the Provider wrapper from [10-client-components.md](10-client-components.md).

## The problem: import direction

```tsx
"use client";
import { ProductList } from "./ProductList"; // server file — ERROR or forced client

export function Shell() {
  return <ProductList />;
}
```

**App Router rule:** a Client module **cannot** import a Server module.

**Allowed:**

```tsx
// ServerPage.tsx (server)
import { ClientShell } from "./ClientShell";
import { ProductList } from "./ProductList";

export default function Page() {
  return (
    <ClientShell>
      <ProductList />
    </ClientShell>
  );
}
```

```tsx
"use client";
export function ClientShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return <div className="shell">{children}</div>;
}
```

The server **parent** imports **both**; the client receives the **already rendered** server output as children.

## Mental model

```text
1. Server renders ProductList → RSC output
2. Server renders ClientShell with children slot = that output
3. Client hydrates ClientShell only; children slot — server HTML embedded
```

## Modal pattern (shop quick view)

```tsx
// app/catalog/page.tsx — server
import { ProductGrid } from "./_components/ProductGrid";
import { QuickViewModal } from "./_components/QuickViewModal";

export default async function CatalogPage() {
  const items = await getItems(); // :8090 later

  return (
    <QuickViewModal>
      <ProductGrid items={items} />
    </QuickViewModal>
  );
}
```

```tsx
"use client";
// QuickViewModal.tsx
export function QuickViewModal({ children }: { children: React.ReactNode }) {
  const [sku, setSku] = useState<string | null>(null);

  return (
    <>
      <div onClickCapture={(e) => { /* delegate sku from data attr */ }}>
        {children}
      </div>
      {sku && <dialog open>Preview {sku}</dialog>}
    </>
  );
}
```

Grid is server; modal interactivity is a client wrapper.

## Named slots without @parallel (simple)

```tsx
"use client";
type Props = {
  sidebar: React.ReactNode;
  main: React.ReactNode;
};

export function TwoColumnClient({ sidebar, main }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="grid">
      {!collapsed && <aside>{sidebar}</aside>}
      <section>{main}</section>
    </div>
  );
}
```

```tsx
// server
<TwoColumnClient
  sidebar={<FiltersPanel categories={cats} />}
  main={<ProductGrid items={items} />}
/>
```

`FiltersPanel` and `ProductGrid` are server components passed as props (same rule as children — **ReactNode** from server is fine).

## Provider + server children (recap)

```tsx
// layout.tsx server
<QueryProvider>
  {children}  {/* each page — server by default */}
</QueryProvider>
```

Provider is client; pages aren't infected as long as the Provider only wraps them and doesn't import them.

## Anti-pattern vs pattern

| Anti | Pattern |
|------|---------|
| Client layout imports server list | Server page composes the list inside a client shell |
| `"use client"` on ProductCard because there's a button inside | Leaf AddToCartButton only ([11-lab-rsc-boundary.md](11-lab-rsc-boundary.md)) |
| Pass `items` to client and map in client | Map on server, pass rows as server HTML |

## Serialization reminder

**Children** are special: not serialized as JSON props over the wire the same way — React handles **composition at the RSC boundary**.

Plain props to a client component still need to be JSON-serializable:

```tsx
<ClientCounter initialCount={0} />  // ok
<ClientCounter config={{ theme: "dark" }} />  // ok
<ClientCounter onSave={save} />  // FAIL — function
```

## FastAPI data flow with composition

```tsx
export default async function Page() {
  const items = await fetch("http://localhost:8090/api/v1/items").then(r => r.json());

  return (
    <CartProvider>
      <CatalogHeader count={items.length} />
      <ProductGrid items={items} />
    </CartProvider>
  );
}
```

If `CartProvider` is client — **`ProductGrid` should be a sibling composed from the server**, not imported inside the provider file:

```tsx
<CartProvider>
  <>
    <CatalogHeader count={items.length} />
    <ProductGrid items={items} />
  </>
</CartProvider>
```

Or split it: the server page renders the grid **outside**, and the provider only wraps the checkout button — depends on the design.

## Parallel routes alternative (overview)

For an `@modal` slot — same idea, at the filesystem level. Composition via children covers **80% of cases** without `@`.

## Testing composition

1. Build — no "import server into client" errors.
2. View Source — product titles appear in the HTML (server rendered).
3. DevTools — client only on the interactive wrapper.

## Common mistakes

**Refactoring ProductList into a client file "for convenience."** Bundle bloat.

**A single `"use client"` parent importing all sections.** Split wrappers per interactive region.

**Passing a server component as a prop from a client parent.** A client parent can't create server children — the **server page** has to compose them.

**Confusing `children` with a render prop returning server content from client.** A render prop like `render={() => <Server />}` from client — broken; compose from server instead.

**Forgetting keys in lists inside server children.** Same rule as in react-basic.

## Checklist

- [ ] Client doesn't import server files
- [ ] Server page wraps the client shell + server content as children
- [ ] You can explain the modal pattern for the shop
- [ ] Named slots `sidebar`/`main` for collapsible UI
- [ ] ProductGrid stays server while CartDrawer is client

Next lesson: [13. Suspense, streaming, skeleton UI](13-suspense-streaming.md).
