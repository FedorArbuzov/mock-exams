# 30. Лаба: тема и корзина через Context

## Сценарий

Product owner: «На демо shop должны работать **тёмная тема** и **корзина** с любой страницы — каталог, карточка товара, 404. Без prop drilling». Вы реализуете `ThemeProvider` и `CartProvider` по [29-context.md](29-context.md), подключаете к существующему Vite-проекту из [03-lab-first-app.md](03-lab-first-app.md) и списку товаров [19-lab-fetch-items.md](19-lab-fetch-items.md).

Backend FastAPI `:8090` отдаёт каталог; корзина пока **только на клиенте** (как в [11-lab-state.md](11-lab-state.md), но глобально). Checkout на API — в capstone [38-capstone.md](38-capstone.md).

**Время:** ~50–65 минут.  
**Код:** `courses/react-basic/examples/src/`.

---

## Что вы сделаете

- `ThemeProvider` + `useTheme`, переключатель в `Header`
- `CartProvider` + `useCart`: add, remove, qty, badge count
- `ProductCard` и страница `/cart` без проброса props через layout
- CSS variables для light/dark ([33-styling.md](33-styling.md))
- (Опционально) persist корзины в `localStorage`

**Предварительно:** [28-custom-hooks.md](28-custom-hooks.md), [29-context.md](29-context.md), [23-react-router.md](23-react-router.md).

---

## Подготовка

```bash
cd courses/react-basic/examples
npm install
npm run dev    # :5173
# FastAPI :8090 — опционально для списка товаров
```

Структура после лабы:

```text
src/
├── context/
│   ├── ThemeContext.tsx
│   └── CartContext.tsx
├── components/
│   ├── Header.tsx
│   ├── ProductCard.tsx
│   └── CartBadge.tsx
├── pages/
│   ├── CatalogPage.tsx
│   └── CartPage.tsx
├── app/
│   └── providers.tsx
└── main.tsx
```

---

## Задание 1. ThemeContext

### Шаги

1. Создайте `context/ThemeContext.tsx` по образцу из [29-context.md](29-context.md).
2. В `index.css` добавьте variables:

```css
:root,
[data-theme="light"] {
  --bg: #fafafa;
  --text: #111;
  --card: #fff;
}

[data-theme="dark"] {
  --bg: #121212;
  --text: #eee;
  --card: #1e1e1e;
}

body {
  background: var(--bg);
  color: var(--text);
}
```

3. На `<html>` или `<body>` в `useEffect` внутри Provider ставьте `document.documentElement.dataset.theme = theme`.

### Критерии

- [ ] Кнопка в Header переключает theme
- [ ] Перезагрузка страницы сбрасывает theme (OK для MVP; persist — расширение B)
- [ ] `useTheme()` вне Provider бросает понятную ошибку

---

## Задание 2. CartContext

### Модель

```tsx
export type CartLine = {
  id: number;
  title: string;
  qty: number;
};

export type CartContextValue = {
  lines: CartLine[];
  addLine: (item: { id: number; title: string }) => void;
  removeLine: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  totalItems: number;
  clear: () => void;
};
```

### Правила

- `addLine`: если `id` уже есть — `qty + 1`, иначе новая строка с `qty: 1`
- Immutability: новые массивы/объекты ([javascript-basic 07-objects](../javascript-basic/07-objects.md))
- `totalItems` — sum of qty (можно `useMemo`)

### Критерии

- [ ] «В корзину» на карточке обновляет badge в Header
- [ ] `/cart` показывает список, +/- qty, удаление строки
- [ ] Пустая корзина — empty state ([31-ui-states.md](31-ui-states.md))

---

## Задание 3. Providers и Router

`app/providers.tsx`:

```tsx
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>{children}</CartProvider>
    </ThemeProvider>
  );
}
```

`main.tsx`:

```tsx
<StrictMode>
  <AppProviders>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AppProviders>
</StrictMode>
```

Layout route с `Header` + `<Outlet />` ([24-nested-routes.md](24-nested-routes.md)).

### Критерии

- [ ] `/catalog` и `/cart` видят один и тот же cart state
- [ ] Нет props `theme` / `cart` на промежуточных layout-компонентах

---

## Задание 4. ProductCard и CatalogPage

Подключите данные с `:8090` если стенд поднят:

```tsx
const res = await fetch("http://localhost:8090/api/v1/items");
const { items } = await res.json();
```

Или mock-массив для offline.

`ProductCard`:

```tsx
function ProductCard({ item }: { item: { id: number; title: string } }) {
  const { addLine } = useCart();
  return (
    <article className="card">
      <h3>{item.title}</h3>
      <button type="button" onClick={() => addLine(item)}>
        В корзину
      </button>
    </article>
  );
}
```

### Критерии

- [ ] `key={item.id}` на списке ([07-lists-keys.md](07-lists-keys.md))
- [ ] Двойной клик «В корзину» увеличивает qty, не дублирует строки

---

## Задание 5. CartPage

- Таблица/список: title, qty controls, remove
- Кнопка «Очистить корзину»
- Ссылка «Продолжить покупки» → `/catalog`
- Empty: иллюстрация/текст «Корзина пуста»

---

## Самопроверка (чек-лист лабы)

- [ ] Theme работает на Catalog и Cart
- [ ] Badge показывает `totalItems`
- [ ] Навигация Router не сбрасывает cart
- [ ] Нет eslint warnings `react-hooks/exhaustive-deps` в providers
- [ ] Компоненты используют `useCart` / `useTheme`, не raw Context

---

## Расширения (опционально)

| Уровень | Задача |
|---------|--------|
| A | `useLocalStorage` для cart ([28-custom-hooks.md](28-custom-hooks.md)) |
| B | Persist theme в localStorage |
| C | Toast «Товар добавлен» при addLine |
| D | Синхронизировать qty с URL query `?cart=1,2` ([26-url-state.md](26-url-state.md)) |

---

## Типичные ошибки

1. **Provider только внутри одной route** — cart сбрасывается при смене страницы. Provider **выше** `BrowserRouter` или сразу под ним, но **выше** `Routes`.

2. **Мутация `lines.push`** — React не видит изменений. Всегда новый массив.

3. **`value={{ lines, addLine }}` без memo** — лишние re-renders всего поддерева.

4. **Дублирование items из Query в Cart** — в cart только `{ id, title, qty }`, не весь catalog.

5. **CORS при fetch** — если `:8090` не поднят, используйте mock; см. [18-cors-fastapi.md](18-cors-fastapi.md).

---

## Связь с курсом

| Тема | Урок |
|------|------|
| Context API | 29 |
| Custom hooks | 28 |
| UI empty state | 31 |
| Стили theme | 33 |
| Capstone cart + API | 38 |

---

## После лабы

Зафиксируйте коммит в своей ветке (если ведёте journal). Следующий урок: [31. UI states](31-ui-states.md) — loading, error, empty для catalog fetch.
