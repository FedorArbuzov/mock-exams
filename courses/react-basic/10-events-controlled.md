# 10. События и controlled inputs

## Введение: сценарий с работы

Форма «Добавить товар» в admin shop: после каждой буквы в поле «Название» курсор прыгает в начало, количество сбрасывается. Причина — `<input value={title} />` **без** `onChange`, или value берётся из props, а правки пишут в локальный state, который не синхронизирован. Второй тикет: `onClick={addToCart()}` — корзина опустошается при **каждом** render. Третий: `preventDefault` забыли на submit — страница перезагружается, SPA падает.

React события — **SyntheticEvent**, делегирование, camelCase. **Controlled components** — single source of truth в state для форм shop (qty, promo code, search).

## Что вы узнаете

- Обработчики **`onClick`**, **`onChange`**, **`onSubmit`**.
- Передача функции vs **вызов** функции в JSX.
- **`event.target`** и типизация для input в TS.
- **Controlled** vs **uncontrolled** inputs.
- **`preventDefault`** и формы без перезагрузки.
- Связка events + `useState` ([09-useState.md](09-useState.md)).

## onClick и передача колбэков

```tsx
function AddToCartButton({ productId }: { productId: number }) {
  const handleClick = () => {
    console.log("Add product", productId);
    // позже: mutation / lift state
  };

  return (
    <button type="button" onClick={handleClick}>
      В корзину
    </button>
  );
}
```

| JSX | Когда |
|-----|-------|
| `onClick={handleClick}` | передать функцию — **правильно** |
| `onClick={() => add(id)}` | нужен аргумент из closure |
| `onClick={addToCart()}` | **вызов сразу** при render — баг |

```tsx
// Баг: addToCart() выполнится при каждом render
<button onClick={addToCart()}>Buy</button>

// OK
<button onClick={() => addToCart(product.id)}>Buy</button>
```

`type="button"` на кнопках вне `<form>` — иначе implicit submit в некоторых браузерах.

## SyntheticEvent

React нормализует события между браузерами:

```tsx
function Row({ id }: { id: number }) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // не всплывать к row click
    console.log("Clicked row", id);
  };

  return <button type="button" onClick={handleClick}>Выбрать</button>;
}
```

В React 17+ события привязаны к root, не document — для курса достаточно знать: API похож на DOM, типы — `React.MouseEvent`, `React.ChangeEvent`.

## Controlled input: text

**Controlled** — значение input **всегда** из state:

```tsx
import { useState } from "react";

function SearchBox() {
  const [query, setQuery] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  return (
    <input
      type="search"
      placeholder="Поиск в каталоге…"
      value={query}
      onChange={handleChange}
    />
  );
}
```

Без `onChange` при `value={query}` React выдаст warning — read-only field.

**Почему controlled:** фильтр каталога, debounce search ([16-lab-effects.md](16-lab-effects.md)), валидация promo, единый источник правды перед POST на `:8090`.

## Другие input types

```tsx
function QtyStepper() {
  const [qty, setQty] = useState(1);

  return (
    <input
      type="number"
      min={1}
      max={99}
      value={qty}
      onChange={(e) => setQty(Number(e.target.value))}
    />
  );
}
```

Checkbox:

```tsx
const [agree, setAgree] = useState(false);

<input
  type="checkbox"
  checked={agree}
  onChange={(e) => setAgree(e.target.checked)}
/>;
```

Select:

```tsx
const [category, setCategory] = useState("electronics");

<select value={category} onChange={(e) => setCategory(e.target.value)}>
  <option value="electronics">Electronics</option>
  <option value="home">Home</option>
</select>
```

## Uncontrolled (кратко)

Ref + DOM value — [27-ref-memo-callback.md](27-ref-memo-callback.md). Для большинства форм shop курса — **controlled**. Uncontrolled уместен для file input или интеграции с не-React библиотеками.

## Форма и preventDefault

```tsx
function QuickOrderForm() {
  const [sku, setSku] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Order SKU:", sku);
    // fetch POST :8090/orders — позже
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        SKU
        <input value={sku} onChange={(e) => setSku(e.target.value)} />
      </label>
      <button type="submit">Заказать</button>
    </form>
  );
}
```

Без `preventDefault` браузер сделает GET/POST navigation — **полная** перезагрузка, потеря SPA state.

## Колбэк вверх (preview lifting)

```tsx
type ProductCardProps = {
  product: Product;
  onAdd: (id: number) => void;
};

function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <article>
      <h2>{product.title}</h2>
      <button type="button" onClick={() => onAdd(product.id)}>
        В корзину
      </button>
    </article>
  );
}
```

Родитель держит `cartCount` — [12-lifting-state.md](12-lifting-state.md).

## Доступность (минимум)

- `<label>` связан с input (`htmlFor` + `id`).
- Кнопки — осмысленный текст, не только иконка без `aria-label`.
- `onKeyDown` для custom widgets — позже.

## Типичные ошибки

| Ошибка | Корневая причина | Исправление |
|--------|------------------|-------------|
| Курсор прыгает | value без onChange или key remount | Controlled pair |
| `onClick={fn()}` | Immediate invoke | `onClick={() => fn()}` |
| Страница reload on submit | No preventDefault | `event.preventDefault()` |
| `value` undefined → uncontrolled | Начальный state не string | `useState("")` |
| Number input NaN | Пустая строка в value | Parse + fallback |
| Лишний re-render onChange | Тяжёлая работа в handler | debounce в effect |

## Резюме

События React — **camelCase**, функции в JSX **без вызова** (кроме factory). **Controlled inputs** — `value` + `onChange` из `useState`. Формы — **`onSubmit`** + **`preventDefault`**. Shop UI: поиск, qty, checkout — всё на этом паттерне до React Hook Form в intermediate.

## Чек-лист

- [ ] Разница `onClick={f}` и `onClick={f()}`
- [ ] Что делает controlled input?
- [ ] Зачем `preventDefault` на form submit?
- [ ] Тип события для `<input onChange>` в TS?
- [ ] Как передать `product.id` в handler?

Следующий урок: [11. Лаба: корзина и счётчик](11-lab-state.md).
