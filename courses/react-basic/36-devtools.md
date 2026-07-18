# 36. React DevTools и отладка

## Введение: «Компонент рендерится 47 раз при одном клике»

Staging shop: добавление в корзину лагает. Profiler показывает — весь `CatalogPage` перерисовывается, потому что Context value пересоздаётся каждый render ([29-context.md](29-context.md)). Без DevTools вы добавили `useMemo` наугад в пять мест ([27-ref-memo-callback.md](27-ref-memo-callback.md)).

**React Developer Tools** — расширение браузера + вкладки Components и Profiler. Дополнительно: **why-did-you-render** (WDYR) — dev-only библиотека для логирования лишних renders. Эта глава — практический workflow для mock-exams SPA.

## Что вы узнаете

- Установка React DevTools.
- Components tree: props, state, hooks.
- Profiler: record, flamegraph, commit duration.
- Типичные баги: stale props, wrong key, effect loops.
- WDYR — setup overview, когда полезен.
- Связь с [31-ui-states.md](31-ui-states.md), Query Devtools.

---

## Установка

1. Chrome/Edge/Firefox: расширение **React Developer Tools**.
2. Откройте `http://localhost:5173` (examples).
3. DevTools → вкладки **Components** и **Profiler** (появляются только на React apps).

Если вкладок нет — site не React, или production build без dev hook (редко в Vite dev).

---

## Components panel

### Дерево

Inspect `<ProductCard>` — видите:
- **props** (`item`, `onAdd`)
- **hooks** (`State`, `Context`, `Memo`)
- **rendered by** — parent chain

### Edit props live

Временно измените `item.title` — UI обновится. Для repro багов без пересборки.

### Suspense / Server (preview)

React 19 — hooks list может включать `Memoized`/`Effect`. Имена minified в prod — используйте **source maps** (`vite build --sourcemap` для staging debug).

---

## Поиск лишних re-renders

### Сценарий: CartProvider

1. Components → `CartProvider` → settings → **highlight updates**.
2. Клик «В корзину» — подсвечивается половина дерева.
3. Проверьте `value` prop Provider — новый object каждый render?

Fix: `useMemo` на value ([29-context.md](29-context.md)).

### Сценарий: inline function без memo child

`ProductCard` wrapped in `memo` — всё равно updates. Props → `onAdd` **new function** each render. Fix: `useCallback` ([27-ref-memo-callback.md](27-ref-memo-callback.md)) **или** уберите memo если не нужен.

---

## Profiler

### Запись

1. Profiler → Record.
2. Выполните сценарий: открыть catalog, filter, add to cart.
3. Stop.

### Чтение

- **Flame graph** — длительность render каждого component.
- **Ranked** — кто съел больше времени.
- **Why did this render?** (React 19+ DevTools) — props/state/context changed.

**Commit phases:** render (pure) vs commit (DOM). Долгий render — тяжёлый JS или huge tree.

### Целевые метрики (ориентир dev)

Catalog first paint — большинство commits < 16ms для 60fps **не** guarantee, но red flags > 50ms на keystroke search.

---

## React Strict Mode

`main.tsx`:

```tsx
<StrictMode>
  <App />
</StrictMode>
```

Development **double-invoke** render/effects — намеренно ([15-effect-patterns.md](15-effect-patterns.md)). Не пугайтесь двойного fetch в dev; в prod — один раз. Profiler записывайте с пониманием double render.

---

## TanStack Query Devtools

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

Показывает:
- query keys `["items"]`
- stale/fresh, cache time
- refetch triggers

Сверяйте с UI loading states [31-ui-states.md](31-ui-states.md). «Двойной fetch» — Strict Mode + missing staleTime — не всегда баг.

---

## why-did-you-render (обзор)

Библиотека `@welldone-software/why-did-you-render` логирует в console, почему memo component re-rendered.

### Setup sketch (dev only)

```tsx
// wdyr.ts
import React from "react";

if (import.meta.env.DEV) {
  const whyDidYouRender = await import("@welldone-software/why-did-you-render");
  whyDidYouRender.default(React, {
    trackAllPureComponents: true,
    trackHooks: true,
  });
}
```

```tsx
// main.tsx — первый import
import "./wdyr";
```

Mark component:

```tsx
ProductCard.whyDidYouRender = true;
```

**Console:** `ProductCard re-rendered because props.onAdd changed`.

### Когда использовать

- Profiler показал частые updates memo-компонентов.
- Не включайте `trackAllPureComponents` permanently — шум.

### Когда не нужен

- Мало components, obvious Context bug.
- Production builds — **never** bundle WDYR.

---

## Отладка useEffect

Components → select component → hooks → Effect dependencies.

Симптом: infinite loop — effect sets state → deps change → effect again.

**Fix:** correct deps, functional update, move logic to event handler ([15-effect-patterns.md](15-effect-patterns.md)).

DevTools **не** заменяет `console.log` для async order — но показывает **сколько** renders произошло.

---

## Отладка Router

React Router DevTools нет в core; смотрите URL bar + Components tree `Routes` / `Outlet`. Wrong route — inspect matched route in [25-lab-router.md](25-lab-router.md) config.

**useSearchParams** — props in router hooks visible via Components state.

---

## Network + React

DevTools **Network** tab отдельно:
- duplicate `GET /api/v1/items` — Query dedupe, Strict Mode, or missing queryKey stability.
- CORS error — [18-cors-fastapi.md](18-cors-fastapi.md), не React bug.

---

## Breakpoints в IDE

VS Code/Cursor: breakpoint в `ProductCard.tsx`, Chrome attaches to Vite. Альтернатива — `debugger;` statement.

Source maps in Vite dev — on by default.

---

## Checklist отладки shop bug

1. Reproduce in dev, React DevTools installed.
2. Components — props/state as expected?
3. Query Devtools — cache hit/miss?
4. Profiler — who re-renders on action?
5. Network — API OK `:8090`?
6. Effect deps — loop?
7. Only then memo/useCallback ([27-ref-memo-callback.md](27-ref-memo-callback.md)).

---

## Типичные ошибки

**Optimize before measure** — memo everywhere, bug was wrong `key`.

**Ignore Strict Mode double effects** — «fix» with empty deps → stale data.

**WDYR in production** — bundle size + leak patterns.

**Confuse React DevTools with Redux DevTools** — разные extensions.

**Profiler in dev only** — prod performance differs; validate with production build profile when needed.

---

## Резюме

React DevTools — inspect tree, props, hooks; Profiler — find slow/ frequent renders. Query Devtools — server state. WDYR — dev helper для memo violations. Measure, then fix Context value / callbacks / keys.

## Чек-лист

- [ ] Где вкладка Components на :5173
- [ ] Как записать Profiler session
- [ ] Strict Mode double render — зачем
- [ ] Query Devtools для `["items"]`
- [ ] WDYR — dev-only, что логирует

Следующий урок: [37. Interview Q&A](37-interview-qa.md).
