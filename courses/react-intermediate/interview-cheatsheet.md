# React Intermediate — Interview Cheatsheet

Проверьте себя **без подглядывания** в главы, затем сверьтесь с [38-interview-qa.md](38-interview-qa.md).

---

## Быстрые ответы

### Архитектура

| Вопрос | Ответ |
|--------|-------|
| Server state | TanStack Query — products, categories |
| Client session | AuthProvider — tokens, user |
| UI ephemeral | Zustand или local — sidebar, selection |
| URL state | page, search, sort, filters — shareable |
| API layer | `api/client.ts` — transport, не cache |

### Django DRF :8092

| Endpoint | Назначение |
|----------|------------|
| `GET /api/v1/products/` | paginated list + filters |
| `POST/PATCH/DELETE .../products/` | CRUD |
| `GET /api/v1/categories/` | read-only categories |
| `POST /api/v1/auth/login/` | JWT pair |
| Trailing slash | `/products/` — consistent |

Query params: `page`, `search`, `ordering`, `category`, `is_active`, `min_price`, `max_price`.

---

## JWT и auth

| Тема | Суть |
|------|------|
| Access token | короткий, Authorization header |
| Refresh token | только для новой пары |
| Storage trade-off | memory / localStorage / httpOnly cookie |
| Protected route | `Navigate` to login + returnUrl |
| 401 flow | refresh queue → retry → logout |
| Logout | clear token + `queryClient.clear()` |
| XSS + JWT | fix XSS first; token readable if in JS |

```tsx
// safe return URL after login
const safe = from?.startsWith("/") && !from.startsWith("//") ? from : "/products";
```

---

## Error boundaries

| Ловит | Не ловит |
|-------|----------|
| render throw в children | event handler errors |
| lifecycle errors (class EB) | async useEffect |
| | Query fetch errors → `isError` |

| Уровень | Где |
|---------|-----|
| Root | last resort + reload |
| Route | isolate `/products` crash |
| Query | inline ErrorPanel + retry |

Reset: `key={location.pathname}` on boundary.

---

## TanStack Query advanced

| API / pattern | Когда |
|---------------|-------|
| `queryKey` + params | cache per filter/page |
| `keepPreviousData` | no flash on page change |
| `prefetchQuery` | hover/focus detail link |
| `staleTime` | reduce refetch admin reads |
| `invalidateQueries` | after mutation |
| `onMutate` + rollback | optimistic UI |
| `enabled: isAuth` | wait for login |

```tsx
queryClient.prefetchQuery({
  queryKey: productKeys.detail(id),
  queryFn: () => fetchProduct(id),
  staleTime: 60_000,
});
```

---

## MSW

| Тема | Суть |
|------|------|
| Зачем | offline dev, CI, error scenarios |
| Toggle | `VITE_USE_MSW=true` |
| Handlers | mirror DRF URLs + trailing slash |
| `delay()` | test loading states |
| Prod | MSW OFF always |
| + Query | same fetch path — transparent |

Demo login (handlers): `admin@shop.local` / `admin`.

---

## Forms (RHF + Zod)

| API | Назначение |
|-----|------------|
| `useForm` + `zodResolver` | schema = types + validation |
| `register` | native inputs |
| `Controller` | custom widgets |
| `handleSubmit` | preventDefault + validate |
| `setError` | DRF 400 field errors |
| `z.coerce.number()` | input type number |

Client validates UX; server authoritative (unique SKU).

---

## Admin table

| UI | Wire |
|----|------|
| `?q=` URL | `search` param |
| `?ordering=-price` | DRF ordering |
| `?category=slug` | category filter |
| filter change | reset `page=1` |
| sort header | `aria-sort` + toggle `-` |
| pagination | from `count` |

Selection (bulk) — Zustand Set, clear on filter change.

---

## Optimistic UI

```text
onMutate  → cancelQueries → snapshot → setQueryData
onError   → restore snapshot → toast
onSettled → invalidateQueries
```

Update list **and** detail cache. Not for payments.

---

## Performance

| Действие | Порядок |
|----------|---------|
| 1 | Profiler record interaction |
| 2 | fix state placement, Context value |
| 3 | memo / useCallback if measured |
| 4 | virtualization if 200+ rows same page |

