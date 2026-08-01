# 28. Forms: react-hook-form + Zod resolver

## A story from work

A product manager opens a ticket: "The create-product form in the admin SPA is 400 lines of controlled inputs, and every keystroke re-renders half the page." You look at the code: ten `useState`, validation smeared across `onChange` and `onSubmit`, field types duplicated in TypeScript and in hand-written `if`s. Code review: "We're moving to react-hook-form + Zod — one schema, uncontrolled by default, fewer re-renders."

In the mock-exams admin SPA, the CRUD product/category forms are the central UX. Django DRF on `:8092` returns field-level errors (`{ "sku": ["already exists"] }`); the client must show those **and** local validation before submitting.

## What you'll learn

- Why RHF instead of "bare" controlled state in admin forms
- `@hookform/resolvers/zod` — a single source of truth for types and rules
- `register`, `Controller`, `handleSubmit`, `formState.errors`
- Mapping server validation errors onto fields
- Integration with TanStack Query mutations

---

## The problem with controlled forms in admin UI

| Approach | Pros | Cons in admin |
|--------|-------|----------------|
| Controlled (`useState` per field) | Simple for 2–3 fields | N fields → N state + re-render of the tree |
| RHF uncontrolled | Refs, minimal re-render | Needs a schema, a different mental model |
| Formik | Popular | Heavier bundle, slower on large forms |

**react-hook-form (RHF)** stores values in refs; re-renders happen mostly on `errors`, `isSubmitting`, touched — not on every character.

---

## Zod schema — the form contract

The schema describes **both** runtime validation **and** the TypeScript type via `z.infer`:

```tsx
// features/products/schemas/productFormSchema.ts
import { z } from "zod";

export const productFormSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(2, "SKU must be at least 2 characters")
    .max(64, "SKU must be at most 64 characters")
    .regex(/^[A-Z0-9-]+$/i, "Letters, digits, and hyphens only"),
  title: z.string().trim().min(2, "Title is required").max(200),
  description: z.string().max(5000).optional().default(""),
  price: z.coerce
    .number({ invalid_type_error: "Enter a number" })
    .positive("Price must be > 0")
    .max(999999.99),
  category: z.coerce.number().int().positive("Select a category"),
  is_active: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
```

`z.coerce.number()` — an input type="number" returns a string; Zod coerces it to a number before the checks.

**Relation to DRF:** the fields `sku`, `title`, `price`, `category`, `is_active` match [`ProductSerializer`](../../deploy/django/stack/web/api/serializers.py).

---

## useForm + zodResolver

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productFormSchema,
  type ProductFormValues,
} from "./schemas/productFormSchema";

const defaultValues: ProductFormValues = {
  sku: "",
  title: "",
  description: "",
  price: 0,
  category: 0,
  is_active: true,
};

