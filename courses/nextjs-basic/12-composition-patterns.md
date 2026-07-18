# 12. Composition: передача Server Components в Client через children

## Введение: сценарий с работы

Architectural review. Команда сделала `InteractiveCatalog.tsx` с `"use client"` и **import** `ProductList` из `./ProductList.tsx` — список из 50 карточек уехал в client bundle, Lighthouse **TBT** вырос. Fix: `ProductList` **не импортировать** в client file, а **передать как children** из server page:

```tsx
// server page
<CartDrawer>
  <ProductList items={items} />
</CartDrawer>
```

`CartDrawer` — client (state open/close). `ProductList` — server, rendered **до** передачи — остаётся server component. Это **composition pattern** — главный инструмент держать `"use client"` **листьями**, не лесом.

Без этого паттерна RSC сводится к «всё client с лишним шагом». С ним — shop catalog как задумал Next.

## Что вы узнаете

- Почему **import server into client** запрещён.
- **`children` prop** как slot для server UI.
- Паттерны: **Modal**, **Tabs shell**, **Cart drawer**.
- **`{...}` slots** без parallel routes.
- Serializable props vs **ReactNode children**.
- Связь с Provider wrapper из [10-client-components.md](10-client-components.md).

## Проблема: import direction

```tsx
"use client";
import { ProductList } from "./ProductList"; // server file — ОШИБКА или forced client

export function Shell() {
  return <ProductList />;
}
```

**Правило App Router:** Client module **cannot** import Server module.

**Разрешено:**

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

Server **parent** импортирует **оба**; client получает **already rendered** server output как children.

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

Grid — server; modal interactivity — client wrapper.

## Named slots без @parallel (simple)

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

`FiltersPanel` и `ProductGrid` — server components passed as props (same as children rule — **ReactNode** from server ok).

## Provider + server children (recap)

```tsx
// layout.tsx server
<QueryProvider>
  {children}  {/* each page — server by default */}
</QueryProvider>
```

Provider client; pages не infected if Provider only wraps, не imports pages.

## Anti-pattern vs pattern

| Anti | Pattern |
|------|---------|
| Client layout imports server list | Server page composes list inside client shell |
| `"use client"` on ProductCard because button inside | Leaf AddToCartButton only ([11-lab-rsc-boundary.md](11-lab-rsc-boundary.md)) |
| Pass `items` to client and map in client | Map on server, pass rows as server HTML |

## Serialization reminder

**Children** — special: not serialized as JSON props over wire same way — React handles **composition at RSC boundary**.

Plain props to client still JSON-serializable:

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

If `CartProvider` client — **`ProductGrid` should be sibling composed from server**, not imported inside provider file:

```tsx
<CartProvider>
  <>
    <CatalogHeader count={items.length} />
    <ProductGrid items={items} />
  </>
</CartProvider>
```

Or split: server page renders grid **outside**, provider only wraps checkout button — depends on design.

## Parallel routes alternative (обзор)

For `@modal` slot — same idea, filesystem-level. Composition children — **80% cases** without `@`.

## Testing composition

1. Build — no «import server into client» errors.
2. View Source — product titles in HTML (server rendered).
3. DevTools — client only on interactive wrapper.

## Типичные ошибки

**Refactor ProductList into client file «for convenience».** Bundle bloat.

**Single `"use client"` parent imports all sections.** Split wrappers per interactive region.

**Pass server component as prop from client parent.** Client parent can't create server children — **server page** must compose.

**Confuse `children` with render props returning server from client.** Render prop `render={() => <Server />}` from client — broken; compose from server.

**Forget keys in lists inside server children.** Same as react-basic keys.

## Чек-лист

- [ ] Client не import server files
- [ ] Server page wraps client shell + server content as children
- [ ] Можете объяснить modal pattern для shop
- [ ] Named slots `sidebar`/`main` для collapsible UI
- [ ] ProductGrid остаётся server при client CartDrawer

Следующий урок: [13. Suspense, streaming, skeleton UI](13-suspense-streaming.md).
