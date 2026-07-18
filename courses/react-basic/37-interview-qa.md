# 37. Interview Q&A: топ-35 вопросов по React

## Введение: зачем эта глава

На frontend-собеседовании React проверяют не синтаксис `useState`, а **модель обновления UI**, hooks rules, data fetching, performance intuition и trade-offs (Context vs Query, memo когда нужен). Эта глава — **развёрнутые ответы** к [interview-cheatsheet.md](interview-cheatsheet.md).

**Как работать:**

1. Прочитайте вопрос, **закройте** ответ, ответьте вслух 1–2 минуты.
2. Сравните с разбором: важно **почему**, не только **что**.
3. Провал — вернитесь к уроку из «Где в курсе».

---

## Блок 1. Основы React

### 1. Чем React отличается от «просто JavaScript в HTML»?

**Ответ.** React — библиотека для **declarative UI**: вы описываете `UI = f(state, props)`, React согласует DOM через Virtual DOM и reconciliation. Vanilla JS — императивные правки DOM (`createElement`, `innerHTML`). React снижает рассинхрон state/DOM и масштабирует компонентное дерево. React **не** роутер и **не** data layer — их добавляют отдельно (Router, TanStack Query).

**Где в курсе:** [01-landscape.md](01-landscape.md).

---

### 2. Что такое JSX? Компилируется ли он в HTML?

**Ответ.** JSX — синтаксический сugar над `React.createElement` (или новым JSX runtime). `<ProductCard title="x" />` → вызов функции с props. **Не** строка HTML: `className` вместо `class`, expressions в `{ }`, один root или Fragment. Babel/SWC компилирует в JS.

**Где в курсе:** [02-jsx-components.md](02-jsx-components.md).

---

### 3. MPA vs SPA — когда React оправдан?

**Ответ.** **MPA:** полная перезагрузка страницы, HTML с сервера — проще SEO, меньше JS. **SPA:** один bundle, навигация без full reload, богатый интерактив (фильтры, корзина). React оправдан при частых локальных обновлениях UI и JSON API backend (mock-exams shop + FastAPI `:8090`). Статический лендинг — often overkill.

**Где в курсе:** [01-landscape.md](01-landscape.md).

---

### 4. Virtual DOM — всегда ли быстрее ручного DOM?

**Ответ.** **Нет.** Virtual DOM — компромисс: предсказуемость и developer experience; diff + commit имеют стоимость. Для огромных списков нужны virtualization и мемоизация. React не «ускоряет DOM», а **структурирует** обновления.

**Где в курсе:** [01-landscape.md](01-landscape.md), [27-ref-memo-callback.md](27-ref-memo-callback.md).

---

### 5. Однонаправленный поток данных — что это?

**Ответ.** Data flow **down** via props; events/callbacks **up**. Дети не мутируют props. Shared state — common parent (lifting) или Context. Упрощает отладку: источник truth один.

**Где в курсе:** [04-props.md](04-props.md), [12-lifting-state.md](12-lifting-state.md).

---

## Блок 2. Компоненты, props, lists

### 6. Props vs state?

**Ответ.** **Props** — входные параметры от родителя, read-only для ребёнка. **State** — внутренние данные компонента (`useState`), изменение вызывает re-render. Props меняет родитель; state — `setState` внутри владельца.

**Где в курсе:** [04-props.md](04-props.md), [09-useState.md](09-useState.md).

---

### 7. Зачем `key` в списках? Почему index — плохой key?

**Ответ.** Keys помогают reconciliation **идентифицировать** элемент между renders. Stable id (`item.id`) сохраняет state DOM-узла при reorder/filter. **Index** ломается при insert/delete/reorder — wrong component state, лишние unmount/mount, bugs в forms.

**Где в курсе:** [07-lists-keys.md](07-lists-keys.md).

---

### 8. Controlled vs uncontrolled input?

**Ответ.** **Controlled:** value из React state, `onChange` обновляет state — single source of truth. **Uncontrolled:** value в DOM, читаем через ref. Controlled — default для forms в React (validation, reset). Uncontrolled — файлы, интеграция с non-React lib.

**Где в курсе:** [10-events-controlled.md](10-events-controlled.md).

---

### 9. Composition vs inheritance?

**Ответ.** React рекомендует **composition**: `children`, render props, slots — вместо class extends. Наследование class components — legacy pattern.

**Где в курсе:** [05-children-composition.md](05-children-composition.md).

---

### 10. Lifting state up — когда?

**Ответ.** Когда **два+ sibling** должны показывать/менять одни данные (фильтр + список). State поднимают к **ближайшему общему** родителю; props вниз, callbacks вверх. Если drilling глубокий — Context ([29-context.md](29-context.md)).

