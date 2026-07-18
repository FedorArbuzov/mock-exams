# 01. Ландшафт: SPA, React, Virtual DOM

## Введение: «Переписать админку на React или оставить Django templates?»

На grooming product показывает макет: фильтры каталога, корзина без перезагрузки страницы, live-поиск. Tech lead спрашивает: «SPA на React или server-rendered Django?» Junior отвечает: «React быстрее, потому что Virtual DOM». Reviewer кивает неуверенно — и вы тоже не готовы разложить **что именно** React решает, **чем SPA отличается** от multi-page, и **почему Virtual DOM — не про «скорость DOM»** в вакууме.

После [`javascript-basic`](../javascript-basic/01-landscape.md) вы знаете JS и event loop. React — **библиотека UI**, не язык и не замена HTTP. Она отвечает на вопрос: «как описать интерфейс как функцию данных и **безопасно** обновить страницу при изменении state».

## Что вы узнаете

- **MPA vs SPA** — где живет React в архитектуре mock-exams shop.
- Что такое **компонент** и **declarative UI**.
- **Virtual DOM** и reconciliation — интуитивная модель без мифов.
- **React 19** и функциональные компоненты + hooks (единственный стиль курса).
- Место React между **FastAPI :8090** и браузером.

## MPA vs SPA

**Multi-Page Application (MPA):** каждый клик по ссылке — **полная** загрузка HTML с сервера (классический Django templates, PHP). Сервер «рисует» страницу.

**Single Page Application (SPA):** браузер один раз загружает JS-бандл; дальнейшая «навигация» — смена **состояния** и **компонентов** без полной перезагрузки (React Router меняет URL и дерево UI).

```text
MPA:  Browser ──GET /items──► Django ──HTML──► Browser (новая страница)

SPA:  Browser ──GET /──► CDN/static ──JS bundle──► Browser
      Browser ──GET /api/v1/items──► FastAPI ──JSON──► React рисует список
      Клик «Товар #5» ──► Router ──► другой компонент, URL меняется, HTML не с нуля
```

| | MPA | SPA (React) |
|---|-----|-------------|
| Первый байт | часто быстрее контент | ждём JS |
| Интерактивность после load | полная перезагрузка | локальные обновления |
| SEO (без SSR) | проще | нужен SSR/SSG (Next — позже) |
| Backend | HTML + формы | **JSON API** (FastAPI) |

В mock-exams **react-basic** — клиент к **REST JSON** на `:8090`. Django `:8092` — альтернативный backend для capstone в react-intermediate.

## Declarative UI: описываем «как должно быть»

**Императивно** (vanilla JS):

```javascript
const ul = document.getElementById("list");
ul.innerHTML = "";
for (const item of items) {
  const li = document.createElement("li");
  li.textContent = item.title;
  ul.appendChild(li);
}
```

**Декларативно** (React — preview):

```tsx
function ItemList({ items }: { items: { title: string }[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.title}>{item.title}</li>
      ))}
    </ul>
  );
}
```

Вы описываете **UI = f(state, props)**. React при изменении `items` **сам** согласует DOM. Меньше ручных `appendChild` — меньше рассинхрона «забыли удалить старый узел».

## Компоненты и дерево

UI — **дерево компонентов**. Комponent — функция (или класс; классы **не** учим):

```tsx
function ProductCard({ title, price }: { title: string; price: number }) {
  return (
    <article>
      <h2>{title}</h2>
      <p>{price.toFixed(2)} €</p>
    </article>
  );
}
```

Корень — `<App />`, внутри — layout, списки, формы. Данные текут **вниз** через props ([04-props.md](04-props.md)); события и state — вверх или через hooks/context.

## Virtual DOM и reconciliation

React держит **легковесное описание** UI (Virtual DOM — дерево объектов «какой tag, какие props, какие children»). При изменении state:

1. Вызывается render → новое дерево VDOM.
2. **Diff** со старым деревом (reconciliation).
3. **Commit** — минимальные правки **реального** DOM.

Миф: «Virtual DOM всегда быстрее ручного DOM». Реальность: React экономит **ваше время** и снижает класс багов; для 10 000 строк таблицы нужны виртуализация и мемоизация ([27-ref-memo-callback.md](27-ref-memo-callback.md)).

**Keys** в списках помогают diff понять, **какой** элемент добавился/удалился ([07-lists-keys.md](07-lists-keys.md)).

## Однонаправленный поток данных

```text
       props ↓
  Parent ──────► Child
       ↑
   callbacks / setState
```

State живёт в компоненте-владельце. Дети **не мутируют** props. Если двум siblings нужны одни данные — **lifting state up** ([12-lifting-state.md](12-lifting-state.md)) или Context ([29-context.md](29-context.md)).

Это соз сознательно: проще отлаживать, чем двусторонний binding à la Angular 1.x.

## React в экосистеме mock-exams

| Слой | Технология | Курс |
|------|------------|------|
| API | FastAPI :8090 | fastapi |
| Контракт | OpenAPI, JSON | api-design |
| Клиент UI | React + Vite | **react-basic** |
| Типы | TypeScript | typescript-basic |
| Кэш запросов | TanStack Query | [20-tanstack-query.md](20-tanstack-query.md) |
| Маршруты | React Router | [23-react-router.md](23-react-router.md) |

Сквозной домен — **shop**: товары, корзина, фильтры — те же сущности, что в FastAPI capstone и javascript Task Tracker, но с HTTP UI.

## React 19 и hooks-only

Курс использует **функциональные компоненты** и hooks (`useState`, `useEffect`, …). Class components с `this.setState` — legacy; встретите в старых кодовых базах, но новый код — hooks.

React 19 улучшает concurrent rendering, `use` (async resources) — обзорно упомянем; базовые паттерны курса совместимы с 18+.

## Типичные ошибки в понимании

**«React = фронтенд-фреймворк как Angular».** React — **библиотека view**. Роутинг, data layer, формы — отдельные пакеты (Router, Query).

**«Нужен React для любой страницы».** Лендинг из трёх секций без интерактива — часто достаточно HTML/CSS или Django template.

**«Virtual DOM заменяет DOM API».** Под капотом всё равно браузерный DOM; React orchestrates updates.

**«SPA не нужен backend».** SPA **сильнее зависит** от API: без `:8090` нечего показывать кроме статики.

## Резюме

React помогает строить **SPA**: UI как дерево компонентов, обновления через **state** и declarative render. Virtual DOM + reconciliation минимизируют ручную работу с DOM. В mock-exams React — **тонкий клиент** к FastAPI shop API; дальше — JSX, props, hooks.

## Чек-лист

- [ ] Объясните разницу MPA и SPA на примере shop-каталога
- [ ] Что значит «declarative UI»
- [ ] Зачем keys в списках (preview)
- [ ] Куда в архитектуре mock-exams вставляется React
- [ ] Почему курс на hooks, а не class components

Следующий урок: [02. JSX и функциональные компоненты](02-jsx-components.md).
