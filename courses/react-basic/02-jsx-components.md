# 02. JSX и функциональные компоненты

## Введение: сценарий с работы

Code review shop-frontend, пятница. Коллега прислал PR с «разметкой» в `App.tsx`: HTML-комментарии `<!-- header -->`, атрибут `class="card"`, закрывающий тег `<img>` без слэша. CI падает на `vite build`: `Expected corresponding JSX closing tag`. В браузере dev-режим работал «случайно», потому что Babel иногда прощает мелочи, а TypeScript — нет. Tech lead: «JSX — не HTML и не строка. Это синтаксический сахар над `React.createElement`». Вы открываете [01-landscape.md](01-landscape.md) и понимаете *зачем* компоненты, но **как** их писать на практике — в этой главе.

После [`javascript-basic`](../javascript-basic/10-functions.md) функции для вас привычны. **React-комponent** — функция, которая возвращает **описание UI** (JSX). Vite компилирует `.tsx` в JS; браузер получает обычные вызовы React. Домен mock-exams — **shop**: карточки товаров, корзина, каталог с `:8090` позже; сейчас — фундамент синтаксиса.

## Что вы узнаете

- Что такое **JSX** и чем он отличается от HTML-строки.
- Правила JSX: один корневой элемент, `className`, самозакрывающиеся теги, фигурные скобки для выражений.
- **Функциональные компоненты**: именование, return, стрелки vs `function`.
- **`export` / `import`** между файлами — связь с [ES modules](../javascript-basic/30-es-modules.md).
- Как JSX встраивается в цикл **edit → HMR → браузер** из [00-environment.md](00-environment.md).

## JSX: JavaScript + XML

JSX выглядит как HTML внутри JavaScript/TypeScript:

```tsx
const title = "Mechanical Keyboard";

const element = <h1 className="product-title">{title}</h1>;
```

Под капотом (упрощённо) Vite превращает это в:

```tsx
const element = React.createElement(
  "h1",
  { className: "product-title" },
  title,
);
```

**Почему не template string?** JSX даёт:

1. **Структуру** — вложенность видна как дерево, не конкатенация строк.
2. **Безопасность** — React экранирует текст по умолчанию (защита от XSS при выводе пользовательских данных).
3. **Инструменты** — TypeScript проверяет props, ESLint ловит `key`, DevTools показывает компоненты.

JSX **не** выполняется в браузере «как есть» — только после трансформации сборщиком.

## Правила JSX (отличия от HTML)

| HTML | JSX в React |
|------|-------------|
| `class="btn"` | `className="btn"` (`class` — зарезервировано в JS) |
| `for="email"` | `htmlFor="email"` |
| `<br>` | `<br />` — самозакрывающиеся теги |
| `<!-- comment -->` | `{/* comment */}` |
| `onclick="..."` | `onClick={handler}` — camelCase, функция, не строка |
| inline `style="color:red"` | `style={{ color: "red" }}` — объект |

### Один корневой элемент

Компонент должен возвращать **один** корневой узел (или Fragment — [07-lists-keys.md](07-lists-keys.md)):

```tsx
// Ошибка: два соседа на верхнем уровне
function BadHeader() {
  return (
    <header>Shop</header>
    <nav>Catalog</nav>
  );
}

// OK: обёртка
function GoodHeader() {
  return (
    <header>
      <h1>Shop</h1>
      <nav>Catalog</nav>
    </header>
  );
}
```

### Выражения в `{фигурных скобках}`

Внутри JSX можно вставить **любое JavaScript-выражение**, не statement:

```tsx
function PriceTag({ price, currency }: { price: number; currency: string }) {
  const formatted = price.toFixed(2);
  const inStock = price > 0;

  return (
    <p>
      {currency} {formatted}
      {inStock ? " — в наличии" : " — нет в наличии"}
    </p>
  );
}
```

**Нельзя** вставить `if`, `for`, `const` напрямую — только результат выражения. Условия — тернарник, `&&` или вычисление до `return` ([08-conditional-rendering.md](08-conditional-rendering.md)).

```tsx
// Нельзя:
// return <div>{ if (x) { "yes" } }</div>

// Можно:
return <div>{x ? "yes" : "no"}</div>;
```

## Функциональные компоненты

Компонент — **функция с заглавной буквы**, возвращающая JSX (или `null`):

```tsx
function ShopGreeting() {
  return (
    <main className="app">
      <h1>Shop — react-basic</h1>
      <p>Каталог подключим к FastAPI :8090 позже.</p>
    </main>
  );
}
```

Стрелочный вариант — идиоматичен для маленьких presentational-компонентов:

```tsx
export const Badge = ({ label }: { label: string }) => (
  <span className="badge">{label}</span>
);
```

| Правило | Зачем |
|---------|-------|
| Имя с **большой** буквы | `<shop />` — DOM-тег; `<Shop />` — компонент |
| **Pure-ish** render | Одинаковые props → одинаковый UI (state — позже) |
| Без side effects в теле | Запросы и подписки — в `useEffect` ([14-useEffect.md](14-useEffect.md)) |

Props (аргументы компонента) разберём в [04-props.md](04-props.md); пока — литералы и локальные переменные.

## Структура файла компонента

Рекомендуемый шаблон для shop UI:

```tsx
// src/components/ShopFooter.tsx

type ShopFooterProps = {
  year?: number;
};

export function ShopFooter({ year = new Date().getFullYear() }: ShopFooterProps) {
  return (
    <footer className="shop-footer">
      <p>© {year} mock-exams shop</p>
    </footer>
  );
}
```

- **Один компонент — один файл** (или связанная группа).
- **Named export** `export function` — проще рефакторинг и автoimport в IDE.
- Тип props — inline или `type`/`interface` (углубим в [32-typescript-react.md](32-typescript-react.md)).

## Export и import

Модули ES — как в [30-es-modules.md](../javascript-basic/30-es-modules.md):

```tsx
// src/components/Hello.tsx
export function Hello() {
  return <p>Hello from component file</p>;
}
```

```tsx
// src/App.tsx
import { Hello } from "./components/Hello";

export function App() {
  return (
    <main>
      <h1>Shop</h1>
      <Hello />
    </main>
  );
}
```

| Импорт | Когда |
|--------|-------|
| `import { Hello } from "./Hello"` | named export (предпочтительно) |
| `import Hello from "./Hello"` | default export (один на файл) |
| `import type { Product } from "./types"` | только типы, стираются при сборке |

**Путь:** `./` — относительно текущего файла; `@/components/Hello` — если настроен alias в `vite.config.ts` (позже в [35-project-structure.md](35-project-structure.md)).

Цепочка монтирования в `examples/`:

```text
main.tsx  →  import { App } from "./App"
App.tsx   →  import { Hello } from "./components/Hello"
```

## JSX и TypeScript (`.tsx`)

Расширение **`.tsx`** обязательно, когда в файле есть JSX. TypeScript проверяет, что вы не передаёте `number` в `className`, и подсказывает DOM-атрибуты.

```tsx
// Ошибка TS: Type 'number' is not assignable to type 'string'
const broken = <div className={42}>Oops</div>;
```

Для учебных лаб достаточно inline-типов; для API shop — вынесем `Product` в [19-lab-fetch-items.md](19-lab-fetch-items.md).

## Связь с mock-exams shop

Сейчас UI статичен. Позже `App` станет layout: header, `<Outlet />` Router, список с `GET /api/v1/items` на `:8090`. Каждый блок — отдельный компонент в `src/components/`, собранный через JSX и import. **Разделение файлов** с первого дня упрощает review так же, как разбиение FastAPI на routers.

## Типичные ошибки

| Ошибка | Корневая причина | Исправление |
|--------|------------------|-------------|
| `class="card"` | HTML-привычка | `className="card"` |
| Adjacent JSX elements must be wrapped | Два корня в return | Один родитель или `<>...</>` |
| `import hello from "./Hello"` при named export | Путаница default/named | `import { Hello } from ...` |
| Компонент `function shop()` | Lowercase = DOM tag | `function Shop()` |
| `{items.map(...)}` без return в `{}` | Statement внутри JSX | Тернарник или map с return |
| JSX в `.ts` файле | Расширение без X | Переименовать в `.tsx` |
| Забыли закрыть тег | Синтаксис XML | `<img />`, `</div>` |

## Резюме

**JSX** — синтаксис описания UI внутри JS/TS; компилируется в `createElement`. **Функциональный компонент** — функция с именем `PascalCase`, возвращающая JSX. Данные в разметку — через **`{выражения}`**; атрибуты — camelCase и `className`. **Модули** связывают файлы: `export function` + `import { ... }`. Это основа всего shop SPA до props и state.

## Чек-лист

- [ ] Объясните, почему JSX не строка HTML
- [ ] Назовите три отличия JSX от HTML (`className`, комментарии, …)
- [ ] Почему имя компонента с большой буквы?
- [ ] Чем named export удобнее default для командного проекта?
- [ ] Что произойдёт, если вернуть два `<div>` без обёртки?
- [ ] Где в `examples/` точка входа и корневой компонент?

Следующий урок: [03. Лаба: первое приложение](03-lab-first-app.md).