| Tool | Для чего |
|------|----------|
| React Profiler | commit duration, why render |
| Query Devtools | spurious refetch |
| WDYR | dev-only unexpected re-renders |

Code split: `lazy` route pages; preload on hover.

---

## Suspense

| | Classic Query | useSuspenseQuery |
|---|---------------|------------------|
| Loading | `isPending` branch | `<Suspense fallback>` |
| Error | `isError` | ErrorBoundary / errorElement |
| + prefetch | optional spinner skip | detail instant |

---

## Zustand

| Да | Нет |
|----|-----|
| sidebar, selection, UI prefs | products list |
| selectors `useStore(s => s.x)` | whole store subscribe |
| persist preferences | tokens (осторожно) |

---

## Accessibility

| Element | Pattern |
|---------|---------|
| form | `<label htmlFor>` + `aria-invalid` |
| errors | `role="alert"` + `aria-describedby` |
| table | `<th scope="col">`, caption |
| sort | button in th + `aria-sort` |
| modal | `role="dialog"`, focus trap, Escape |
| route change | focus `#main-content` |

---

## Security (client)

| Risk | Mitigation |
|------|------------|
| XSS | no raw HTML; escape JSX; CSP |
| Secrets in VITE | never — public in bundle |
| `dangerouslySetInnerHTML` | DOMPurify or avoid |
| Open redirect | validate `returnUrl` |
| Role hide button | server 403 still required |

---

## Production build

| Step | Check |
|------|-------|
| `npm run build` | zero errors |
| `VITE_API_URL` | staging/prod URL |
| vite `base` + Router `basename` | subdirectory deploy |
| nginx | `try_files → index.html` |
| assets | long cache; index.html short |
| MSW | disabled in prod |

---

## Prefetch

| Do | Don't |
|----|-------|
| hover/focus detail link | prefetch all rows on mount |
| prefetch page±1 | different queryFn than useQuery |
| shared queryKey | |

---

## UI states

```text
loading → skeleton (first load)
isFetching → subtle indicator (keepPreviousData)
error   → message + retry
empty   ≠ error (200, results: [])
success → table/content
```

---

## Мини-сниппеты

```tsx
// protected route
if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

// paginated query
const { data, isPending, isError, refetch, isFetching } = useQuery({
  queryKey: productKeys.list(params),
  queryFn: ({ signal }) => fetchProducts(params, signal),
  placeholderData: keepPreviousData,
});

// mutation invalidate
onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.lists() })

// RHF + Zod
useForm({ resolver: zodResolver(productFormSchema), defaultValues });

// error boundary wrapper
<RouteErrorBoundary key={location.pathname}><Outlet /></RouteErrorBoundary>
```

---

## mock-exams stack (intermediate)

| Слой | Порт / tech |
|------|-------------|
| Vite Admin SPA | :5174 |
| Django DRF API | :8092 products/categories |
| TanStack Query | server state + mutations |
| RHF + Zod | CRUD forms |
| MSW | optional mock API |
| Zustand | UI prefs / selection |
| Error boundaries | route + root |

---

## Частые ловушки

1. Products in Context/Zustand — stale vs Query
2. Paginated list + client filter — wrong rows
3. queryKey без params — cache collision
4. Error boundary для fetch — use ErrorPanel
5. 401 без refresh queue — thundering refresh
6. Trailing slash POST — 301 lost body
7. `VITE_` secret — leaked forever
8. Memo without Profiler — wasted complexity
9. MSW prod enabled — fake data in prod
10. Provider under Routes — state lost on nav
11. Filter change без page reset — empty table «bug»
12. Optimistic без snapshot — no rollback

---

## Capstone checklist (кратко)

- [ ] Auth login/logout/refresh
- [ ] Products table URL + server pagination
- [ ] CRUD + Zod + server errors
- [ ] Error boundaries 2 levels
- [ ] MSW **or** :8092
- [ ] `npm run build`
- [ ] README + a11y smoke

Полные критерии: [39-capstone.md](39-capstone.md).

---

## Что учить дальше

| Тема | Курс |
|------|------|
| Vitest, Playwright | javascript-testing |
| App Router SSR | nextjs-basic |
| REST design | api-design |
| Django backend | django |
| Capstone admin SPA | [39-capstone.md](39-capstone.md) |

---

[← README](README.md) · [38-interview-qa](38-interview-qa.md) · [39-capstone](39-capstone.md)
