# 06. Лаба: карточка товара

## Зачем эта лаба

[04-props.md](04-props.md) и [05-children-composition.md](05-children-composition.md) описали контракт компонента и обёртки. **Лаба** собирает **ProductCard** — первый «настоящий» кусок shop UI: title, price, optional badge, кнопка-заглушка «В корзину». Паттерн повторится в capstone при данных с FastAPI `:8090`; сейчас — mock-массив в `App.tsx`.

Вы тренируете: тип props, деструктуризацию, composition через `Card`, список карточек preview [07-lists-keys.md](07-lists-keys.md).

## Предварительно

- Лаба [03](03-lab-first-app.md) выполнена, `npm run dev` работает.
- Каталог: `courses/react-basic/examples/`.
- Эталон: [`examples/solutions/06-product-card/`](examples/solutions/) — после своей попытки.

---

## Задание 1. Тип Product и ProductCard

**Контекст:** контракт полей совпадёт с DRF/FastAPI item (id, name/title, price).

Создайте `src/types/product.ts`:

```tsx
export type Product = {
  id: number;
  title: string;
  price: number;
  badge?: string;
};
```

Создайте `src/components/ProductCard.tsx`:

```tsx
import type { Product } from "../types/product";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { title, price, badge } = product;

  return (
    <article className="product-card">
      {badge && <span className="product-card__badge">{badge}</span>}
      <h2>{title}</h2>
      <p className="product-card__price">€ {price.toFixed(2)}</p>
      <button type="button">В корзину</button>
    </article>
  );
}
```

**Критерий:** optional `badge` рендерится только если задан ([08-conditional-rendering.md](08-conditional-rendering.md)).

---

## Задание 2. Mock-каталог в App

**Контекст:** до главы 18 API недоступен — локальный массив как контракт-тест UI.

В `App.tsx`:

```tsx
import { ProductCard } from "./components/ProductCard";
import type { Product } from "./types/product";

const MOCK_PRODUCTS: Product[] = [
  { id: 1, title: "Mechanical Keyboard", price: 79.99, badge: "Sale" },
  { id: 2, title: "USB-C Hub", price: 34.5 },
  { id: 3, title: "Desk Lamp", price: 49.0, badge: "New" },
];

export function App() {
  return (
    <main className="app">
      <h1>Shop — react-basic</h1>
      <section className="catalog-grid">
        {MOCK_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </main>
  );
}
```

**Критерий:** три карточки, у первой badge «Sale».

---

## Задание 3. Стили сетки (минимум)

**Контекст:** визуальная проверка на review — не «простыня» в одну колонку.

В `src/index.css` добавьте:

```css
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
}

.product-card__badge {
  font-size: 0.75rem;
  background: #ffe082;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}
```

---

## Задание 4. Composition — Card wrapper (опционально +)

**Контекст:** единый стиль карточек для catalog и cart summary.

Создайте `src/components/Card.tsx` по образцу [05-children-composition.md](05-children-composition.md). Перепишите `ProductCard`, чтобы тело было внутри `<Card title={title}>...</Card>`.

**Критерий:** внешний вид сохранился, логика badge/price в ProductCard.

---

## Задание 5. Typecheck и build

```bash
npm run typecheck
npm run build
```

Намеренно передайте `price="79.99"` (string) в одной карточке — убедитесь, что TS ругается. Верните `number`.

---

## Критерии успеха

- [ ] `Product` тип в отдельном файле
- [ ] `ProductCard` принимает `product`, не три отдельных prop (можно иначе — но осознанно)
- [ ] Mock-массив из 3 товаров, `key={product.id}`
- [ ] Optional badge работает
- [ ] `typecheck` и `build` без ошибок

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| Duplicate key warning | Уникальные `id` в MOCK_PRODUCTS |
| `price.toFixed is not a function` | `price` передан строкой — нужны `{}` |
| Badge всегда виден | У второго товара нет `badge` в объекте? |
| Пустая сетка | Ошибка в map — смотрите Console |

## Связь с курсом

| Следующий шаг | Зачем |
|--------------|-------|
| [07. Списки и keys](07-lists-keys.md) | углубление map/key |
| [09. useState](09-useState.md) | кнопка «В корзину» заработает |
| [19. Лаба: fetch items](19-lab-fetch-items.md) | MOCK → API :8090 |

Следующий урок (теория): [07. Списки, keys, фрагменты](07-lists-keys.md).
