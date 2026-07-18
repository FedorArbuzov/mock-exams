# 35. Структура проекта: features, components, hooks, api

## Введение: «Куда положить useCart и fetchItems?»

После лаб [30-lab-context.md](30-lab-context.md) и [34-lab-typescript.md](34-lab-typescript.md) в `src/` десяток файлов без правил. Новый разработчик создаёт `utils/cart.tsx` с JSX и `components/fetch.ts` с hooks. Code review: «Нужна feature-based структура до capstone».

Структура — **соглашение**, не закон React. Цель mock-exams shop SPA: найти код за 30 секунд, масштабировать до capstone [38-capstone.md](38-capstone.md) и react-intermediate без rewrite.

## Что вы узнаете

- Layer vs feature folders.
- Рекомендуемое дерево для `react-basic/examples`.
- Границы: `api/`, `hooks/`, `components/`, `features/`, `pages/`.
- Barrel exports — когда да и нет.
- Colocation vs shared.
- Связь с TypeScript paths и Vite aliases.

---

## Проблема flat `src/`

```text
src/
  App.tsx
  Catalog.tsx
  Cart.tsx
  theme.tsx
  items.ts
  ProductCard.tsx
  useCart.ts
  ...
```

Работает до ~15 файлов. Дальше — неясно, что **shared**, что **catalog-only**, где **API**.

---

## Целевая структура (react-basic / capstone)

```text
src/
├── main.tsx                 # entry, StrictMode, mount
├── app/
│   ├── App.tsx              # routes shell
│   ├── providers.tsx        # Theme, Cart, QueryClient
│   └── routes.tsx           # route definitions (optional split)
├── pages/                   # route-level components (thin)
│   ├── CatalogPage.tsx
│   ├── ItemDetailPage.tsx
│   ├── CartPage.tsx
│   └── NotFoundPage.tsx
├── features/                # domain slices
│   ├── catalog/
│   │   ├── components/
│   │   │   ├── ProductCard.tsx
│   │   │   └── CatalogToolbar.tsx
│   │   ├── hooks/
│   │   │   └── useCatalogFilters.ts
│   │   └── index.ts         # optional public API
│   └── cart/
│       ├── context/
│       │   └── CartContext.tsx
│       └── components/
│           └── CartLineItem.tsx
├── components/              # truly shared UI (no domain)
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── Spinner.tsx
│   └── feedback/
│       ├── ErrorPanel.tsx
│       ├── EmptyState.tsx
│       └── ProductListSkeleton.tsx
├── hooks/                   # generic hooks
│   └── useDebouncedValue.ts
├── api/
│   ├── client.ts            # BASE_URL, fetch wrapper
│   └── items.ts             # fetchItems, fetchItemById
├── types/
│   └── item.ts
├── context/                 # or inside features/*/context
│   └── ThemeContext.tsx
└── styles/
    ├── index.css
    └── tokens.css
```

**Правило:** `pages/` — **компоновка** route; логика — в `features/` и `hooks/`.

---

## Слои ответственности

```mermaid
flowchart TB
  pages[pages] --> features[features]
  pages --> components[components/ui]
  features --> api[api]
  features --> hooks[hooks]
  features --> components
  api --> types[types]
  app[app/providers] --> features
```

| Слой | Ответственность | Не содержит |
|------|-----------------|-------------|
| `pages/` | route params, layout, wire hooks | 300 строк JSX business logic |
| `features/*` | catalog, cart, auth domain | generic Button |
| `components/ui` | design primitives | fetch, cart state |
| `api/` | HTTP, URLs `:8090` | React hooks |
| `hooks/` | reusable use* | cart-specific (→ features/cart) |
| `types/` | shared interfaces | components |

---

## api/client.ts

Единая точка для FastAPI:

```tsx
const BASE =
  import.meta.env.VITE_API_URL ?? "http://localhost:8090";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new ApiError(`GET ${path} failed`, res.status);
  }
  return res.json() as Promise<T>;
}
```

`items.ts`:

