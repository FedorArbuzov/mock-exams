# 25. Лаба: каталог / товар / 404

## Сценарий

Ticket **SHOP-310**: «Маршруты shop — список, карточка по id, 404 для мусора в URL». Данные с `:8090` через Query ([22-lab-query.md](22-lab-query.md)), навигация — React Router ([23-react-router.md](23-react-router.md), [24-nested-routes.md](24-nested-routes.md)).

**Время:** ~60–75 минут.

---

## Подготовка

```bash
cd deploy/fastapi && docker compose up -d --build
cd courses/react-basic/examples && npm install && npm run dev
```

`BrowserRouter` + `QueryClientProvider` в `main.tsx`.

Структура:

```text
src/
  components/
    ShopLayout.tsx
  pages/
    CatalogPage.tsx
    ItemDetailPage.tsx
    NotFoundPage.tsx
  App.tsx
```

---

## Задание 1. `ShopLayout`

- Header: logo Link `/`, nav Link `/` и `/about` (About — заглушка `<p>О shop</p>`);
- `<Outlet />` в `<main>`;
- footer одной строкой.

---

## Задание 2. `CatalogPage`

- `useItems()` из [22-lab-query.md](22-lab-query.md) или inline `useQuery`;
- loading / error / empty / list;
- каждый товар — **`Link to={`/items/${item.id}`}`** с name и price.

---

## Задание 3. `ItemDetailPage`

- `useParams<{ itemId: string }>()`;
- parse `Number(itemId)`, invalid → «Неверный id»;
- `useQuery` key `["items", id]`, fn `GET /api/v1/items/${id}`, `enabled` при valid id;
- Link «← Каталог» на `/`;
- UI loading/error/not found.

---

## Задание 4. `NotFoundPage`

```tsx
export function NotFoundPage() {
  return (
    <main>
      <h1>404</h1>
      <p>Страница не найдена.</p>
      <Link to="/">На главную</Link>
    </main>
  );
}
```

---

## Задание 5. `App.tsx` routes

```tsx
<Routes>
  <Route element={<ShopLayout />}>
    <Route index element={<CatalogPage />} />
    <Route path="items/:itemId" element={<ItemDetailPage />} />
    <Route path="about" element={<p>О shop — mock-exams</p>} />
  </Route>
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

404 **без** shop header — глобальный catch-all снаружи layout (осознанный UX).

---

## Проверка

| URL | Ожидание |
|-----|----------|
| `/` | список с API |
| `/items/1` | detail Demo item |
| `/items/999999` | error от API (404) |
| `/items/abc` | «Неверный id» без лишнего fetch |
| `/nope` | NotFoundPage без header |
| Клик Link туда-обратно | без full reload, Query cache |

Refresh на `/items/1` — страница грузится (Vite dev OK).

Откройте React Query Devtools — при visit detail второй раз возможен cache hit для `["items", 1]`.

---

## Задание 6. (Опционально) `NavLink` active

Подсветка «Каталог» на `/` и `/items/:id` — `end` prop или custom `isActive`.

---

## Критерии успеха

- [ ] Layout + Outlet, без дубли header
- [ ] Index = catalog
- [ ] Detail по params + Query
- [ ] Global 404
- [ ] Links, не `<a href>`
- [ ] typecheck OK

---

## Типичные ошибки в лабе

1. **Outlet forgotten** — blank main.

2. **`<a href="/items/1">`** — full reload.

3. **Detail id из state** — broken deep link.

4. **404 inside layout only** — `/nope` показывает catalog routes wrong; нужен outer `*`.

5. **Same queryKey list/detail** — stale wrong shape.

---

## Связь с курсом

- Router basics: [23-react-router.md](23-react-router.md)
- Nested: [24-nested-routes.md](24-nested-routes.md)
- URL filters next: [26-url-state.md](26-url-state.md)
- API: [deploy/fastapi](../../deploy/fastapi/README.md)

---

## Резюме лабы

Shop SPA получает навигацию уровня production: layout, catalog index, item detail с `:8090`, изолированная 404. URL shareable; Query кэширует между экранами.

---

## Чек-лист перед сдачей

- Где объявлен `:itemId`?
- Что видит пользователь на `/items/999999`?
- Почему 404 route снаружи ShopLayout?
- Работает ли back button после Link?

Следующий урок: [26. URL как state: search params](26-url-state.md).