**Где в курсе:** [12-lifting-state.md](12-lifting-state.md).

---

## Блок 3. Hooks

### 11. Rules of Hooks?

**Ответ.** (1) Вызывать hooks только на **top level** — не в if/loop/nested functions. (2) Только из **React function components** или **custom hooks**. Причина: React хранит state hooks в фиксированном порядке вызовов; условный вызов сбивает индексы.

**Где в курсе:** [28-custom-hooks.md](28-custom-hooks.md).

---

### 12. `useState` batching — несколько setState?

**Ответ.** В React 18+ updates в event handlers и many async paths **batch** — один re-render. `setA(1); setB(2);` — один commit. Исключения исторически в setTimeout без batching — в 18 automatic batching шире.

**Где в курсе:** [09-useState.md](09-useState.md).

---

### 13. Functional update `setState(prev => ...)` — зачем?

**Ответ.** Когда новое state **зависит от предыдущего** и updates могут batch/async — `prev` актуален. `setCount(c => c + 1)` без stale closure. Особенно в rapid events и effects.

**Где в курсе:** [09-useState.md](09-useState.md).

---

### 14. `useEffect` vs event handler?

**Ответ.** **Effect** — синхронизация с **внешним миром** после render: fetch (если не Query), subscriptions, document.title. **Handler** — реакция на **действие пользователя** (click, submit). Не дублируйте fetch на каждый render в effect без deps; не ставьте «on click logic» в effect без причины.

**Где в курсе:** [14-useEffect.md](14-useEffect.md), [15-effect-patterns.md](15-effect-patterns.md).

---

### 15. Dependency array `[]`, `[a]`, no array?

**Ответ.** `[]` — mount/unmount (cleanup on unmount). `[a,b]` — re-run when `a` or `b` change (compare Object.is). **No array** (omit in rules — actually every effect has array; missing means run every render) — almost always bug except rare patterns. ESLint exhaustive-deps помогает.

**Где в курсе:** [15-effect-patterns.md](15-effect-patterns.md).

---

### 16. Cleanup в useEffect — пример?

**Ответ.** Return function: clearInterval, removeEventListener, abort fetch. Вызывается перед следующим effect run и при unmount. Предотвращает leaks и setState on unmounted component.

**Где в курсе:** [15-effect-patterns.md](15-effect-patterns.md).

---

### 17. `useRef` vs `useState`?

**Ответ.** **useState** — изменение тригgerит re-render. **useRef** — `.current` mutable **без** re-render. Ref для DOM nodes, timer ids, previous values. UI от ref.current во render — anti-pattern.

**Где в курсе:** [27-ref-memo-callback.md](27-ref-memo-callback.md).

---

### 18. `useMemo` и `useCallback` — когда нужны?

**Ответ.** Когда **измерен** bottleneck: дорогой filter/sort, `React.memo` child нуждается в stable props reference, stable callback for effect deps. **Не** по умолчанию на каждый handler — overhead сравнения deps. Server cache — TanStack Query, не useMemo fetch.

**Где в курсе:** [27-ref-memo-callback.md](27-ref-memo-callback.md).

---

### 19. Custom hook — что это?

**Ответ.** Функция `use*` calling other hooks — переиспользование **stateful logic**, не UI. Пример: `useDebouncedValue`, `useCart`. Не hooks в обычных utils.

**Где в курсе:** [28-custom-hooks.md](28-custom-hooks.md).

---

## Блок 4. Data, API, Query

### 20. Где fetch в React — effect, Query, loader?

**Ответ.** **TanStack Query** (preferred): cache, dedupe, stale, refetch, loading flags. Raw **useEffect + fetch** — OK для learning, легко ошибиться (race, no cache). **Router loaders** — data before route (обзор [24-nested-routes.md](24-nested-routes.md)). mock-exams shop — Query к `:8090`.

**Где в курсе:** [17-fetch-react.md](17-fetch-react.md), [20-tanstack-query.md](20-tanstack-query.md).

---

### 21. CORS — это ошибка React?

**Ответ.** **Нет.** Browser security: SPA на `:5173` fetch `:8090` — нужны заголовки `Access-Control-Allow-Origin` на API. React не обходит CORS. Fix на FastAPI middleware ([18-cors-fastapi.md](18-cors-fastapi.md)).

**Где в курсе:** [18-cors-fastapi.md](18-cors-fastapi.md).

---

### 22. queryKey в TanStack Query — зачем?

**Ответ.** Уникальный ключ кэша: `["items", { q, page }]`. Invalidate `["items"]` после mutation refreshes lists. Stable serializable keys — best practice.

**Где в курсе:** [20-tanstack-query.md](20-tanstack-query.md), [21-mutations.md](21-mutations.md).

---

### 23. Optimistic update — идея?

