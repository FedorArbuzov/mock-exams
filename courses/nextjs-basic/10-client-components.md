# 10. Client Components: `"use client"`, границы и паттерны

## Введение: сценарий с работы

PR review. Diff: первая строка нового файла `Header.tsx` — `"use client"`. Reviewer: «Зачем client? Там только `<Link>` и текст». Автор добавил `"use client"` в **layout.tsx** «чтобы работало» — и **весь сайт** стал client bundle, RSC benefits evaporated.

Правило mock-exams shop: **`"use client"` — scalpel, не blanket**. Ставите директиву в файле, который **реально** нуждается в hooks или browser APIs. Всё, что импортируется в client file, становится client — **граница заразна**.

После [09-server-components.md](09-server-components.md) вы знаете server default. Здесь — как рисовать **client islands**: кнопки, корзина, theme toggle, без превращения каталога в SPA.

## Что вы узнаете

- Директива **`"use client"`** — что делает и где ставить.
- **Client boundary** — transitive client imports.
- Паттерны: **leaf client**, **provider wrapper**, **composition** (preview 12).
- Когда **не** нужен client для `Link`.
- Interop server → client props (serialization rules).
- Anti-patterns на code review.

## "use client" — entry in file

```tsx
"use client";

import { useState } from "react";

export function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false);

  return (
    <button type="button" onClick={() => setAdded(true)}>
      {added ? "В корзине ✓" : "В корзину"}
    </button>
  );
}
```

- Директива **первая строка** (до imports, comments ok after shebang).
- Файл и **все его exports** — Client Components.
- Можно import в Server Component **как child JSX**:

```tsx
// Server — app/catalog/[id]/page.tsx
import { AddToCartButton } from "@/components/AddToCartButton";

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <section>
      <h1>Товар</h1>
      <AddToCartButton productId={id} />
    </section>
  );
}
```

Server **импортирует** client — ok. Client **не импортирует** server — нет.

## Boundary infection diagram

```text
ServerPage
  imports AddToCartButton ("use client")  →  boundary здесь
  AddToCartButton imports utils.ts       →  utils тоже client bundle
  AddToCartButton imports BigChart       →  BigChart в bundle (даже если без hooks!)
```

**Выносите** тяжёлые non-interactive parts **out** of client file — оставьте в server parent.

## Когда ставить "use client"

| Нужно | Client? |
|-------|---------|
| `useState`, `useReducer` | **да** |
| `useEffect`, `useLayoutEffect` | **да** |
| `useRef` для DOM | **да** |
| event handlers `onClick` | **да** |
| `useRouter`, `usePathname` (navigation hooks) | **да** |
| Context Provider с state | **да** |
| только `<Link>`, `<Image>`, static markup | **нет** (server ok) |
| `async` fetch в component body | **нет** — server |

`Link` работает в Server Components — не оправдание для `"use client"` в nav-only header.

## Leaf client pattern (shop)

```text
ProductCard (server)
  ├── Image, title, price — server HTML
  └── AddToCartButton (client leaf)
```

Минимальный JS — только кнопка на каждой карточке.

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

**Providers** — client; `{children}` могут быть **server pages** passed through — supported pattern.

## Props: serialization

Server → Client props must be **JSON-serializable**:

| OK | NOT OK |
|----|--------|
| string, number, boolean | functions |
| plain object, array | Date (use string) |
| null, undefined | class instances |
| JSX children (special) | Map, Set (convert) |

```tsx
<AddToCartButton productId="sku-001" price={8990} />
```

## children as boundary trick (preview)

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
  <ServerHeavyList />  {/* передан как children — остаётся server! */}
</ClientShell>
```

Подробно — [12-composition-patterns.md](12-composition-patterns.md).

## use client in layout — осторожно

```tsx
"use client"; // в app/catalog/layout.tsx — ПЛОХО для всего /catalog/*
```

Весь subtree catalog — client. Prefer server layout + client widgets inside `{children}` slot.

## FastAPI mutations — client preview

POST корзины из browser:

```tsx
"use client";

async function addToCart(productId: string) {
  await fetch("/api/cart", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}
```

Route Handler `/api/cart` проксирует :8090 — глава 20. Альтернатива — Server Action (глава 21).

## DevTools: как проверить

React DevTools — client components помечены. Если **всё** client — пересмотрите boundaries.

## Типичные ошибки

**"use client" в каждом файле «на будущее».** Bundle size растёт.

**Import `page.tsx` server utils into client.** Split modules: `lib/formatPrice.ts` pure — ok both; `lib/db.ts` — server only (`import 'server-only'` package — optional).

**Передать function prop server → client.** `onAdd={() => ...}` — only from client parent.

**ThemeProvider в layout без необходимости + весь app client.** Isolate Providers, keep pages server.

**Дублировать fetch client то, что уже server.** Single source — server fetch, client только mutations.

## Чек-лист

- [ ] `"use client"` только где hooks/events
- [ ] Server page может import client child
- [ ] Client не import server component
- [ ] Знаете leaf pattern для AddToCart
- [ ] Props serializable across boundary

Следующий урок: [11. Лаба: разделить server/client дерево](11-lab-rsc-boundary.md).
