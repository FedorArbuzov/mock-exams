# 14. `useEffect`: синхронизация с внешним миром

## Сценарий с работы

После [`13-lab-lifting-state.md`](13-lab-lifting-state.md) фильтр каталога shop работает в памяти — но product owner хочет **сохранять выбранную тему** в `localStorage` и **обновлять заголовок вкладки** при смене страницы. Junior кладёт `localStorage.setItem` прямо в тело компонента — при каждом рендере диск дергается десятки раз, DevTools мигает. Другой разработчик подписывается на `window.resize` без отписки — после навигации обработчиков накапливается десяток.

React рисует UI **синхронно** из props и state. Всё, что **выходит за пределы** этого цикла — сеть, DOM вне React, таймеры, подписки — нужно **синхронизировать** через **`useEffect`**.

## Что вы узнаете

- Зачем нужен `useEffect` и чем он отличается от обработчика событий
- Три фазы жизни эффекта: **mount**, **update**, **unmount**
- Сигнатура: `useEffect(callback, deps?)`
- Когда эффект **не** нужен (и почему «effect для всего» — антипаттерн)
- Связь с shop-каталогом: side effects без лишних запросов к `:8090`

---

## UI vs side effects

**Рендер** — чистая функция: `(props, state) → JSX`. В теле компонента нельзя:

- вызывать `fetch` «просто так»;
- писать в `document.title` на каждый render;
- подписываться на события без cleanup.

`useEffect` говорит React: «**после** того как браузер отрисовал DOM, выполни это».

```tsx
import { useEffect, useState } from "react";

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  return (
    <button type="button" onClick={() => setDark((v) => !v)}>
      {dark ? "Светлая" : "Тёмная"}
    </button>
  );
}
```

Эффект с `[dark]` запускается после mount и **каждый раз**, когда `dark` меняется.

---

## Сигнатура и порядок выполнения

```tsx
useEffect(() => {
  // setup — side effect
  return () => {
    // cleanup — опционально
  };
}, [dependency1, dependency2]);
```

| Этап | Когда срабатывает setup | Когда срабатывает cleanup |
|------|-------------------------|---------------------------|
| **Mount** | после первого render в DOM | — |
| **Update** | после render, если deps изменились | **перед** новым setup (старый cleanup) |
| **Unmount** | — | перед удалением компонента |

```text
Mount:     render → paint → setup
Update:    render → paint → cleanup (старый) → setup (новый)
Unmount:   cleanup
```

---

## Mount-only эффект

Пустой массив зависимостей `[]` — эффект **один раз** после mount (аналог `componentDidMount`):

```tsx
function ShopHeader() {
  useEffect(() => {
    document.title = "Shop — каталог";
  }, []);

  return <h1>Каталог товаров</h1>;
}
```

Используйте осознанно: «инициализация один раз», не «спрятать fetch без deps» (см. [15-effect-patterns.md](15-effect-patterns.md)).

---

## Эффект на каждый render

Если **второй аргумент опущен**, React запускает setup **после каждого** render:

```tsx
useEffect(() => {
  console.log("После каждого render");
});
```

На практике так почти никогда не пишут — риск бесконечных циклов и лишней работы. ESLint `react-hooks/exhaustive-deps` предупреждает о пропущенных deps.

---

## Cleanup при unmount

Подписки и таймеры **обязаны** отписываться:

```tsx
function ViewportBadge() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    function onResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return <span>Ширина: {width}px</span>;
}
```

Без `removeEventListener` при уходе со страницы каталога обработчик останется — классическая утечка в SPA.

---

## localStorage: типичный shop-сценарий

```tsx
const STORAGE_KEY = "shop-theme";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // ...
}
```

**Lazy initializer** в `useState` читает storage **один раз** при mount. **Запись** — в effect при изменении `theme`, не в render.

---

## Strict Mode и двойной mount (dev)

В React 19 + Strict Mode (dev) React **намеренно** монтирует → размонтирует → монтирует снова, чтобы выявить отсутствие cleanup. В консоли эффект может «мелькнуть» дважды — это **нормально** в development, не баг вашего кода.

Проверяйте: cleanup отменяет таймеры и подписки? Если да — prod будет стабилен.

---

## Когда `useEffect` не нужен

| Задача | Правильный инструмент |
|--------|----------------------|
| Ответ на клик «Купить» | `onClick` handler |
| Фильтр списка по state | вычисление при render (`filter`) |
| Данные для UI из props | props напрямую |
| Кэш API-ответов | TanStack Query ([20-tanstack-query.md](20-tanstack-query.md)) |

`useEffect` — не «второй render». Не дублируйте state, который можно вывести из другого state ([12-lifting-state.md](12-lifting-state.md)).

---

## Связь с FastAPI :8090

Загрузка `/api/v1/items` **внутри** effect — рабочий паттерн для [17-fetch-react.md](17-fetch-react.md), но:

- не вызывайте `fetch` в теле компонента без effect;
- не забывайте loading/error state;
- позже Query заменит ручной effect ([20-tanstack-query.md](20-tanstack-query.md)).

Стенд: [deploy/fastapi](../../deploy/fastapi/README.md), порт **8090**.

---

## Типичные ошибки

1. **Side effect в render** — `localStorage.setItem` / `fetch` в теле компонента.

2. **Нет cleanup** — `addEventListener`, `setInterval` без отписки.

3. **Бесконечный цикл** — `useEffect(() => setCount(c + 1))` без deps или с dep, который effect сам меняет.

4. **Путаница mount и update** — ожидали «один раз», забыли `[ ]`.

5. **Effect вместо handler** — отправка формы в `useEffect` при изменении поля вместо `onSubmit`.

6. **Игнор Strict Mode** — удаляют cleanup «чтобы не дублировалось» — ломают prod при unmount.

---

## Резюме

`useEffect` синхронизирует компонент с внешним миром **после** commit в DOM. Setup выполняется на mount и при изменении deps; cleanup — перед следующим setup и при unmount. Пустой `[]` — один раз после mount. Side effects в render — антипаттерн. Подписки и таймеры требуют cleanup. Strict Mode в dev проверяет устойчивость эффектов.

---

## Чек-лист

- Чем render отличается от effect по времени выполнения?
- Когда срабатывает cleanup?
- Зачем `[dark]` во втором аргументе?
- Почему `localStorage.setItem` в render — плохо?
- Что делает Strict Mode с mount в development?
- Нужен ли `useEffect` для фильтрации массива товаров по `search`?

Следующий урок: [15. Зависимости и паттерны effect](15-effect-patterns.md).