```tsx
import { apiGet } from "./client";
import type { ItemsResponse, Item } from "../types/item";

export function fetchItems() {
  return apiGet<ItemsResponse>("/api/v1/items");
}

export function fetchItemById(id: number) {
  return apiGet<Item>(`/api/v1/items/${id}`);
}
```

См. [18-cors-fastapi.md](18-cors-fastapi.md), [api-design](../api-design/README.md).

---

## Feature public API (barrel)

`features/catalog/index.ts`:

```tsx
export { ProductCard } from "./components/ProductCard";
export { useCatalogFilters } from "./hooks/useCatalogFilters";
```

Import:

```tsx
import { ProductCard } from "@/features/catalog";
```

**Осторожно:** barrels могут ухудшить tree-shaking и circular deps. В basic — optional; capstone — export только **public** surface.

---

## Path aliases (Vite)

`vite.config.ts`:

```ts
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Colocation

ProductCard styles рядом:

```text
features/catalog/components/ProductCard/
  ProductCard.tsx
  ProductCard.module.css
```

Тесты (javascript-testing):

```text
ProductCard.test.tsx  # рядом или __tests__
```

---

## Что куда класть из пройденных уроков

| Код из урока | Путь |
|--------------|------|
| ThemeProvider | `context/ThemeContext.tsx` или `features/theme/` |
| CartProvider | `features/cart/context/` |
| useDebouncedValue | `hooks/useDebouncedValue.ts` |
| fetchItems | `api/items.ts` |
| CatalogPage | `pages/CatalogPage.tsx` |
| ErrorPanel | `components/feedback/ErrorPanel.tsx` |
| Query keys | `api/queryKeys.ts` или `features/catalog/queryKeys.ts` |

---

## Anti-patterns

### God `components/` folder

200 файлов без подпапок — хуже flat src.

### `utils/` свалка

`utils/cart.tsx` with JSX — rename to feature. `utils/formatPrice.ts` — OK.

### Circular imports

`ProductCard` imports `CatalogPage` imports `ProductCard` — extract shared types to `types/`.

### API calls inside components

```tsx
// CatalogPage.tsx — плохо для тестов
useEffect(() => { fetch("8090...") }, []);
```

Prefer `api/items.ts` + Query ([20-tanstack-query.md](20-tanstack-query.md)).

### Premature micro-frontends

Один Vite app для react-basic — **monolith SPA** достаточен.

---

## Масштабирование к capstone

Capstone [38-capstone.md](38-capstone.md) добавляет:
- `features/items/` — CRUD forms
- `pages/AdminItemFormPage.tsx`
- `api/items.ts` — POST/PUT если API расширен

Не создавайте второй проект — evolve `examples/` или `examples/capstone/`.

---

## Соглашения именования

| Artifact | Convention |
|----------|------------|
| Component file | PascalCase `ProductCard.tsx` |
| hook file | camelCase `useCart.ts` |
| page | `*Page.tsx` |
| context | `*Context.tsx` + `use*` hook |
| api module | plural resource `items.ts` |
| CSS module | match component name |

Default export vs named: **named exports** для components — лучше refactor и grep.

---

## README в examples

Документируйте:

- `npm run dev`
- `VITE_API_URL`
- ссылка на `deploy/fastapi`
- структура папок одним абзацем

---

## Типичные ошибки

**pages с 400 строк** — extract feature hooks ([28-custom-hooks.md](28-custom-hooks.md)).

**Дублирование BASE URL** — только `api/client.ts`.

**Shared component imports feature** — direction: feature → ui, not ui → cart.

**index.ts re-export everything** — circular dependency hell.

---

## Резюме

Организуйте shop SPA: `app/` providers + routes, `pages/` thin, `features/` domain, `components/` shared UI, `api/` + `types/` для `:8090`. Capstone и review проходят быстрее с предсказуемыми путями.

## Чек-лист

- [ ] Разница `pages/` и `features/`
- [ ] Где `fetchItems` и почему не в component
- [ ] Что в `components/ui` vs `features/catalog`
- [ ] Alias `@/` настроен
- [ ] Cart context в feature cart, не в api

Следующий урок: [36. DevTools](36-devtools.md).
