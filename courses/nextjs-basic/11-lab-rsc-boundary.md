# 11. Лаба: ProductCard (server) + AddToCartButton (client)

## Зачем эта лаба

Теория [09–10](09-server-components.md) описала RSC и `"use client"`. **Лаба** — первый **реальный split** для shop: карточка товара рендерится на сервере, интерактив «В корзину» — client leaf. Так выглядит типичный PR после security review «убрать лишний JS».

Данные пока mock; паттерн тот же, что с `fetch` :8090 в [15-lab-server-fetch.md](15-lab-server-fetch.md).

## Предварительно

- Выполнена [07. Лаба routing](07-lab-routing.md).
- Прочитаны [09. RSC](09-server-components.md) и [10. Client](10-client-components.md).
- Dev-сервер:

```bash
cd courses/nextjs-basic/examples
npm run dev
```

Эталоны — [`examples/solutions/11-rsc-boundary/`](examples/solutions/) — **после** своей попытки.

---

## Задание 1. Client: AddToCartButton

**Контекст:** единственный файл с hooks в карточке.

Создайте `components/AddToCartButton.tsx`:

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
    // урок 25 — POST cart; сейчас local feedback
    console.log("add to cart", productId, title);
  }

  return (
    <button type="button" onClick={handleClick} className="card" style={{ marginTop: "1rem" }}>
      {status === "added" ? "Добавлено ✓" : "В корзину"}
    </button>
  );
}
```

**Критерий:** `"use client"` первой строкой; `useState` работает без ошибок сборки.

---

## Задание 2. Server: ProductCard

**Контекст:** разметка и цена — server, без директивы.

Создайте `components/ProductCard.tsx` (**без** `"use client"`):

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

**Критерий:** Server Component импортирует client child — `npm run build` ok.

---

## Задание 3. Подключить на странице товара

**Контекст:** `[id]/page.tsx` остаётся async server page.

Обновите `app/catalog/[id]/page.tsx`:

```tsx
import { ProductCard } from "@/components/ProductCard";

type PageProps = {
  params: Promise<{ id: string }>;
};

const MOCK: Record<string, { title: string; price: number; description?: string }> = {
  "sku-001": { title: "Кроссовки Runner", price: 8990, description: "Лёгкие, для города." },
  "sku-002": { title: "Рюкзак City", price: 4590 },
  "sku-003": { title: "Футболка Basic", price: 1990 },
};

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const data = MOCK[id];

  if (!data) {
    return (
      <section>
        <h1>Товар не найден</h1>
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

Убедитесь, что `@/*` резолвится ([`tsconfig.json`](examples/tsconfig.json)).

**Критерий:** страница товара показывает card + рабочую кнопку.

---

## Задание 4. Список каталога — server grid

**Контекст:** reuse ProductCard на list (compact — без description).

В `app/catalog/page.tsx`:

```tsx
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";

const ITEMS = [
  { id: "sku-001", title: "Кроссовки Runner", price: 8990 },
  { id: "sku-002", title: "Рюкзак City", price: 4590 },
  { id: "sku-003", title: "Футболка Basic", price: 1990 },
];

export default function CatalogPage() {
  return (
    <section>
      <h1>Каталог</h1>
      <div style={{ display: "grid", gap: "1rem" }}>
        {ITEMS.map((p) => (
          <div key={p.id}>
            <ProductCard product={p} />
            <Link href={`/catalog/${p.id}`} className="muted">
              Подробнее →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
```

**Критерий:** три картоches, каждая с кнопкой; клик «В корзину» меняет текст только у своей кнопки.

---

## Задание 5. Проверка boundary

**Контекст:** code review checklist.

1. `npm run typecheck`
2. `npm run build` — без warning про server/client
3. React DevTools: `ProductCard` server, `AddToCartButton` client

В комментарии в `ProductCard.tsx` (1–2 предложения): почему кнопка client, а card server.

**Критерий:** build green; комментарий в PR spirit.

---

## Критерии успеха

- [ ] `AddToCartButton.tsx` с `"use client"` и `useState`
- [ ] `ProductCard.tsx` без директивы, импортирует button
- [ ] Catalog и product pages используют `ProductCard`
- [ ] Кнопки независимы на list page
- [ ] `npm run build` успешен

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| useState error in ProductCard | Уберите `"use client"` только с Button |
| Cannot import @/components | paths в tsconfig; файл в `components/` |
| Вся страница client | Нет `"use client"` в page.tsx |
| Кнопки sync state | Каждая ProductCard — свой AddToCartButton instance — ok |
| Build: serializable props | Не передавайте functions в Button |

## Связь с курсом

| Шаг | Урок |
|-----|------|
| children pattern | [12-composition-patterns.md](12-composition-patterns.md) |
| Suspense skeleton | [13-suspense-streaming.md](13-suspense-streaming.md) |
| fetch product | [15-lab-server-fetch.md](15-lab-server-fetch.md) |

Следующий урок (теория): [12. Composition: children и slots](12-composition-patterns.md).
