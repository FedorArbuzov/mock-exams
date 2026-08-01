# 31. Lab: product CRUD (full cycle)

## A story from work

Sprint planning: "We need a vertical slice — from the list to editing a product against the Django API." You've already done auth ([13-lab-auth.md](13-lab-auth.md)), the table ([29-admin-table.md](29-admin-table.md)), and the form ([28-forms-rhf.md](28-forms-rhf.md)). This lab **glues together** Create, Read, Update, Delete into one coherent flow in [`examples/`](examples/package.json).

Backend: [`deploy/django`](../../deploy/django/README.md) `:8092` or MSW ([27-lab-msw.md](27-lab-msw.md)).

**Time:** ~60–90 minutes.

---

## Lab goal

Implement **full CRUD** for products in the admin SPA:

| Operation | Route | HTTP |
|----------|-------|------|
| List | `/products` | GET `/api/v1/products/` |
| Detail | `/products/:id` | GET `/api/v1/products/:id/` |
| Create | `/products/new` | POST `/api/v1/products/` |
| Update | `/products/:id/edit` | PATCH `/api/v1/products/:id/` |
| Delete | action on list/detail | DELETE `/api/v1/products/:id/` |

---

## Prerequisites

```bash
cd courses/react-intermediate/examples
npm install
npm run dev   # :5174

# optional — real API
cd deploy/django && docker compose up -d --build
curl http://localhost:8092/api/v1/products/
```

`.env`:

```env
VITE_API_URL=http://localhost:8092
VITE_USE_MSW=false
```

MSW-only: `VITE_USE_MSW=true` — handlers in [`examples/src/mocks/handlers.ts`](examples/src/mocks/handlers.ts).

---

## Step 1. API functions (~15 min)

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

## Step 2. Routes (~10 min)

```tsx
// app/routes.tsx
<Route path="/products" element={<ProductsTablePage />} />
<Route path="/products/new" element={<ProductCreatePage />} />
<Route path="/products/:id" element={<ProductDetailPage />} />
<Route path="/products/:id/edit" element={<ProductEditPage />} />
```

Protected wrapper from [11-protected-routes.md](11-protected-routes.md).

---

## Step 3. Create page (~20 min)

```tsx
export function ProductCreatePage() {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Product created");
      navigate(`/products/${product.id}`);
    },
  });

  return (
    <Page title="New product">
      <ProductForm
        onSubmit={(values) => mutation.mutateAsync(values)}
      />
    </Page>
  );
}
```

Categories: `useQuery({ queryKey: ["categories"], queryFn: fetchCategories })` — populate the select.

---

## Step 4. Detail + Edit (~20 min)

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
      <Link to={`/products/${id}/edit`}>Edit</Link>
      <DeleteProductButton id={id} />
    </Page>
  );
}
```

**Edit:** reuse `ProductForm` with `initial={productToFormValues(data)}`; mutation `updateProduct`.

`productToFormValues` — map API `Product` → `ProductFormValues` (price string→number if needed).

---

## Step 5. Delete (~15 min)

```tsx
function DeleteProductButton({ id }: { id: number }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => deleteProduct(id),
    onMutate: async () => {
      /* optimistic from 30-optimistic-advanced.md — optional */
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.removeQueries({ queryKey: productKeys.detail(id) });
      toast.success("Product deleted");
      navigate("/products");
    },
  });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Delete
      </button>
      {open && (
        <ConfirmDialog
          title="Delete product?"
          onConfirm={() => mutation.mutate()}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
```

---

## Step 6. MSW handlers extension (~10 min)

Add to `handlers.ts`:

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

## Success criteria (self-check)

- [ ] `/products` — table with pagination/filters ([29-admin-table.md](29-admin-table.md))
- [ ] `/products/new` — form Zod validation; POST success → detail
- [ ] Duplicate SKU → server error under the `sku` field
- [ ] `/products/:id/edit` — PATCH updates; list/detail show the new data
- [ ] Delete with confirm; row disappears; 404 on the old URL
- [ ] Loading / error / empty on list and detail
- [ ] Auth: unauthenticated → redirect to login
- [ ] Works with `:8092` **or** MSW (`VITE_USE_MSW=true`)

---

## Common mistakes

1. **PATCH sends read-only fields** (`category_name`, `created_at`) — DRF may ignore them or return 400.

2. **Price as a string** `"129.99"` vs number — schema `z.coerce.number()`.

3. **Forgot to invalidate the list** after create/update — stale table.

4. **Edit form doesn't reset** when `:id` changes — add `key={id}` on the form.

5. **DELETE without removeQueries detail** — a ghost cache on revisit.

6. **Trailing slash** — Django often requires `/api/v1/products/` with a `/`; the client must be consistent.

---

## Extensions

| Level | Task |
|---------|--------|
| A | Optimistic toggle + delete ([30-optimistic-advanced.md](30-optimistic-advanced.md)) |
| B | Bulk deactivate selected rows |
| C | Vitest + MSW integration test of the create flow |
| D | Category CRUD (read-only API → extend with POST on the backend) |

---

## After the lab

You've closed a **vertical slice** of the admin domain. Next: prefetch ([32-prefetch-patterns.md](32-prefetch-patterns.md)), capstone ([39-capstone.md](39-capstone.md)).

---

[← 30-optimistic-advanced](30-optimistic-advanced.md) · [32-prefetch-patterns →](32-prefetch-patterns.md)
