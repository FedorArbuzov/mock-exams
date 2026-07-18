# 37. Profiler, why-did-you-render и метрики

## Сценарий с работы

Ticket: «Admin table тормозит при 50 rows — не 800, уже pagination». PM не принимает «добавим memo везде». Вы открываете React DevTools Profiler, записываете interaction «toggle filter category» — commit 180ms, `ProductsTablePage` + 50× `ProductRow` + `Header` + `FilterBar` re-render. Root cause: Context `AuthProvider` value new object each render? Unstable callback in filter? **Measure first**, fix second ([18-rerender-model.md](18-rerender-model.md), [19-memo-patterns.md](19-memo-patterns.md)).

## Что вы узнаете

- React DevTools Profiler: flamegraph, ranked, «why did this render?»
- Interaction tracing vs mount profiling
- `@welldone-software/why-did-you-render` — dev-only noise control
- Web Vitals в SPA (ограничения)
- Performance budget для admin UI

---

## React DevTools Profiler

1. Install React DevTools extension.
2. Tab **Profiler** → Record (⚫).
3. Perform action: change filter, open modal, toggle sidebar.
4. Stop → analyze commits.

| View | Что смотреть |
|------|--------------|
| Flamegraph | duration per component tree |
| Ranked | top offenders by self/total time |
| Component chart | specific component over commits |

**React 19+** — «Why did this render?» highlights: props changed, state changed, context changed, parent re-rendered.

---

## Interpretation workflow

```text
1. Reproduce slow interaction
2. Record Profiler
3. Find longest commit bar
4. Expand tree — who participated?
5. Check «why render» on unexpected nodes
6. Fix root cause (not symptom)
7. Re-record — compare duration
```

Example findings in admin SPA:

| Symptom | Common cause | Fix |
|---------|--------------|-----|
| All rows re-render on header toggle | State in parent above table | Split state / composition |
| Row re-render on unrelated filter | Unstable inline props | useCallback + memo row |
| Everything re-renders | Context value `{}` new ref | memo value, split context |
| 50 rows slow without memo | Heavy cell render | simplify cell / virtualization ([20-virtualization.md](20-virtualization.md)) |

---

## Interaction vs mount

| Scenario | Record when |
|----------|-------------|
| Initial load | Mount Profiler |
| Filter change | Interaction |
| Route navigation | Interaction |
| Optimistic toggle | Interaction |

StrictMode **double invoke** in dev — compare relative before/after, not absolute ms to prod.

---

## why-did-you-render (WDYR)

Dev-only library logs unexpected re-renders:

```tsx
// wdyr.ts — import first in main.tsx DEV only
import React from "react";

if (import.meta.env.DEV) {
  const whyDidYouRender = await import("@welldone-software/why-did-you-render");
  whyDidYouRender.default(React, {
    trackAllPureComponents: false,
    trackHooks: true,
    logOnDifferentValues: true,
  });
}

// ProductRow.tsx
ProductRow.whyDidYouRender = true;
```

**Noise:** enable per component, not global `trackAll`. Remove or disable before perf benchmarks.

---

## memo / useCallback — после измерения

```tsx
const ProductRow = memo(function ProductRow({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (id: number) => void;
}) {
  return (/* ... */);
});

// Parent
const onDelete = useCallback(
  (id: number) => deleteMutation.mutate(id),
  [deleteMutation.mutate],
);
```

Memo useless if `onDelete` new reference every parent render.

---

## TanStack Query Devtools

Query devtools show:

- active queries, stale/fresh
- refetch triggers (focus, invalidate)
- unnecessary refetches mistaken for «slow React»

Network tab + Query devtools + Profiler — **triangulate**.

---

## Web Vitals в SPA

| Metric | Admin SPA relevance |
|--------|---------------------|
| LCP | login page, first catalog paint |
| INP | filter interaction, button click |
| CLS | skeleton → content shift in table |

```tsx
// optional web-vitals
import { onINP, onLCP } from "web-vitals";

onINP(console.log);
```

SPA without SSR: LCP often later than MPA — focus **INP** for internal tools.

Send to analytics (Plausible, Datadog RUM) — optional capstone extension.

---

## Performance budget (internal admin)

Suggested targets (dev laptop, 50 rows):

| Interaction | Budget |
|-------------|--------|
| Filter change → paint | < 100ms perceived |
| Route change (cached detail) | < 50ms |
| Initial catalog load | < 2s on 3G throttled (stretch) |

Budget — team agreement; Profiler proves regression in CI manual QA.

---

## Virtualization reminder

If Profiler shows 200+ rows same cost — `@tanstack/react-virtual` ([20-virtualization.md](20-virtualization.md)). Pagination first; virtualization when UX demands long single page.

---

## Лаба (кратко)

1. Profile filter change on products table — screenshot ranked view.
2. Fix one measured issue (Context, memo, state split).
3. Re-profile — document before/after commit ms.
4. (Optional) WDYR on `ProductRow` — confirm stable props.

**Критерий:** written note in lab journal: problem → cause → fix → result.

---

## Типичные ошибки

1. **Memo everything without Profiler** — complexity + bugs.

2. **Optimize initial load when complaint is interaction** — wrong recording.

3. **Trust StrictMode double as regression** — false alarm.

4. **Ignore Query refetch** — network wait ≠ React slow.

5. **WDYR in production bundle** — guard DEV only.

6. **Virtualize before pagination** — premature.

---

## Чек-лист

- [ ] Profiler recording for reported slow path
- [ ] Identified top 1–3 components in commit
- [ ] Fix addresses root cause (state placement, stable refs)
- [ ] Re-measured improvement
- [ ] Query/network ruled out as sole cause
- [ ] WDYR dev-only if used

---

[← 36-production-build](36-production-build.md) · [38-interview-qa →](38-interview-qa.md)
