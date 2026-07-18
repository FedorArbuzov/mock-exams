# 33. Zustand для UI state (обзор)

## Сценарий с работы

Admin SPA разросся: sidebar collapsed, command palette open, table column visibility, «selected rows» для bulk action, draft filter panel — всё разъехалось по `useState` в layout и prop drilling через 4 уровня. Context для «UI chrome» раздувается и триggerит re-render всего дерева при toggle sidebar.

Tech lead: «Server state остаётся в Query. Client UI state, который не belongs to one component — вынесите в Zustand store. Context оставьте для auth/theme».

## Что вы узнаете

- Server state (Query) vs UI state (Zustand) vs domain client state (Context)
- Минимальный store: create, selectors, actions
- Persist (localStorage) для preferences
- Интеграция с React без Provider hell
- Когда Zustand **не** нужен

---

## Три корзины state в admin SPA

| Корзина | Примеры | Инструмент |
|---------|---------|------------|
| **Server state** | products, categories, user profile from API | TanStack Query |
| **Session / auth** | tokens, user, login | AuthProvider ([10-auth-context.md](10-auth-context.md)) |
| **Ephemeral UI** | sidebar, modals, selection, toasts | Zustand (или local useState) |
| **Cross-route UI prefs** | column visibility, density | Zustand + persist |

**Не кладите** products list в Zustand — duplicate source of truth, stale data, no dedupe.

---

## Минимальный UI store

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

`partialize` — persist только sidebar, не transient modals.

---

## Selectors — избегаем лишних re-render

```tsx
// Плохо — подписка на весь store
const state = useUiStore();

// Хорошо — selector
const collapsed = useUiStore((s) => s.sidebarCollapsed);
const toggleSidebar = useUiStore((s) => s.toggleSidebar);
```

Zustand сравнивает selected slice через `Object.is` — component re-render только когда `sidebarCollapsed` меняется.

Shallow compare для multiple fields:

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

Bulk actions из [29-admin-table.md](29-admin-table.md):

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

**Clear selection** при смене page/filter — `useEffect` в table page:

```tsx
useEffect(() => {
  useProductSelection.getState().clear();
}, [params.page, params.category, params.q]);
```

---

## Zustand vs Context для UI

| | Context | Zustand |
|---|---------|---------|
| Boilerplate | Provider, memo value | create store |
| Re-render | все consumers при new value | fine-grained selectors |
| DevTools | React DevTools | zustand devtools middleware |
| SSR | нужен care | нужен care |
| Testing | wrap Provider | reset store between tests |

Auth **можно** в Zustand — но курс использует AuthProvider для явности JWT flow; UI prefs — Zustand sweet spot.

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

Redux DevTools extension — time-travel debug UI toggles.

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

Избегайте test pollution между cases.

---

## Когда НЕ использовать Zustand

1. **Один компонент** — `useState` достаточно.
2. **Server data** — Query.
3. **Form fields** — react-hook-form ([28-forms-rhf.md](28-forms-rhf.md)).
4. **URL-shareable filters** — `useSearchParams` ([29-admin-table.md](29-admin-table.md)).
5. **«Потому что Redux устарел»** — не добавляйте store без причины.

---

## Лаба (кратко)

1. `useUiStore`: sidebar collapse + persist.
2. `useProductSelection`: checkbox column + «Clear selection» on filter change.
3. Header читает `sidebarCollapsed` без props drilling.

**Критерий:** collapse sidebar → refresh → state сохранён; selection не leaks между pages.

---

## Типичные ошибки

1. **Products в Zustand** — рассинхрон с API.

2. **Subscribe to entire store** — perf regression как у fat Context.

3. **Mutate Set/Map in place** — Zustand не видит change; always new Set.

4. **Persist sensitive data** — tokens в localStorage ([09-token-storage.md](09-token-storage.md) — осторожно).

5. **Два store для одного UI concern** — consolidate.

---

## Чек-лист

- [ ] Server state только в Query
- [ ] UI/ephemeral state в Zustand с selectors
- [ ] Persist только user preferences
- [ ] Selection cleared on navigation/filter change
- [ ] Store reset в tests

---

[← 32-prefetch-patterns](32-prefetch-patterns.md) · [34-accessibility →](34-accessibility.md)
