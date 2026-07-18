# 13. Лаба: фильтр каталога

## Зачем эта лаба

[12-lifting-state.md](12-lifting-state.md) описал поднятие state к родителю. **Лаба** — мини-страница каталога mock-exams shop: `CategoryFilter` + `ProductGrid`, общий `category` в `CatalogPage`, derived list без второго useState. Mock-данные с полем `category`; позже те же поля придут из FastAPI `:8090`.

Вы соберёте controlled select, empty state, immutability — и увидите, что siblings **синхронны** без prop drilling глубже одного уровня.

## Предварительно

- [06-lab-props.md](06-lab-props.md), [11-lab-state.md](11-lab-state.md).
- `npm run dev` в `examples/`.
- Эталон: [`examples/solutions/13-catalog-filter/`](examples/solutions/).

---

## Задание 1. Расширить тип Product

В `src/types/product.ts`:

```tsx
export type Product = {
  id: number;
  title: string;
  price: number;
  category: "electronics" | "home" | "office";
  badge?: string;
};
```

Обновите `MOCK_PRODUCTS` в `App.tsx` (минимум 6 товаров, все три категории):

```tsx
const MOCK_PRODUCTS: Product[] = [
  { id: 1, title: "Mechanical Keyboard", price: 79.99, category: "electronics", badge: "Sale" },
  { id: 2, title: "USB-C Hub", price: 34.5, category: "electronics" },
  { id: 3, title: "Desk Lamp", price: 49.0, category: "home" },
  { id: 4, title: "Office Chair", price: 299.0, category: "office" },
  { id: 5, title: "Notebook Set", price: 12.0, category: "office" },
  { id: 6, title: "Smart Bulb", price: 19.99, category: "home" },
];
```

---

## Задание 2. CategoryFilter (controlled)

Создайте `src/components/CategoryFilter.tsx`:

```tsx
export type Category = "all" | "electronics" | "home" | "office";

type CategoryFilterProps = {
  value: Category;
  onChange: (next: Category) => void;
};

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <label className="category-filter">
      Категория
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Category)}
      >
        <option value="all">Все</option>
        <option value="electronics">Electronics</option>
        <option value="home">Home</option>
        <option value="office">Office</option>
      </select>
    </label>
  );
}
```

**Критерий:** компонент **не** содержит `useState` для category.

---

## Задание 3. ProductGrid (presentational)

Создайте `src/components/ProductGrid.tsx`:

```tsx
import { ProductCard } from "./ProductCard";
import type { Product } from "../types/product";

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return <p className="empty">Нет товаров в этой категории</p>;
  }

  return (
    <div className="catalog-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## Задание 4. CatalogPage — lift state

Создайте `src/components/CatalogPage.tsx`:

```tsx
import { useState } from "react";
import type { Product } from "../types/product";
import { CategoryFilter, type Category } from "./CategoryFilter";
import { ProductGrid } from "./ProductGrid";

type CatalogPageProps = {
  products: Product[];
};

export function CatalogPage({ products }: CatalogPageProps) {
  const [category, setCategory] = useState<Category>("all");

  const visibleProducts =
    category === "all"
      ? products
      : products.filter((p) => p.category === category);

  return (
    <section className="catalog-page">
      <CategoryFilter value={category} onChange={setCategory} />
      <ProductGrid products={visibleProducts} />
    </section>
  );
}
```

В `App.tsx`:

```tsx
import { CatalogPage } from "./components/CatalogPage";

export function App() {
  return (
    <main className="app">
      <h1>Shop — react-basic</h1>
      <CatalogPage products={MOCK_PRODUCTS} />
    </main>
  );
}
```

**Критерий:** смена select мгновенно меняет сетку; «Office» показывает 2 карточки; пустая категория — если добавите тестовый товар только в одну категорию и выберете другую.

---

## Задание 5. Стили и typecheck

Добавьте в `index.css`:

```css
.catalog-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-filter select {
  margin-left: 0.5rem;
}

.empty {
  color: #666;
  font-style: italic;
}
```

```bash
npm run typecheck
npm run build
```

В комментарии в `CatalogPage.tsx` (2–3 предложения): почему `visibleProducts` **не** хранят в отдельном `useState`.

---

## Критерии успеха

- [ ] `category` state только в `CatalogPage`
- [ ] `CategoryFilter` — controlled (`value` + `onChange`)
- [ ] `ProductGrid` не фильтрует сам
- [ ] Empty state при пустом результате фильтра
- [ ] `key={product.id}` сохранён
- [ ] Комментарий про derived vs duplicated state

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| Фильтр не влияет на список | State в Filter, не в Page? |
| Все категории пустые | Опечатка в `category` строках vs Product type |
| TS error on select onChange | Cast `as Category` или validate |
| Дубли карточек | Duplicate ids в MOCK |

## Связь с курсом

| Следующий шаг | Зачем |
|--------------|-------|
| [14. useEffect](14-useEffect.md) | side effects |
| [17. fetch в React](17-fetch-react.md) | products с API |
| [26. URL state](26-url-state.md) | category в query string |
| [29. Context](29-context.md) | когда lift слишком глубок |

Следующий урок (теория): [14. useEffect: синхронизация с внешним миром](14-useEffect.md).
