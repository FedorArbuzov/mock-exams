# 28. Формы: react-hook-form + Zod resolver

## Сценарий с работы

Product manager открывает тикет: «Форма создания товара в admin SPA — 400 строк controlled inputs, каждый keystroke перерисовывает половину страницы». Вы смотрите код: десять `useState`, валидация размазана по `onChange` и `onSubmit`, типы полей продублированы в TypeScript и в ручных `if`. Code review: «Переходим на react-hook-form + Zod — один schema, uncontrolled по умолчанию, меньше re-render».

В mock-exams admin SPA формы CRUD product/category — центральный UX. Django DRF на `:8092` возвращает field-level errors (`{ "sku": ["already exists"] }`); клиент должен показать их **и** локальную валидацию до отправки.

## Что вы узнаете

- Зачем RHF вместо «голого» controlled state в admin-формах
- `@hookform/resolvers/zod` — единый источник правды для типов и правил
- `register`, `Controller`, `handleSubmit`, `formState.errors`
- Маппинг server validation errors на поля
- Интеграция с TanStack Query mutations

---

## Проблема controlled-форм в admin UI

| Подход | Плюсы | Минусы в admin |
|--------|-------|----------------|
| Controlled (`useState` на поле) | Просто для 2–3 полей | N полей → N state + re-render дерева |
| RHF uncontrolled | Refs, минимум re-render | Нужен schema, другой mental model |
| Formik | Популярен | Тяжелее bundle, медленнее на больших формах |

**react-hook-form (RHF)** хранит значения в refs; re-render в основном на `errors`, `isSubmitting`, touched — не на каждый символ.

---

## Zod schema — контракт формы

Schema описывает **и** runtime validation, **и** TypeScript type через `z.infer`:

```tsx
// features/products/schemas/productFormSchema.ts
import { z } from "zod";

export const productFormSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(2, "SKU минимум 2 символа")
    .max(64, "SKU максимум 64 символа")
    .regex(/^[A-Z0-9-]+$/i, "Только буквы, цифры и дефис"),
  title: z.string().trim().min(2, "Название обязательно").max(200),
  description: z.string().max(5000).optional().default(""),
  price: z.coerce
    .number({ invalid_type_error: "Укажите число" })
    .positive("Цена должна быть > 0")
    .max(999999.99),
  category: z.coerce.number().int().positive("Выберите категорию"),
  is_active: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
```

`z.coerce.number()` — input type="number" отдаёт string; Zod приводит к number до проверок.

**Связь с DRF:** поля `sku`, `title`, `price`, `category`, `is_active` совпадают с [`ProductSerializer`](../../deploy/django/stack/web/api/serializers.py).

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

      <label htmlFor="title">Название</label>
      <input id="title" {...register("title")} />

      <label htmlFor="price">Цена</label>
      <input id="price" type="number" step="0.01" {...register("price")} />

      <label htmlFor="category">Категория</label>
      <select id="category" {...register("category")}>
        <option value={0}>— выберите —</option>
        {/* options from useQuery categories */}
      </select>

      <label>
        <input type="checkbox" {...register("is_active")} />
        Активен
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Сохранение…" : "Сохранить"}
      </button>
    </form>
  );
}
```

`noValidate` — отключаем нативный HTML5 popup; показываем свои сообщения (единый UX + a11y в [34-accessibility.md](34-accessibility.md)).

---

## Controller — когда register недостаточен

`register` работает с native inputs. Для **custom UI** (Radix Select, date picker, rich text) — `Controller`:

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

Правило: если компонент не принимает `ref` + стандартные props input — используйте `Controller`.

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

Не затирайте client-side errors: server errors приходят **после** submit; Zod уже отфильтровал очевидное.

---

## Mutation + reset после успеха

```tsx
const mutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    reset(defaultValues);
    toast.success("Товар создан");
    navigate("/products");
  },
});

<ProductForm onSubmit={(values) => mutation.mutateAsync(values)} />
```

Edit mode: `reset(productToFormValues(product))` в `useEffect` когда `product` загрузился — **или** `key={product.id}` на форме для remount.

---

## Режимы валидации

| mode | Когда срабатывает |
|------|-------------------|
| `onSubmit` (default) | При submit — хорош для admin |
| `onBlur` | После ухода с поля |
| `onChange` | Агрессивно; осторожно с perf |
| `all` | blur + change |

Admin CRUD обычно: **`onSubmit`** + optional `reValidateMode: "onChange"` после первой ошибки.

---

## Лаба (кратко)

**Задача:** форма Create Product в [`examples/`](examples/package.json).

1. Установите `react-hook-form`, `@hookform/resolvers`, `zod` (уже в package.json курса).
2. Создайте `productFormSchema.ts` по полям DRF.
3. `ProductCreatePage` с categories из `useQuery(["categories"])`.
4. Submit → `useMutation` POST `/api/v1/products/`.
5. 400 → `mapApiErrorsToForm`; success → redirect + invalidate.

**Критерий:** invalid SKU не уходит на сервер; duplicate SKU показывает server message под полем.

---

## Типичные ошибки

1. **`defaultValues: undefined`** для controlled-like полей — uncontrolled → controlled warning. Всегда задавайте defaults.

2. **`register` и `value` одновременно** — конфликт. Либо RHF, либо controlled вручную.

3. **`z.number()` без coerce** на `<input type="number">` — string fails validation.

4. **Забыли `handleSubmit`** — form делает full page reload.

5. **Server field names не совпадают** с form names (`category_id` vs `category`) — маппинг в API layer.

6. **isSubmitting не блокирует double submit** — `disabled={isSubmitting}` на button.

---

## Чек-лист

- [ ] Schema Zod = единый источник типов `ProductFormValues`
- [ ] `zodResolver` подключён к `useForm`
- [ ] Native inputs через `register`; custom — `Controller`
- [ ] DRF 400 мапится через `setError`
- [ ] Mutation invalidate list query после success
- [ ] `aria-invalid` + `role="alert"` на ошибках поля

---

## Связь с курсом

| Тема | Урок |
|------|------|
| Admin table + filters | [29-admin-table.md](29-admin-table.md) |
| CRUD lab | [31-lab-crud.md](31-lab-crud.md) |
| Optimistic save | [30-optimistic-advanced.md](30-optimistic-advanced.md) |
| a11y forms | [34-accessibility.md](34-accessibility.md) |
| Zod basics | [typescript-basic](../typescript-basic/README.md) |

---

[← 27-lab-msw](27-lab-msw.md) · [29-admin-table →](29-admin-table.md)
