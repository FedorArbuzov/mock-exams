# 23. React Router: маршруты и навигация

## Сценарий с работы

Shop SPA вырос: нужны отдельные URL — `/` каталог, `/about`, клик по товару без `window.location` (полная перезагрузка убивает state и кэш Query). Junior ставит `<a href="/items/5">` — Vite отдаёт 404 на refresh. Нужен **клиентский роутер**: URL меняется, React монтирует другой компонент, **History API** без round-trip HTML.

В курсе — **React Router v7** (`react-router-dom` в [`examples/package.json`](examples/package.json)).

## Что вы узнаете

- `BrowserRouter`, `Routes`, `Route`
- `Link` vs `<a>`
- `useNavigate` для programmatic navigation
- Базовая структура shop routes
- Связь с Query и FastAPI detail endpoint

---

## Установка (уже в examples)

```bash
npm install react-router-dom
```

---

## Минимальное приложение

```tsx
// main.tsx
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
```

```tsx
// App.tsx
import { Routes, Route } from "react-router-dom";
import { CatalogPage } from "@/pages/CatalogPage";
import { AboutPage } from "@/pages/AboutPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
```

`path="*"` — **catch-all** 404 ([25-lab-router.md](25-lab-router.md)).

---

## `Link` — декларативная навигация

```tsx
import { Link } from "react-router-dom";

<nav>
  <Link to="/">Каталог</Link>
  <Link to="/about">О shop</Link>
</nav>
```

| | `<Link to>` | `<a href>` |
|---|-------------|------------|
| Перезагрузка | нет | да (full navigation) |
| SPA state | сохраняется | теряется |
| Active styling | `NavLink` | вручную |

```tsx
import { NavLink } from "react-router-dom";

<NavLink
  to="/"
  className={({ isActive }) => (isActive ? "active" : undefined)}
>
  Каталог
</NavLink>
```

---

## `useNavigate` — императивно

После успешного POST — перейти на карточку товара:

```tsx
import { useNavigate } from "react-router-dom";

function CreateItemForm() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: createItem,
    onSuccess: (item) => {
      navigate(`/items/${item.id}`);
    },
  });
}
```

Replace history (без «Назад» в checkout):

```tsx
navigate("/cart", { replace: true });
```

Navigate(-1) — как browser back.

---

## Параметры пути (preview)

```tsx
<Route path="/items/:itemId" element={<ItemDetailPage />} />
```

```tsx
import { useParams } from "react-router-dom";

function ItemDetailPage() {
  const { itemId } = useParams();
  const id = Number(itemId);
  // useQuery(['items', id], ...) — см. 24-nested-routes.md
}
```

Detail fetch: `GET /api/v1/items/{id}` на `:8090`.

---

## Vite и refresh на deep link

Dev server должен отдавать `index.html` для unknown paths — Vite так делает по умолчанию. В production nginx:

```nginx
try_files $uri /index.html;
```

Иначе refresh `/items/5` → 404 от static server, не от React.

---

## Композиция с Query

Router **не** загружает данные — только выбирает экран. Каждая page вызывает свои hooks:

```text
/catalog     → useItems()
/items/:id   → useQuery(['items', id])
```

Кэш Query переживает navigation между страницами shop.

---

## Структура папок (рекомендация)

```text
src/
  pages/
    CatalogPage.tsx
    ItemDetailPage.tsx
    NotFoundPage.tsx
  components/
  App.tsx
```

Соглашения — [35-project-structure.md](35-project-structure.md).

---

## Типичные ошибки

1. **`<a href="/">` в SPA** — full reload, сброс Query dev cache.

2. **Router вне BrowserRouter** — «useRoutes() may be used only in context».

3. **Дубли Router** — два `BrowserRouter` ломают history.

4. **Забыли catch-all `*`** — неизвестные URL — пустой экран.

5. **navigate в render** — бесконечный loop; только effects/handlers.

6. **itemId string без Number** — `useQuery` с `"5"` vs 5 — разные keys.

---

## Резюме

React Router сопоставляет **URL → component tree**. `BrowserRouter` + `Routes`/`Route` определяют таблицу. `Link`/`NavLink` — навигация без reload. `useNavigate` — после форм и mutations. Catch-all для 404. Deep links требуют fallback на `index.html`. Данные по-прежнему с FastAPI через Query.

---

## Чек-лист

- Чем Link отличается от anchor?
- Где объявить route `/items/:itemId`?
- Как перейти на страницу после POST?
- Что рендерит `path="*"`?
- Почему refresh `/items/1` ломается без server fallback?
- Кто загружает JSON — Router или useQuery?

Следующий урок: [24. Nested routes и layout](24-nested-routes.md).
