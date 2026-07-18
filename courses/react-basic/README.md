# React — Basic

Мега-подробный курс **React** для UI к shop API mock-exams: компоненты, JSX, props, state, hooks, формы, React Router, `fetch` и **TanStack Query** к [`deploy/fastapi`](../../deploy/fastapi/README.md) `:8090`. **38 уроков** + capstone + interview cheatsheet.

> Старт JS-маршрута: [`javascript-path.md`](../javascript-path.md). **Предварительно** — [`javascript-basic`](../javascript-basic/README.md) и желательно [`typescript-basic`](../typescript-basic/README.md). Дальше — [`react-intermediate`](../react-intermediate/README.md), [`javascript-testing`](../javascript-path.md).

**Предварительно:** Node.js **LTS** (20 или 22), уверенный JS (функции, массивы, `async/await`, `fetch`), базовый TypeScript (props, union, Zod — для лаб с API).

**Локально:** Vite + React в каталоге [`examples/`](examples/package.json). Backend FastAPI — опционально до главы 18, обязателен с главы 19.

```bash
cd courses/react-basic/examples
npm install
npm run dev          # http://localhost:5173
# в другом терминале — FastAPI стенд :8090 (см. deploy/fastapi)
```

## Как читать главы

Каждый урок — **полноценная глава учебника**, не шпаргалка. Автор ведёт от **рабочего сценария** (тикет в Jira, баг в prod, code review) к концепциям, коду и типичным ошибкам — как в javascript-basic.

1. **Теория** — «Сценарий с работы» → объяснение → примеры → «Типичные ошибки» → «Чек-лист». Закрепляйте чек-лист **своими словами** до лабы.
2. **Лаба** — hands-on в [`examples/`](examples/package.json): `npm run dev`, правки в `src/`, критерии успеха. Лаба **продолжает сюжет** теории.
3. После блока 37 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **без подглядывания** в главы.
4. [38-capstone.md](38-capstone.md) — **6–8 часов**, SPA «Shop Catalog» к `:8090`.

**Время:** **~50–70 минут** на пару «теория + лаба». Весь курс — **~16–20 часов**; capstone отдельно.

## Программа (38 уроков)

### Фаза 1. Среда и первое приложение (00–03)

| # | Урок |
|---|------|
| 00 | [Окружение: Vite, React, DevTools](00-environment.md) |
| 01 | [Ландшафт: SPA, React, Virtual DOM](01-landscape.md) |
| 02 | [JSX и функциональные компоненты](02-jsx-components.md) |
| 03 | [Лаба: первое приложение](03-lab-first-app.md) |

### Фаза 2. Props и композиция (04–08)

| 04 | [Props: передача данных вниз](04-props.md) |
| 05 | [Children, composition, slots](05-children-composition.md) |
| 06 | [Лаба: карточка товара](06-lab-props.md) |
| 07 | [Списки, keys, фрагменты](07-lists-keys.md) |
| 08 | [Условный рендеринг](08-conditional-rendering.md) |

### Фаза 3. State и события (09–13)

| 09 | [`useState`: локальное состояние](09-useState.md) |
| 10 | [События и controlled inputs](10-events-controlled.md) |
| 11 | [Лаба: корзина и счётчик](11-lab-state.md) |
| 12 | [Lifting state up](12-lifting-state.md) |
| 13 | [Лаба: фильтр каталога](13-lab-lifting-state.md) |

### Фаза 4. Side effects (14–17)

| 14 | [`useEffect`: синхронизация с внешним миром](14-useEffect.md) |
| 15 | [Зависимости, cleanup, типичные паттерны](15-effect-patterns.md) |
| 16 | [Лаба: поиск с debounce](16-lab-effects.md) |
| 17 | [`fetch` в React: loading и ошибки](17-fetch-react.md) |

### Фаза 5. API и TanStack Query (18–22)

| 18 | [CORS, FastAPI :8090, контракт API](18-cors-fastapi.md) |
| 19 | [Лаба: список товаров с API](19-lab-fetch-items.md) |
| 20 | [TanStack Query: queries и cache](20-tanstack-query.md) |
| 21 | [Mutations, invalidation, optimistic UI](21-mutations.md) |
| 22 | [Лаба: CRUD через Query](22-lab-query.md) |

### Фаза 6. Маршрутизация (23–26)

| 23 | [React Router: маршруты и навигация](23-react-router.md) |
| 24 | [Nested routes, layout, loaders (обзор)](24-nested-routes.md) |
| 25 | [Лаба: каталог / товар / 404](25-lab-router.md) |
| 26 | [URL как state: search params](26-url-state.md) |

### Фаза 7. Продвинутые hooks и контекст (27–31)

| 27 | [`useRef`, `useMemo`, `useCallback`](27-ref-memo-callback.md) |
| 28 | [Custom hooks](28-custom-hooks.md) |
| 29 | [Context: глобальное состояние без prop drilling](29-context.md) |
| 30 | [Лаба: тема и корзина через Context](30-lab-context.md) |
| 31 | [Loading, error, empty states в UI](31-ui-states.md) |

### Фаза 8. TypeScript, стили, структура (32–35)

| 32 | [TypeScript в React: props, events, children](32-typescript-react.md) |
| 33 | [Стили: CSS modules, Tailwind (обзор)](33-styling.md) |
| 34 | [Лаба: типизированный каталог](34-lab-typescript.md) |
| 35 | [Структура проекта и соглашения](35-project-structure.md) |

### Фаза 9. Отладка и финал (36–38)

| 36 | [React DevTools и отладка](36-devtools.md) |
| 37 | [Interview Q&A (топ-35)](37-interview-qa.md) |
| 38 | [Capstone: Shop Catalog SPA](38-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Создаёте **Vite + React + TypeScript** проект и объясняете цикл dev/build.
- Пишете **функциональные компоненты** с JSX, props, children, списками и keys.
- Управляете **локальным state** (`useState`), поднимаете state к общему родителю.
- Обрабатываете **события** и **controlled forms** без «пропавшего курсора».
- Используете **`useEffect`** осознанно: зависимости, cleanup, без лишних запросов.
- Загружаете данные с **FastAPI :8090** через `fetch` и **TanStack Query**.
- Настраиваете **React Router**: список, деталь, 404, query params.
- Выносите логику в **custom hooks** и **Context** без «бога-компонента».
- Типизируете props и API-ответы; показываете **loading/error/empty** в UI.
- Отлаживаете через **React DevTools** и понимаете типичные вопросы на собеседовании.

## Связь с курсами

| Курс | Связь |
|------|-------|
| [`javascript-basic`](../javascript-basic/README.md) | язык, `fetch`, event loop |
| [`typescript-basic`](../typescript-basic/README.md) | props types, Zod, typed fetch |
| [`fastapi`](../../deploy/fastapi/README.md) | shop API `:8090`, CORS |
| [`api-design`](../api-design/README.md) | REST, статусы, пагинация |
| [`react-intermediate`](../react-intermediate/README.md) | auth, error boundaries, performance |
| [`javascript-testing`](../javascript-path.md) | Testing Library, MSW |

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/package.json`](examples/package.json) | Vite, React 19, Router, Query |
| [`examples/src/`](examples/src/) | стартовый код для лаб |
| [`examples/solutions/`](examples/solutions/) | эталоны (после своей попытки) |
