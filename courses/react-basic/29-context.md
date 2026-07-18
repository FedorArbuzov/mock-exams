# 29. Context: глобальное состояние без prop drilling

## Введение: «Прокинуть theme через 12 компонентов?»

Дизайнер просит тёмную тему mock-exams shop. `ThemeContext` нужен в `Header`, `ProductCard`, `CartDrawer`, `Footer`. Без Context вы передаёте `theme` и `setTheme` через каждый промежуточный layout — **prop drilling**. Рефакторинг ломает типы и review: «Зачем CatalogFilters знает про theme?»

**React Context** — встроенный механизм: Provider вверху дерева, `useContext` (или custom hook) в любом потомке. Не заменяет Redux «по умолчанию»; для темы, locale, auth snapshot, **корзины** в react-basic — часто достаточно.

После [28-custom-hooks.md](28-custom-hooks.md) вы выносите логику в `useCart`. Context — **куда кладётся value**, которое разделяют многие ветки UI. Лаба: [30-lab-context.md](30-lab-context.md). Данные с `:8090` по-прежнему в TanStack Query ([20-tanstack-query.md](20-tanstack-query.md)) — Context не для кэша сервера.

## Что вы узнаете

- `createContext`, `Provider`, `useContext`.
- Default value и проверка «вне Provider».
- Разделение **state** и **dispatch** (как Redux-lite).
- Когда Context **не** нужен — lifting state, Query, URL ([26-url-state.md](26-url-state.md)).
- Performance: лишние re-renders и как смягчить.

---

## Минимальный пример: Theme

```tsx
// context/ThemeContext.tsx
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () =>
        setTheme((t) => (t === "light" ? "dark" : "light")),
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
```

Обёртка приложения ([23-react-router.md](23-react-router.md)):

```tsx
// main.tsx или App.tsx
<ThemeProvider>
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
</ThemeProvider>
```

Потребитель:

```tsx
function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header data-theme={theme}>
      <span>mock-exams shop</span>
      <button type="button" onClick={toggleTheme}>
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </header>
  );
}
```

**`data-theme`** — hook для CSS ([33-styling.md](33-styling.md)).

---

## createContext и default value

```tsx
const CartContext = createContext<CartContextValue>({
  items: [],
  addItem: () => {},
});
```

Default используется, если **нет** Provider выше — часто **скрывает баг** (вызов `addItem` no-op). Лучше:

```tsx
const CartContext = createContext<CartContextValue | null>(null);
```

и явная ошибка в `useCart()` — fail fast при неправильном дереве.

---

## Provider value и re-renders

При изменении `value` **все** потребители `useContext(CartContext)` re-render, даже если используют только `items.length`, а изменился `theme` в **другом** context.

### Один context на одну concern

```text
ThemeProvider     → только theme
CartProvider      → только корзина
AuthProvider      → позже в react-intermediate
```

Не один `AppContext` с 20 полями.

### useMemo для value объекта

```tsx
const value = useMemo(
  () => ({ items, addItem, removeItem }),
  [items] // addItem/removeItem стабильны через useCallback
);
```

Без `useMemo` новый object literal каждый render → лишние re-renders потребителей.

### Split contexts (продвинутый приём)

`CartItemsContext` + `CartActionsContext` — потребители, которым нужен только `addItem`, не перерисовываются при смене `items`. В react-basic достаточно знать идею; при проблемах Profiler ([36-devtools.md](36-devtools.md)).

---

## Корзина: типичная модель

```tsx
type CartItem = { id: number; title: string; qty: number };

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  setQty: (id: number, qty: number) => void;
  clear: () => void;
  totalCount: number;
};
```

Reducer optional ([09-useState.md](09-useState.md) + функция updater достаточно для basic):

```tsx
function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "ADD":
      // immutability — урок javascript-basic 07-08
      // ...
    default:
      return state;
  }
}
```

**Синхронизация с API:** корзина в Context — **клиентский** state до checkout; POST заказа — mutation ([21-mutations.md](21-mutations.md)) на `:8090` когда endpoint появится.

---

## Context vs другие решения

| Потребность | Решение |
|-------------|---------|
| Два соседа, общий parent | Lifting state ([12-lifting-state.md](12-lifting-state.md)) |
| Фильтр в URL | `useSearchParams` ([26-url-state.md](26-url-state.md)) |
| Список товаров с сервера | `useQuery` |
| Theme, cart, i18n | Context |
| Частые обновления 60fps | ref, state локально, не global context |
| Огромное app state | react-intermediate / Zustand |

### Когда НЕ overuse Context

1. **Server state** — дублировать items из Query в Context → два источника правды.
2. **Весь URL в Context** — дублирование Router.
3. **Form field-by-field** — локальный `useState` в форме ([10-events-controlled.md](10-events-controlled.md)).
4. **Оптимизация «на будущее»** — один Provider на приложение с god-object.

**Правило:** Context для данных, которые **много компонентов** читают/меняют и которые **не** являются server cache.

---

## Композиция Provider'ов

```tsx
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
```

Порядок: Query снаружи или внутри — оба OK; Theme/Cart не должны зависеть от Query при init.

Файл `src/app/providers.tsx` — [35-project-structure.md](35-project-structure.md).

---

## TypeScript

Типизируйте context value явно; экспортируйте только hook `useCart`, не raw context — инкапсуляция.

```tsx
export type { CartItem };
export function useCart(): CartContextValue { /* ... */ }
// CartContext — не export
```

Подробнее: [32-typescript-react.md](32-typescript-react.md).

---

## Тестирование

Оборачивайте компонент в тесте:

```tsx
render(
  <CartProvider>
    <AddToCartButton itemId={1} />
  </CartProvider>
);
```

Или mock provider с фиксированным value для изоляции UI.

---

## Связь с mock-exams

```text
Browser
  └── ThemeProvider (UI prefs)
        └── CartProvider (client cart)
              └── QueryClientProvider
                    └── Router
                          ├── /catalog  → items from :8090
                          └── /cart     → reads CartContext
```

FastAPI `:8090` — **источник каталога**; корзина до отправки заказа — **клиент**, Context уместен.

---

## Типичные ошибки

**Provider ниже потребителя** — `useCart` throws или default no-op.

**Новый object/function в value без memo/callback** — cascade re-renders.

**Хранить fetch result в Context** вместо Query — stale data после mutation.

**Context для каждого prop** — over-engineering; props ещё живы ([04-props.md](04-props.md)).

**Забыли key при persist cart в localStorage** — версионируйте schema (`cart-v1`).

---

## Резюме

Context решает **prop drilling** для cross-cutting client state: theme, cart, locale. `createContext` + `Provider` + `useContext`/custom hook. Держите contexts узкими, мемоизируйте value, server data — в Query. Практика — [30-lab-context.md](30-lab-context.md).

## Чек-лист

- [ ] Три API: createContext, Provider, useContext
- [ ] Почему `null` default + throw в hook
- [ ] Context vs lifting state vs Query — таблица решений
- [ ] Зачем `useMemo` на value Provider
- [ ] Где ThemeProvider в дереве shop SPA

Следующий урок: [30. Лаба: Context](30-lab-context.md).
