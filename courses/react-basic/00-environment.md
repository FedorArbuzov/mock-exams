# 00. Окружение: Vite, React, DevTools

## Введение: «У меня локально белый экран»

Среда, вторник. Вы только что склонировали репозиторий shop-frontend, выполнили `npm install`, `npm run dev` — в браузере **пустая белая страница**, в консоли красная простыня `Uncaught SyntaxError`. Коллега пишет: «У меня работает, ты точно Node 20?» DevOps в CI: `vite build` падает на `Cannot find module '@/components/Button'`. Три симптома — три разных слоя: **runtime Node**, **dev-сервер Vite**, **браузер + React**.

На курсе [`javascript-basic`](../javascript-basic/00-environment.md) вы учились запускать `node script.js`. React-приложение — **не один файл**: исходники `.tsx` компилируются на лету, модули резолвятся через bundler, UI монтируется в DOM через `createRoot`. Без карты окружения каждый урок превращается в «магия Vite».

В mock-exams React-клиент ходит к shop API на FastAPI [`deploy/fastapi`](../../deploy/fastapi/README.md) **:8090**. Сейчас достаточно поднять **только** frontend в `examples/`; backend подключим в главе 18.

## Что вы узнаете

- Зачем **Vite** вместо «голого HTML + script tag» для React.
- Как устроен цикл **edit → HMR → браузер**.
- Структура каталога **`examples/`** и скрипты `npm run dev` / `build`.
- **Node LTS**, `npm install`, типичные ошибки версий.
- Минимум **React DevTools** — куда смотреть, когда «ничего не рендерится».

## Зачем Vite, а не CDN с React

Можно подключить React через `<script src="unpkg.com/react">` — так делали в 2018. Для учебного one-pager это ок. Для shop SPA с TypeScript, десятками компонентов, React Router и TanStack Query — **нет**:

| Подход | Плюсы | Минусы для курса |
|--------|-------|------------------|
| CDN + Babel in browser | нулевая настройка | медленно, без TS, без tree-shaking |
| Create React App (legacy) | привычно | deprecated, медленный dev |
| **Vite** | быстрый HMR, TS из коробки | нужен Node |

**Vite** в dev-режиме отдаёт ES modules напрямую в браузер; TypeScript и JSX трансформирует через **esbuild**. Production-сборка — Rollup. Тот же стек — в [`typescript-basic`](../typescript-basic/01-landscape.md) и будущем `react-intermediate`.

## Установка и первый запуск

### Требования

- **Node.js LTS 20+** (или 22). Проверка: `node --version`.
- npm идёт с Node; альтернатива — pnpm/yarn (в курсе — npm).

### Каталог examples

```bash
cd courses/react-basic/examples
npm install
npm run dev
```

Откройте URL из терминала (обычно `http://localhost:5173`). Должны увидеть заголовок «Shop — react-basic».

| Команда | Назначение |
|---------|------------|
| `npm run dev` | dev-сервер + HMR |
| `npm run build` | production bundle в `dist/` |
| `npm run preview` | локальный просмотр `dist/` |
| `npm run typecheck` | `tsc` без emit |

### Что происходит при `npm run dev`

```text
main.tsx  →  import App  →  createRoot(#root).render(<App />)
                │
                ▼
         Vite трансформирует .tsx → JS
                │
                ▼
         Браузер выполняет модули, React рисует DOM
```

Файл [`examples/src/main.tsx`](examples/src/main.tsx) — **точка входа**. [`App.tsx`](examples/src/App.tsx) — корневой компонент. [`index.html`](examples/index.html) содержит `<div id="root">` — контейнер, **не** место для JSX вручную.

## StrictMode и двойной рендер

В `main.tsx` обёртка `<StrictMode>`:

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

В **development** React 18+ **намеренно** дважды монтирует компоненты, чтобы выявить side effects без cleanup. Это **не баг** и **не** происходит в production build. Если в `useEffect` без cleanup увидите двойной `fetch` — StrictMode помог найти проблему до прода ([14-useEffect.md](14-useEffect.md)).

## Proxy на FastAPI :8090

В [`vite.config.ts`](examples/vite.config.ts) настроен proxy:

```typescript
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8090",
      changeOrigin: true,
    },
  },
},
```

С фронта можно вызывать `fetch("/api/v1/items")` — Vite перенаправит на backend. Так обходим CORS в dev без правок FastAPI на каждой машине. Подробнее — [18-cors-fastapi.md](18-cors-fastapi.md).

## React DevTools

Расширение [React Developer Tools](https://react.dev/learn/react-developer-tools) для Chrome/Firefox:

- вкладка **Components** — дерево компонентов, props, hooks state;
- вкладка **Profiler** — кто лишний раз перерисовался (обзор; углубление в react-intermediate).

Если дерево пустое — React не смонтировался: смотрите **Console** и **Network**, не гадайте.

## Типичные ошибки

**«Белый экран, ошибок нет».** Часто `#root` не найден или `main.tsx` не подключён в `index.html`. Проверьте Elements: есть ли содержимое внутри `#root`.

**«Cannot find module '@/…'».** Alias `@` → `src/` задан в `vite.config.ts` и `tsconfig.json`. IDE должна подхватить `paths`; после клонирования — `npm install`.

**«Port 5173 is in use».** Vite предложит другой порт — используйте его или освободите порт.

**«У коллеги работает, у меня нет».** Сравните `node --version`, удалите `node_modules`, `npm install` заново.

**Редактирую файл, браузер не обновляется.** HMR иногда «ломается» после синтаксической ошибки — сохраните файл ещё раз или перезагрузите страницу (F5).

## Связь с курсом

| Урок | Связь |
|------|-------|
| [01. Ландшафт](01-landscape.md) | зачем React и SPA |
| [02. JSX](02-jsx-components.md) | первый компонент |
| [`javascript-basic/00`](../javascript-basic/00-environment.md) | Node на хосте |
| [`typescript-basic/00`](../typescript-basic/00-environment.md) | tsc + tsx |

## Чек-лист

- [ ] `npm run dev` поднимает приложение на localhost
- [ ] Знаете, где точка входа (`main.tsx`) и корень UI (`App.tsx`)
- [ ] Понимаете, зачем `StrictMode` даёт «двойной» эффект в dev
- [ ] Установлены React DevTools
- [ ] Знаете про proxy `/api` → `:8090`

Следующий урок: [01. Ландшафт: SPA, React, Virtual DOM](01-landscape.md).
