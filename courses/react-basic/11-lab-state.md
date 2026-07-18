# 11. Лаба: корзина и счётчик

## Зачем эта лаба

[09-useState.md](09-useState.md) и [10-events-controlled.md](10-events-controlled.md) дали теорию state и событий. **Лаба** соединяет их: mini-cart для mock-exams shop — счётчик товаров, кнопки +/-, controlled input qty, колбэк `onAdd` с карточки. Без API: всё локально; позже тот же UX синхронизируют с `:8090` через mutations ([21-mutations.md](21-mutations.md)).

Вы закрепите: immutable updates, functional `setState`, `type="button"`, не вызывать handler при render.

## Предварительно

- [06-lab-props.md](06-lab-props.md) — `ProductCard` существует.
- `npm run dev` в `courses/react-basic/examples/`.
- Эталон: [`examples/solutions/11-cart-counter/`](examples/solutions/).

---

## Задание 1. CartCounter component

**Контекст:** header shop показывает «В корзине: N».

Создайте `src/components/CartCounter.tsx`:

```tsx
import { useState } from "react";

export function CartCounter() {
  const [count, setCount] = useState(0);

  return (
    <div className="cart-counter">
      <span>В корзине: {count}</span>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        +1
      </button>
      <button
        type="button"
        onClick={() => setCount((c) => Math.max(0, c - 1))}
      >
        −1
      </button>
    </div>
  );
}
```

**Критерий:** count не уходит ниже 0; используется functional update.

---

## Задание 2. Подключить в App

В `App.tsx` добавьте `<CartCounter />` в header рядом с `<h1>`.

Проверьте HMR: клики меняют число без reload.

---

## Задание 3. Связать ProductCard с корзиной

**Контекст:** один счётчик на всё приложение — state в **родителе** (preview [12-lifting-state.md](12-lifting-state.md)).

В `App.tsx`:

```tsx
const [cartCount, setCartCount] = useState(0);

const handleAddToCart = () => {
  setCartCount((c) => c + 1);
};
```

Передайте в карточки:

```tsx
<ProductCard
  key={product.id}
  product={product}
  onAddToCart={handleAddToCart}
/>
```

Обновите `ProductCard`:

```tsx
type ProductCardProps = {
  product: Product;
  onAddToCart?: () => void;
};

// в JSX:
<button type="button" onClick={onAddToCart}>
  В корзину
</button>
```

**Критерий:** клик по «В корзину» увеличивает тот же счётчик, что и +1 (если wired к одному handler — или только кнопки карточек; главное — один `cartCount` в App).

*Упростите:* `CartCounter` принимает props `count` и необязательно скрывает свои кнопки — только display:

```tsx
type CartCounterProps = { count: number };

export function CartCounter({ count }: CartCounterProps) {
  return <span className="cart-counter">В корзине: {count}</span>;
}
```

---

## Задание 4. Controlled qty (один товар)

**Контекст:** перед checkout пользователь правит количество.

Создайте `src/components/QtyInput.tsx`:

```tsx
import { useState } from "react";

export function QtyInput() {
  const [qty, setQty] = useState(1);

  return (
    <label className="qty-input">
      Количество
      <input
        type="number"
        min={1}
        max={99}
        value={qty}
        onChange={(e) => {
          const next = Number(e.target.value);
          setQty(Number.isNaN(next) ? 1 : next);
        }}
      />
    </label>
  );
}
```

Разместите под каталогом. Убедитесь, что курсор **не** прыгает при вводе.

---

## Задание 5. Намеренный баг

Временно замените `onClick={onAddToCart}` на `onClick={onAddToCart()}`. Опишите в комментарии в `App.tsx`, что наблюдаете (бесконечный loop / мгновенный рост count). Верните правильный вариант.

```bash
npm run typecheck
```

---

## Критерии успеха

- [ ] `cartCount` живёт в `App`, не дублируется в каждой карточке
- [ ] Functional updates для increment/decrement
- [ ] `ProductCard` вызывает callback, не мутирует глобал
- [ ] `QtyInput` — controlled, без прыжка курсора
- [ ] Понимаете баг `onClick={fn()}`

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| Count растёт сам | `onClick={handler()}`? |
| Два независимых счётчика | State только в App |
| Input read-only warning | Добавьте onChange |
| NaN в qty | Guard `Number.isNaN` |

## Связь с курсом

| Следующий шаг | Зачем |
|--------------|-------|
| [12. Lifting state](12-lifting-state.md) | фильтр + список |
| [13. Лаба: фильтр](13-lab-lifting-state.md) | общий state siblings |
| [21. Mutations](21-mutations.md) | POST cart на API |

Следующий урок (теория): [12. Lifting state up](12-lifting-state.md).