**Ответ.** UI обновляется **до** ответа сервера; при ошибке rollback. Query: `onMutate` snapshot + `onError` restore. UX быстрее для add-to-cart; нужна согласованность с server truth.

**Где в курсе:** [21-mutations.md](21-mutations.md).

---

## Блок 5. Router, Context, UI

### 24. React Router — role в SPA?

**Ответ.** Sync **URL** с component tree: `/catalog`, `/items/5`, query params. Browser back/forward работает. React не включает router — `react-router-dom`. Layout routes + `Outlet` ([24-nested-routes.md](24-nested-routes.md)).

**Где в курсе:** [23-react-router.md](23-react-router.md).

---

### 25. URL search params как state?

**Ответ.** Shareable filter/sort: `?q=milk&sort=price`. `useSearchParams` read/write. Prefer over Context для **bookmarkable** UI state ([26-url-state.md](26-url-state.md)).

**Где в курсе:** [26-url-state.md](26-url-state.md).

---

### 26. Context — когда использовать, когда нет?

**Ответ.** **Да:** theme, locale, client cart — много потребителей, не server cache. **Нет:** server lists (Query), form field state (local), deep drilling fixable one level up, high-frequency updates (perf). Split contexts, memo value.

**Где в курсе:** [29-context.md](29-context.md).

---

### 27. Loading / error / empty — обязательны?

**Ответ.** Любой async screen needs три явных UX states + retry on error. Empty ≠ error. Skeleton для lists ([31-ui-states.md](31-ui-states.md)).

**Где в курсе:** [31-ui-states.md](31-ui-states.md).

---

## Блок 6. TypeScript, structure, debug

### 28. Как типизировать props и events?

**Ответ.** Interface props; `ChangeEvent<HTMLInputElement>`; `ComponentProps<"button">` для extend native; generic `DataList<T>`. Shared API types in `types/item.ts` ([32-typescript-react.md](32-typescript-react.md)).

**Где в курсе:** [32-typescript-react.md](32-typescript-react.md).

---

### 29. StrictMode double render — баг?

**Ответ.** **Dev-only** intentional double invoke render/effects для поиска side effects. Prod — один раз. Не «fix» пустыми deps.

**Где в курсе:** [36-devtools.md](36-devtools.md), [00-environment.md](00-environment.md).

---

### 30. React DevTools Profiler — что ищете?

**Ответ.** Commits duration, **why component re-rendered** (props/state/context changed). Cascade from Context new value or unstable callback. Measure before memo.

**Где в курсе:** [36-devtools.md](36-devtools.md).

---

### 31. Feature folder structure — зачем?

**Ответ.** Scale: `pages/` thin routes, `features/catalog`, shared `components/ui`, `api/` for HTTP. Predictable imports, review capstone ([35-project-structure.md](35-project-structure.md)).

**Где в курсе:** [35-project-structure.md](35-project-structure.md).

---

## Блок 7. Сравнения и senior-ish

### 32. React vs Vue/Angular (кратко)?

**Ответ.** React — library + ecosystem choices; Vue — progressive framework SFC; Angular — full framework DI/RxJS. React wins hiring surface; trade-off — assemble stack yourself (Router, Query). mock-exams standardizes React + FastAPI.

**Где в курсе:** [01-landscape.md](01-landscape.md).

---

### 33. Class components vs hooks?

**Ответ.** Classes: `this.state`, lifecycle methods — legacy. Hooks: compose logic, less boilerplate, official recommendation. Maintain legacy, write new with functions.

**Где в курсе:** [01-landscape.md](01-landscape.md).

---

### 34. Error Boundary — что делает? (обзор)

**Ответ.** Class component `componentDidCatch` / `getDerivedStateFromError` — ловит **render** errors в children, показывает fallback UI. **Не** ловит event handlers, async, SSR same way. react-intermediate углубит; на собесе — знать существование.

**Где в курсе:** README → react-intermediate.

---

### 35. Как бы вы спроектировали catalog SPA к REST API?

**Ответ (outline).** Vite+React+TS; React Router (`/`, `/items/:id`, `/cart`); TanStack Query для `GET /api/v1/items` к `:8090`; typed `api/client`; UI states loading/error/empty; cart in Context; forms controlled + mutation invalidate; CSS modules; structure `features/` + `pages/`; CORS on API; capstone acceptance criteria ([38-capstone.md](38-capstone.md)).

**Где в курсе:** весь трек react-basic.

---

## После главы

1. Пройдите [interview-cheatsheet.md](interview-cheatsheet.md) **без подглядывания**.
2. [38-capstone.md](38-capstone.md) — финальный проект.
3. Дальше: [react-intermediate](../react-intermediate/README.md), [javascript-testing](../javascript-path.md).
