# 31. Лаба: CRUD product (полный цикл)

## Сценарий с работы

Сprint planning: «Нужен vertical slice — от списка до редактирования товара к Django API». Вы уже сделали auth ([13-lab-auth.md](13-lab-auth.md)), table ([29-admin-table.md](29-admin-table.md)), форму ([28-forms-rhf.md](28-forms-rhf.md)). Эта лаба **склеивает** Create, Read, Update, Delete в один coherent flow в [`examples/`](examples/package.json).

Backend: [`deploy/django`](../../deploy/django/README.md) `:8092` или MSW ([27-lab-msw.md](27-lab-msw.md)).

**Время:** ~60–90 минут.

---

## Цель лабы

Реализовать **полный CRUD** для products в admin SPA:

| Операция | Route | HTTP |
|----------|-------|------|
| List | `/products` | GET `/api/v1/products/` |
| Detail | `/products/:id` | GET `/api/v1/products/:id/` |
| Create | `/products/new` | POST `/api/v1/products/` |
| Update | `/products/:id/edit` | PATCH `/api/v1/products/:id/` |
| Delete | action on list/detail | DELETE `/api/v1/products/:id/` |

---

## Предварительные условия

```bash
cd courses/react-intermediate/examples
npm install
npm run dev   # :5174

# опционально — real API
cd deploy/django && docker compose up -d --build
curl http://localhost:8092/api/v1/products/
```

`.env`:

```env
VITE_API_URL=http://localhost:8092
VITE_USE_MSW=false
```

MSW-only: `VITE_USE_MSW=true` — handlers в [`examples/src/mocks/handlers.ts`](examples/src/mocks/handlers.ts).

---

## Шаг 1. API functions (~15 мин)

```tsx
// api/products.ts
import { api } from "./client";
import type { Paginated, Product } from "@/types/catalog";
import type { ProductFormValues } from "@/features/products/schemas/productFormSchema";

export function fetchProduct(id: number, signal?: AbortSignal) {
  return api<Product>(`/api/v1/products/${id}/`, { signal });
}

export function createProduct(body: ProductFormValues) {
  return api<Product>("/api/v1/products/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateProduct(id: number, body: Partial<ProductFormValues>) {
  return api<Product>(`/api/v1/products/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteProduct(id: number) {
  return api<void>(`/api/v1/products/${id}/`, { method: "DELETE" });
}
```

Query keys factory:

```tsx
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductTableParams) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};
```

---

## Шаг 2. Routes (~10 мин)

```tsx
// app/routes.tsx
<Route path="/products" element={<ProductsTablePage />} />
<Route path="/products/new" element={<ProductCreatePage />} />
<Route path="/products/:id" element={<ProductDetailPage />} />
<Route path="/products/:id/edit" element={<ProductEditPage />} />
```

Protected wrapper из [11-protected-routes.md](11-protected-routes.md).

---

## Шаг 3. Create page (~20 мин)

```tsx
export function ProductCreatePage() {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Товар создан");
      navigate(`/products/${product.id}`);
    },
  });

  return (
    <Page title="Новый товар">
      <ProductForm
        onSubmit={(values) => mutation.mutateAsync(values)}
      />
    </Page>
  );
}
```

Categories: `useQuery({ queryKey: ["categories"], queryFn: fetchCategories })` — populate select.

---

## Шаг 4. Detail + Edit (~20 мин)

**Detail:**

```tsx
export function ProductDetailPage() {
  const id = Number(useParams().id);
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }) => fetchProduct(id, signal),
    enabled: Number.isFinite(id),
  });

  if (!Number.isFinite(id)) return <Navigate to="/products" replace />;
  if (isPending) return <DetailSkeleton />;
  if (isError) return <ErrorPanel error={error} onRetry={refetch} />;

  return (
    <Page title={data.title}>
      <dl>...</dl>
      <Link to={`/products/${id}/edit`}>Редактировать</Link>
      <DeleteProductButton id={id} />
    </Page>
  );
}
```

**Edit:** reuse `ProductForm` с `initial={productToFormValues(data)}`; mutation `updateProduct`.

`productToFormValues` — map API `Product` → `ProductFormValues` (price string→number если нужно).

---

## Шаг 5. Delete (~15 мин)

```tsx
function DeleteProductButton({ id }: { id: number }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => deleteProduct(id),
    onMutate: async () => {
      /* optimistic из 30-optimistic-advanced.md — optional */
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.removeQueries({ queryKey: productKeys.detail(id) });
      toast.success("Товар удалён");
      navigate("/products");
    },
  });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Удалить
      </button>
      {open && (
        <ConfirmDialog
          title="Удалить товар?"
          onConfirm={() => mutation.mutate()}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
```

---

## Шаг 6. MSW handlers extension (~10 мин)

Добавьте в `handlers.ts`:

```tsx
http.get("/api/v1/products/:id/", ({ params }) => {
  const product = mockProducts.find((p) => p.id === Number(params.id));
  if (!product) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
  return HttpResponse.json(product);
}),

http.post("/api/v1/products/", async ({ request }) => {
  const body = await request.json();
  const created = { id: mockProducts.length + 1, ...body };
  mockProducts.push(created);
  return HttpResponse.json(created, { status: 201 });
}),

http.patch("/api/v1/products/:id/", async ({ params, request }) => {
  /* merge patch */
}),

http.delete("/api/v1/products/:id/", ({ params }) => {
  /* remove from mockProducts */
  return new HttpResponse(null, { status: 204 });
}),
```

---

## Критерии успеха (самопроверка)

- [ ] `/products` — table с pagination/filters ([29-admin-table.md](29-admin-table.md))
- [ ] `/products/new` — form validation Zod; POST success → detail
- [ ] Duplicate SKU → server error под полем `sku`
- [ ] `/products/:id/edit` — PATCH обновляет; list/detail показывают новые данные
- [ ] Delete с confirm; row исчезает; 404 на старом URL
- [ ] Loading / error / empty на list и detail
- [ ] Auth: unauthenticated → redirect login
- [ ] Работает с `:8092` **или** MSW (`VITE_USE_MSW=true`)

---

## Типичные ошибки

1. **PATCH отправляет read-only fields** (`category_name`, `created_at`) — DRF может игнорировать или 400.

2. **Price как string** `"129.99"` vs number — schema `z.coerce.number()`.

3. **Забыли invalidate list** после create/update — stale table.

4. **Edit form не reset** при смене `:id` — добавьте `key={id}` на form.

5. **DELETE без removeQueries detail** — ghost cache при revisit.

6. **Trailing slash** — Django часто требует `/api/v1/products/` с `/`; client должен быть consistent.

---

## Расширения

| Уровень | Задача |
|---------|--------|
| A | Optimistic toggle + delete ([30-optimistic-advanced.md](30-optimistic-advanced.md)) |
| B | Bulk deactivate selected rows |
| C | Vitest + MSW integration test create flow |
| D | Category CRUD (read-only API → extension POST на backend) |

---

## После лабы

Вы закрыли **vertical slice** admin domain. Дальше: prefetch ([32-prefetch-patterns.md](32-prefetch-patterns.md)), capstone ([39-capstone.md](39-capstone.md)).

---

[← 30-optimistic-advanced](30-optimistic-advanced.md) · [32-prefetch-patterns →](32-prefetch-patterns.md)