export function ProductForm({
  initial,
  onSubmit,
}: {
  initial?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { ...defaultValues, ...initial },
  });

  async function submit(values: ProductFormValues) {
    try {
      await onSubmit(values);
    } catch (e) {
      mapApiErrorsToForm(e, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <label htmlFor="sku">SKU</label>
      <input id="sku" aria-invalid={!!errors.sku} {...register("sku")} />
      {errors.sku && (
        <span role="alert" className="field-error">
          {errors.sku.message}
        </span>
      )}

      <label htmlFor="title">Title</label>
      <input id="title" {...register("title")} />

      <label htmlFor="price">Price</label>
      <input id="price" type="number" step="0.01" {...register("price")} />

      <label htmlFor="category">Category</label>
      <select id="category" {...register("category")}>
        <option value={0}>— select —</option>
        {/* options from useQuery categories */}
      </select>

      <label>
        <input type="checkbox" {...register("is_active")} />
        Active
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
```

`noValidate` — disables the native HTML5 popup; we show our own messages (consistent UX + a11y in [34-accessibility.md](34-accessibility.md)).

---

## Controller — when register isn't enough

`register` works with native inputs. For **custom UI** (Radix Select, date picker, rich text) — `Controller`:

```tsx
import { Controller, useForm } from "react-hook-form";

<Controller
  name="category"
  control={control}
  render={({ field, fieldState }) => (
    <CategorySelect
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  )}
/>
```

Rule: if a component doesn't accept a `ref` + the standard input props — use `Controller`.

---

## Server errors → setError

DRF validation error 400:

```json
{
  "sku": ["product with this sku already exists."],
  "price": ["Ensure this value is greater than or equal to 0.01."]
}
```

```tsx
// api/mapFormErrors.ts
import type { UseFormSetError, FieldValues, Path } from "react-hook-form";
import { ApiError } from "@/api/client";

export function mapApiErrorsToForm<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
) {
  if (!(error instanceof ApiError) || error.status !== 400) return;
  const body = error.body as Record<string, string[] | string> | undefined;
  if (!body || typeof body !== "object") return;

  for (const [field, messages] of Object.entries(body)) {
    const msg = Array.isArray(messages) ? messages[0] : messages;
    if (typeof msg === "string") {
      setError(field as Path<T>, { type: "server", message: msg });
    }
  }
}
```

Don't overwrite client-side errors: server errors arrive **after** submit; Zod already filtered the obvious ones.

---

## Mutation + reset after success

```tsx
const mutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    reset(defaultValues);
    toast.success("Product created");
    navigate("/products");
  },
});

<ProductForm onSubmit={(values) => mutation.mutateAsync(values)} />
```

Edit mode: `reset(productToFormValues(product))` in a `useEffect` when `product` has loaded — **or** `key={product.id}` on the form for a remount.

---

## Validation modes

| mode | When it fires |
|------|-------------------|
| `onSubmit` (default) | On submit — good for admin |
| `onBlur` | After leaving a field |
| `onChange` | Aggressive; be careful with perf |
| `all` | blur + change |

Admin CRUD usually: **`onSubmit`** + optional `reValidateMode: "onChange"` after the first error.

---

## Lab (short version)

**Task:** a Create Product form in [`examples/`](examples/package.json).

1. Install `react-hook-form`, `@hookform/resolvers`, `zod` (already in the course's package.json).
2. Create `productFormSchema.ts` matching the DRF fields.
3. `ProductCreatePage` with categories from `useQuery(["categories"])`.
4. Submit → `useMutation` POST `/api/v1/products/`.
5. 400 → `mapApiErrorsToForm`; success → redirect + invalidate.

**Success criterion:** an invalid SKU doesn't reach the server; a duplicate SKU shows the server message under the field.

---

## Common mistakes

1. **`defaultValues: undefined`** for controlled-like fields — uncontrolled → controlled warning. Always set defaults.

2. **`register` and `value` at the same time** — a conflict. Either RHF or controlled by hand.

3. **`z.number()` without coerce** on `<input type="number">` — a string fails validation.

4. **Forgot `handleSubmit`** — the form does a full page reload.

5. **Server field names don't match** the form names (`category_id` vs `category`) — map in the API layer.

6. **isSubmitting doesn't block a double submit** — `disabled={isSubmitting}` on the button.

---

## Checklist

- [ ] Zod schema = the single source of the `ProductFormValues` type
- [ ] `zodResolver` wired into `useForm`
- [ ] Native inputs via `register`; custom — `Controller`
- [ ] DRF 400 mapped via `setError`
- [ ] Mutation invalidates the list query after success
- [ ] `aria-invalid` + `role="alert"` on field errors

---

## Related courses

| Topic | Lesson |
|------|------|
| Admin table + filters | [29-admin-table.md](29-admin-table.md) |
| CRUD lab | [31-lab-crud.md](31-lab-crud.md) |
| Optimistic save | [30-optimistic-advanced.md](30-optimistic-advanced.md) |
| a11y forms | [34-accessibility.md](34-accessibility.md) |
| Zod basics | [typescript-basic](../typescript-basic/README.md) |

---

[← 27-lab-msw](27-lab-msw.md) · [29-admin-table →](29-admin-table.md)
