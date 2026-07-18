# 12. Лаба: типизированные функции для shop

## Зачем эта лаба

В [javascript-basic/09-lab-objects-arrays](../javascript-basic/09-lab-objects-arrays.md) вы писали `filterByCategory` и `applyDiscount` на чистом JS. Теперь те же сценарии — с **типами**: каталог `Product[]`, query-параметры как tuple, парсер id для `GET /api/v1/items/{id}` на FastAPI `:8090`. Цель — чтобы `tsc` ловил ошибки **до** `node`/`fetch`, а сигнатуры читались как мини-OpenAPI.

**Время:** ~50–60 минут. **Окружение:** Node LTS, TypeScript (`strict`).

---

## Подготовка

```bash
cd courses/typescript-basic/examples
npm init -y && npm install -D typescript @types/node tsx
```

`tsconfig.json`: `"strict": true`, `"module": "NodeNext"`, `"include": ["lab/**/*.ts"]`.

`lab/data/products.json` — как в JS-курсе (3 товара: Keyboard, Mouse, Desk).

```text
lab/types.ts  12-query.ts  12-parse.ts  12-format.ts  12-run.ts
```

---

## Задание 1. Типы домена

`lab/types.ts`:

```typescript
export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

/** Пара для фильтра: [category, maxPrice] */
export type CategoryPriceFilter = readonly [category: string, maxPrice: number];
```

---

## Задание 2. Фильтр и map

`lab/12-query.ts` — реализуйте `filterByCategory`, `filterByCategoryAndMaxPrice` (деструктуризация tuple), `productLabels` (`map` → `"${name} ($${price})"`). Вход — `readonly Product[]`, возврат — **новый** массив.

**Критерий:** electronics = 2; `["electronics", 50]` → только Mouse; labels для трёх товаров.

---

## Задание 3. Иммутабельная скидка

`applyDiscount(products, percent)` — `percent` 0–100, иначе `throw`; новые объекты, price до 2 знаков. Исходный массив не меняется (`structuredClone` для проверки).

---

## Задание 4. Парсер id (overload)

`lab/12-parse.ts`:

```typescript
export function parseIds(input: string): number[];
export function parseIds(input: readonly string[]): number[];
export function parseIds(input: string | readonly string[]): number[] { /* TODO */ }

export function parseItemId(raw: string): number | null { /* TODO: integer > 0 */ }
```

`parseIds("1,2,foo,3")` → `[1,2,3]`. `parseItemId` — для path segment перед fetch `:8090`.

---

## Задание 5. Форматирование цены

`FormatPriceFn`, `formatPrice`, `formatLine`. Закомментируйте `products.map(formatPrice)` и сохраните сообщение `tsc` в комментарии — урок про колбэки [10-functions](10-functions.md).

---

## Задание 6 (опционально). Readonly snapshot

`freezeCatalog(products): readonly Product[]` — комментарий: почему `readonly` не защищает от `products[0].price = 0` на runtime.

---

## Запуск

```bash
npx tsc && node dist/lab/12-run.js
# или: npx tsx lab/12-run.ts
```

---

## Критерии успеха

- [ ] `npx tsc` strict без ошибок
- [ ] Фильтры не мутируют вход
- [ ] Overloads `parseIds`; `parseItemId("abc")` → `null`
- [ ] Комментарий про ошибку `map(formatPrice)`

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| `Cannot find module './types.js'` | `moduleResolution: NodeNext`, импорты с `.js` |
| `readonly` vs `Product[]` | filter возвращает новый `Product[]` |
| `parseIds` float | `Number.isInteger` |

## Связь с курсом

| Дальше | Связь |
|--------|-------|
| [13-generics](13-generics.md) | `first<T>(arr)` |
| [javascript-basic/29-fetch](../javascript-basic/29-fetch.md) | реальный `:8090` |
| [`fastapi/06-lab-crud`](../fastapi/06-lab-crud.md) | контракт items |

Следующий урок: [13. Generics](13-generics.md).

## Чек-лист

- [ ] Tuple `CategoryPriceFilter` в фильтре
- [ ] Overload `parseIds` компилируется
- [ ] Понимаете shallow readonly vs deep immutability
