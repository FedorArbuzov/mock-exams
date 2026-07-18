# 09. React Server Components: зачем и как

## Введение: сценарий с работы

Security review. Auditor открывает DevTools → Sources и видит в bundle **строку подключения к internal API** и **mapper с полями margin** — потому что весь каталог был `"use client"` + `useEffect(fetch)`. Tech lead: «Данные и разметка списка — **Server Component**. В клиент уходит только кнопка “В корзину”».

Вы из react-basic привыкли: **компонент = браузер**, hooks everywhere. App Router **инвертирует default**: файлы в `app/` — **Server Components (RSC)**, если нет `"use client"`. Они выполняются **на Node** при запросе (или на build для static), **не** попадают в client JS bundle.

Эта глава — ментальная модель RSC без RFC-простыни. После неё ошибка «useState in page.tsx» станет понятной, а не загадочной.

## Что вы узнаете

- Что такое **RSC** и чем отличается от SSR React 18.
- **Server by default** в App Router.
- Что **можно** и **нельзя** в Server Component.
- Как RSC **сокращает bundle** shop-каталога.
- Fetch к FastAPI **:8090** на сервере (preview).
- Граница с Client Components ([10-client-components.md](10-client-components.md)).

## SSR vs RSC — не путать термины

| | Classic SSR (React 18) | RSC (Next App Router) |
|---|------------------------|------------------------|
| Где render | Server → HTML string | Server → **Flight tree** |
| Hydration | всё интерактивное дерево | только **client** subtrees |
| Bundle | весь component code в JS | server components **не в bundle** |
| Data fetch | getServerSideProps / manual | async component + fetch |

**Hydration** — клиент «оживляет» HTML. RSC **уменьшает** что нужно hydrate: статичная разметка карточки — server; клик — client button.

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
// app/catalog/page.tsx — Server Component (нет "use client")
export default async function CatalogPage() {
  const res = await fetch("http://localhost:8090/api/v1/items", {
    next: { revalidate: 60 },
  });
  const items = await res.json();

  return (
    <section>
      <h1>Каталог</h1>
      <ul>
        {items.map((item: { id: string; title: string }) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </section>
  );
}
```

- **`async` component** — legal только на server.
- **`fetch`** выполняется на сервере — токены не в браузере.
- Результат сериализуется в HTML + RSC payload.

## Что можно в Server Component

- `async/await`, прямой `fetch`, чтение файлов, DB drivers.
- `import fs from 'fs'` (server-only modules).
- Большие dependencies (markdown parser) — **не** в client bundle.
- Передача **serializable** props в client children (string, number, plain objects, arrays).

## Что нельзя в Server Component

| Запрещено | Почему |
|-----------|--------|
| `useState`, `useEffect`, hooks | нет lifecycle на server render |
| `onClick`, browser events | нет DOM на server |
| `window`, `document`, `localStorage` | browser-only |
| Context consumer некоторых client ctx | boundary |

Ошибка сборки типично:

```text
You're importing a component that needs useState.
It only works in a Client Component but none of its parents are marked with "use client"
```

**Fix:** client island или поднять `"use client"` точечно ([10-client-components.md](10-client-components.md)).

## Дерево shop: server + client (preview)

```text
CatalogPage (server)
  ├── ProductList (server)
  │     └── ProductCard (server)
  │           ├── title, price, image
  │           └── AddToCartButton (client) ← "use client"
  └── FiltersSidebar (client) ← if interactive
```

Правило **как можно ниже** push `"use client"` — меньше JS.

## RSC payload (Flight) — интуиция

Клиент не получает исходный TSX server component. Сервер отправляет **serialized tree**: placeholders для client components + HTML streams.

Вам не нужно парсить Flight вручную — Next абстрагирует. Важно: **нельзя** import server component **into** client file напрямую (reverse import). Можно передать как **children** ([12-composition-patterns.md](12-composition-patterns.md)).

## Fetch и FastAPI :8090

```tsx
const API = process.env.API_URL ?? "http://localhost:8090";

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const res = await fetch(`${API}/api/v1/items/${id}`, {
    cache: "no-store", // preview — всегда fresh
  });

  if (!res.ok) throw new Error("Failed to load product");

  const product = await res.json();
  return <h1>{product.title}</h1>;
}
```

`localhost:8090` с **сервера Next** — не CORS problem (не browser). CORS — когда fetch из browser ([18-cors в react-basic](../react-basic/18-cors-fastapi.md)).

## Кэш fetch (preview)

| Option | Поведение |
|--------|-----------|
| default | cached, deduped |
| `{ cache: 'no-store' }` | SSR каждый request |
| `{ next: { revalidate: 60 } }` | ISR-like |

Глава 16 — полная таблица.

## Когда оставить server

- Markdown docs, legal pages.
- Product list/detail **read-only** разметка.
- SEO-critical content.
- Access to secrets, server-only SDK.

## Когда нужен client

- `useState`, forms с instant validation.
- `useEffect`, subscriptions, browser APIs.
- TanStack Query client cache ([24-tanstack-query.md](24-tanstack-query.md)).
- Animations, drag-drop.

## Сравнение с react-basic mental model

```tsx
// react-basic — всё client
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

Меньше loading states на клиенте; `loading.tsx` покрывает suspense ([06-layouts-templates.md](06-layouts-templates.md)).

## Типичные ошибки

**Пометить весь `app/` как `"use client"`.** Потеря RSC — как Vite SPA с extra steps.

**`useState` в `page.tsx`.** Вынести интерактив в child client component.

**Import server component inside client file.** Нарушение boundary — use composition.

**Думать, что server = no interactivity ever.** Server renders static HTML; client siblings interactive.

**Fetch в server без обработки ошибок.** Unhandled throw → error.tsx ([18-error-not-found.md](18-error-not-found.md)).

**Секреты в NEXT_PUBLIC_.** `NEXT_PUBLIC_*` — в browser; API keys только server env ([28-env-config.md](28-env-config.md)).

## Чек-лист

- [ ] Объясняете RSC vs «весь React в браузере»
- [ ] Знаете запрет hooks в server files
- [ ] Можете описать fetch items на :8090 в Server Component
- [ ] Понимаете, что server code не в client bundle
- [ ] Готовы к `"use client"` в следующей главе

Следующий урок: [10. Client Components: `"use client"` и границы](10-client-components.md).
