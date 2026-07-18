# 09. useState: локальное состояние

## Введение: сценарий с работы

Кнопка «+» в mini-cart shop: клик — счётчик на экране не меняется, но `console.log(count)` в обработчике показывает новое значение. Разработчик мутирует `state.items.push(line)` и снова передаёт **тот же** массив в `setItems`. React сравнивает ссылку — render skip. Другой баг: два быстрых клика «+1» с `setCount(count + 1)` теряют инкремент — **stale closure**. Tech lead: «State immutable, functional update, считайте batching».

**`useState`** — первый hook курса: память компонента между рендерами. Props приходят снаружи; state — **внутренние** данные UI (счётчик, открыт modal, строка поиска до lift в [12-lifting-state.md](12-lifting-state.md)).

## Что вы узнаете

- Синтаксис **`useState`**, пара `[value, setValue]`.
- **Re-render** при обновлении state и однонаправленный поток.
- **Immutability** для объектов и массивов ([07-objects.md](../javascript-basic/07-objects.md), [08-arrays.md](../javascript-basic/08-arrays.md)).
- **Functional updates** `setState(prev => ...)`.
- Инициализация: lazy `useState(() => ...)`.
- State vs props; когда не поднимать state.

## Базовый паттерн

```tsx
import { useState } from "react";

export function CartCounter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>В корзине: {count}</p>
      <button type="button" onClick={() => setCount(count + 1)}>
        +1
      </button>
    </div>
  );
}
```

1. Первый render: `count === 0`.
2. Click → `setCount(1)` → React планирует re-render.
3. Второй render: `count === 1`, UI обновлён.

**Важно:** не мутируйте `count` напрямую — `count++` не вызовет render.

## Типизация в TypeScript

```tsx
const [count, setCount] = useState<number>(0);

type CartLine = { id: number; qty: number };
const [lines, setLines] = useState<CartLine[]>([]);

const [query, setQuery] = useState<string>("");
```

TS часто выводит тип из initial value; для `[]` укажите generic явно.

## Immutability: объекты и массивы

```tsx
const [cart, setCart] = useState<{ id: number; items: string[] }>({
  id: 1,
  items: [],
});

// Плохо — мутация
function addWrong(item: string) {
  cart.items.push(item);
  setCart(cart); // та же ссылка — баг
}

// OK — новый объект и массив
function addItem(item: string) {
  setCart((prev) => ({
    ...prev,
    items: [...prev.items, item],
  }));
}
```

Spread — [17-destructuring-spread.md](../javascript-basic/17-destructuring-spread.md). Тот же принцип для списка товаров после filter в [13-lab-lifting-state.md](13-lab-lifting-state.md).

### Обновление одного элемента в массиве

```tsx
setLines((prev) =>
  prev.map((line) =>
    line.id === productId ? { ...line, qty: line.qty + 1 } : line,
  ),
);
```

## Functional updates

Когда новое state **зависит от предыдущего**, особенно в нескольких вызовах подряд:

```tsx
// Может потерять клики в одном event (batching всё равно, но паттерн важен для async)
setCount(count + 1);
setCount(count + 1); // оба читают старый count

// OK
setCount((c) => c + 1);
setCount((c) => c + 1); // +2 за один синхронный handler
```

Используйте functional form **всегда**, когда внутри updater нужен `prev` — filter, map, toggle:

```tsx
const toggleExpanded = (id: number) => {
  setExpandedIds((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
  );
};
```

## Lazy initial state

Тяжёлая инициализация — функция, вызывается **один раз**:

```tsx
function readInitialFilter(): string {
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

const [query, setQuery] = useState(() => readInitialFilter());
```

Без функции `readInitialFilter()` выполнялся бы **на каждом** render.

## Несколько useState vs один объект

```tsx
// Простые независимые поля — отдельные hooks
const [qty, setQty] = useState(1);
const [note, setNote] = useState("");

// Связанная форма — один объект (обновления чуть громоздче)
const [form, setForm] = useState({ qty: 1, note: "" });
setForm((f) => ({ ...f, qty: 2 }));
```

Для shop checkout позже — react-hook-form; на базовом уровне `useState` достаточно ([10-events-controlled.md](10-events-controlled.md)).

## State и render: ментальная модель

```text
Event (click) → setState → schedule re-render
                → function component runs again
                → new JSX → reconciliation → DOM patch
```

State **локален** компоненту. Два `<CartCounter />` на странице — **два** независимых счётчика. Общий счётчик — lift state ([12-lifting-state.md](12-lifting-state.md)) или Context ([29-context.md](29-context.md)).

## Данные с API

Server data **не** всегда дублируют в useState — позже TanStack Query ([20-tanstack-query.md](20-tanstack-query.md)). Локальный UI state (modal open, tab index) — всегда useState. Для `fetch` + `useState(products)` — [17-fetch-react.md](17-fetch-react.md).

## Типичные ошибки

| Ошибка | Корневая причина | Исправление |
|--------|------------------|-------------|
| UI не обновляется после push | Мутация + та же ссылка | Новый массив/объект |
| Потерянные инкременты | `setCount(count+1)` x2 | Functional updater |
| State из props без sync | props → state один раз | Derived или key на remount |
| Огромный один state object | Всё в `useState({...})` | Split или useReducer (позже) |
| setState в render body | Бесконечный loop | setState только в handlers/effects |
| `useState` в if/for | Rules of Hooks | Top level only |

## Резюме

**`useState`** хранит локальное состояние между рендерами. Обновления — через **setter**; объекты/массивы — **immutable**. **Functional updates** — когда нужен предыдущий state. Shop: qty в корзине, фильтр, открытые панели — всё начинается здесь.

## Чек-лист

- [ ] Что возвращает `useState(0)`?
- [ ] Почему `items.push(x); setItems(items)` ломает UI?
- [ ] Когда писать `setCount(c => c + 1)`?
- [ ] Lazy init — зачем функция в `useState(() => ...)`?
- [ ] Два экземпляра компонента — один state или два?

Следующий урок: [10. События и controlled inputs](10-events-controlled.md).
