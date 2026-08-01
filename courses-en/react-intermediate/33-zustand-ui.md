# 33. Zustand for UI state (overview)

## A story from work

The admin SPA has grown: sidebar collapsed, command palette open, table column visibility, "selected rows" for a bulk action, a draft filter panel — everything scattered across `useState` in the layout and prop-drilled through 4 levels. A Context for "UI chrome" bloats and triggers a re-render of the whole tree on a sidebar toggle.

The tech lead: "Server state stays in Query. Client UI state that doesn't belong to one component — move it into a Zustand store. Keep Context for auth/theme."

## What you'll learn

- Server state (Query) vs UI state (Zustand) vs domain client state (Context)
- A minimal store: create, selectors, actions
- Persist (localStorage) for preferences
- Integration with React without Provider hell
- When Zustand is **not** needed

---

## The three buckets of state in an admin SPA

| Bucket | Examples | Tool |
|---------|---------|------------|
| **Server state** | products, categories, user profile from the API | TanStack Query |
| **Session / auth** | tokens, user, login | AuthProvider ([10-auth-context.md](10-auth-context.md)) |
| **Ephemeral UI** | sidebar, modals, selection, toasts | Zustand (or local useState) |
| **Cross-route UI prefs** | column visibility, density | Zustand + persist |

**Don't put** the products list in Zustand — a duplicate source of truth, stale data, no dedupe.

---

## A minimal UI store

```tsx
// stores/uiStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    }),
    {
      name: "admin-ui",
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
);
```

`partialize` — persist only the sidebar, not transient modals.

---

## Selectors — avoiding extra re-renders

```tsx
// Bad — subscribing to the whole store
const state = useUiStore();

// Good — a selector
const collapsed = useUiStore((s) => s.sidebarCollapsed);
const toggleSidebar = useUiStore((s) => s.toggleSidebar);
```

Zustand compares the selected slice with `Object.is` — the component re-renders only when `sidebarCollapsed` changes.

Shallow compare for multiple fields:

```tsx
import { useShallow } from "zustand/react/shallow";

const { collapsed, toggle } = useUiStore(
  useShallow((s) => ({
    collapsed: s.sidebarCollapsed,
    toggle: s.toggleSidebar,
  })),
);
```

---

## Table selection store

Bulk actions from [29-admin-table.md](29-admin-table.md):

```tsx
type SelectionState = {
  selectedIds: Set<number>;
  toggle: (id: number) => void;
  toggleAll: (ids: number[]) => void;
  clear: () => void;
};

export const useProductSelection = create<SelectionState>((set, get) => ({
  selectedIds: new Set(),
  toggle: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { selectedIds: next };
    }),
  toggleAll: (ids) => {
    const { selectedIds } = get();
    const allSelected = ids.every((id) => selectedIds.has(id));
    set({
      selectedIds: allSelected ? new Set() : new Set(ids),
    });
  },
  clear: () => set({ selectedIds: new Set() }),
}));
```

**Clear the selection** on a page/filter change — a `useEffect` in the table page:

```tsx
useEffect(() => {
  useProductSelection.getState().clear();
}, [params.page, params.category, params.q]);
```

---

## Zustand vs Context for UI

| | Context | Zustand |
|---|---------|---------|
| Boilerplate | Provider, memoized value | create store |
| Re-render | all consumers on a new value | fine-grained selectors |
| DevTools | React DevTools | zustand devtools middleware |
| SSR | needs care | needs care |
| Testing | wrap in Provider | reset the store between tests |

Auth **can** live in Zustand — but the course uses AuthProvider to make the JWT flow explicit; UI prefs — Zustand's sweet spot.

---

## Devtools middleware (optional)

```tsx
import { devtools } from "zustand/middleware";

export const useUiStore = create<UiState>()(
  devtools(
    persist(/* ... */),
    { name: "UiStore" },
  ),
);
```

Redux DevTools extension — time-travel debug of UI toggles.

---

## Testing reset

```tsx
// test/setup.ts
afterEach(() => {
  useUiStore.setState({
    sidebarCollapsed: false,
    commandPaletteOpen: false,
  });
  useProductSelection.setState({ selectedIds: new Set() });
});
```

Avoid test pollution between cases.

---

## When NOT to use Zustand

1. **A single component** — `useState` is enough.
2. **Server data** — Query.
3. **Form fields** — react-hook-form ([28-forms-rhf.md](28-forms-rhf.md)).
4. **URL-shareable filters** — `useSearchParams` ([29-admin-table.md](29-admin-table.md)).
5. **"Because Redux is outdated"** — don't add a store without a reason.

---

## Lab (short version)

1. `useUiStore`: sidebar collapse + persist.
2. `useProductSelection`: checkbox column + "Clear selection" on filter change.
3. The header reads `sidebarCollapsed` without props drilling.

**Success criterion:** collapse the sidebar → refresh → the state is preserved; the selection doesn't leak between pages.

---

## Common mistakes

1. **Products in Zustand** — desync with the API.

2. **Subscribe to the entire store** — a perf regression like a fat Context.

3. **Mutate a Set/Map in place** — Zustand doesn't see the change; always a new Set.

4. **Persist sensitive data** — tokens in localStorage ([09-token-storage.md](09-token-storage.md) — be careful).

5. **Two stores for one UI concern** — consolidate.

---

## Checklist

- [ ] Server state only in Query
- [ ] UI/ephemeral state in Zustand with selectors
- [ ] Persist only user preferences
- [ ] Selection cleared on navigation/filter change
- [ ] Store reset in tests

---

[← 32-prefetch-patterns](32-prefetch-patterns.md) · [34-accessibility →](34-accessibility.md)
