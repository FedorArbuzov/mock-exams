# 37. Profiler, why-did-you-render, and metrics

## A story from work

Ticket: "The admin table lags at 50 rows — not 800, pagination is already in place." The PM won't accept "let's add memo everywhere." You open the React DevTools Profiler and record the interaction "toggle filter category" — a 180ms commit, `ProductsTablePage` + 50× `ProductRow` + `Header` + `FilterBar` re-render. Root cause: the `AuthProvider` Context value is a new object each render? An unstable callback in the filter? **Measure first**, fix second ([18-rerender-model.md](18-rerender-model.md), [19-memo-patterns.md](19-memo-patterns.md)).

## What you'll learn

- React DevTools Profiler: flamegraph, ranked, "why did this render?"
- Interaction tracing vs mount profiling
- `@welldone-software/why-did-you-render` — dev-only noise control
- Web Vitals in a SPA (limitations)
- A performance budget for admin UI

---

## React DevTools Profiler

1. Install the React DevTools extension.
2. The **Profiler** tab → Record (⚫).
3. Perform an action: change a filter, open a modal, toggle the sidebar.
4. Stop → analyze the commits.

| View | What to look at |
|------|--------------|
| Flamegraph | duration per component tree |
| Ranked | top offenders by self/total time |
| Component chart | a specific component over commits |

**React 19+** — "Why did this render?" highlights: props changed, state changed, context changed, parent re-rendered.

---

## Interpretation workflow

```text
1. Reproduce the slow interaction
2. Record the Profiler
3. Find the longest commit bar
4. Expand the tree — who participated?
5. Check "why render" on unexpected nodes
6. Fix the root cause (not the symptom)
7. Re-record — compare duration
```

Example findings in an admin SPA:

| Symptom | Common cause | Fix |
|---------|--------------|-----|
| All rows re-render on a header toggle | State in a parent above the table | Split state / composition |
| Row re-render on an unrelated filter | Unstable inline props | useCallback + memo row |
| Everything re-renders | Context value `{}` new ref | memo the value, split the context |
| 50 rows slow without memo | Heavy cell render | simplify the cell / virtualization ([20-virtualization.md](20-virtualization.md)) |

---

## Interaction vs mount

| Scenario | Record when |
|----------|-------------|
| Initial load | Mount Profiler |
| Filter change | Interaction |
| Route navigation | Interaction |
| Optimistic toggle | Interaction |

StrictMode **double invokes** in dev — compare relative before/after, not absolute ms to prod.

---

## why-did-you-render (WDYR)

A dev-only library that logs unexpected re-renders:

```tsx
// wdyr.ts — import first in main.tsx, DEV only
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

**Noise:** enable it per component, not global `trackAll`. Remove or disable it before perf benchmarks.

---

## memo / useCallback — after measuring

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

Memo is useless if `onDelete` is a new reference on every parent render.

---

## TanStack Query Devtools

Query devtools show:

- active queries, stale/fresh
- refetch triggers (focus, invalidate)
- unnecessary refetches mistaken for "slow React"

Network tab + Query devtools + Profiler — **triangulate**.

---

## Web Vitals in a SPA

| Metric | Admin SPA relevance |
|--------|---------------------|
| LCP | login page, first catalog paint |
| INP | filter interaction, button click |
| CLS | skeleton → content shift in the table |

```tsx
// optional web-vitals
import { onINP, onLCP } from "web-vitals";

onINP(console.log);
```

SPA without SSR: LCP is often later than an MPA — focus on **INP** for internal tools.

Send to analytics (Plausible, Datadog RUM) — optional capstone extension.

---

## Performance budget (internal admin)

Suggested targets (dev laptop, 50 rows):

| Interaction | Budget |
|-------------|--------|
| Filter change → paint | < 100ms perceived |
| Route change (cached detail) | < 50ms |
| Initial catalog load | < 2s on 3G throttled (stretch) |

The budget is a team agreement; the Profiler proves a regression in manual CI QA.

---

## Virtualization reminder

If the Profiler shows 200+ rows at the same cost — `@tanstack/react-virtual` ([20-virtualization.md](20-virtualization.md)). Pagination first; virtualization when the UX demands a long single page.

---

## Lab (short version)

1. Profile a filter change on the products table — screenshot the ranked view.
2. Fix one measured issue (Context, memo, state split).
3. Re-profile — document the before/after commit ms.
4. (Optional) WDYR on `ProductRow` — confirm stable props.

**Success criterion:** a written note in the lab journal: problem → cause → fix → result.

---

## Common mistakes

1. **Memo everything without the Profiler** — complexity + bugs.

2. **Optimize the initial load when the complaint is interaction** — wrong recording.

3. **Trust StrictMode's double as a regression** — false alarm.

4. **Ignore Query refetch** — a network wait ≠ slow React.

5. **WDYR in the production bundle** — guard DEV only.

6. **Virtualize before pagination** — premature.

---

## Checklist

- [ ] Profiler recording for the reported slow path
- [ ] Identified the top 1–3 components in the commit
- [ ] The fix addresses the root cause (state placement, stable refs)
- [ ] Re-measured the improvement
- [ ] Query/network ruled out as the sole cause
- [ ] WDYR dev-only if used

---

[← 36-production-build](36-production-build.md) · [38-interview-qa →](38-interview-qa.md)
