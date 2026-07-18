# 08. Условный рендеринг

## Введение: сценарий с работы

Страница товара shop: пока `fetch` к `:8090` идёт — пустой экран; при 404 — «undefined is not an object»; при `stock: 0` badge «В наличии» всё равно зелёный. QA заводит три бага. Вы смотрите `ProductDetail.tsx` — там `product && product.name` в одном месте, тернарник в другом, `if` после хуков (lint error). Нужна **система**: loading, error, empty, happy path — без дублирования и без `0` на экране из-за `count && <Badge>`.

Условный рендеринг — как `if` в [16-control-flow.md](../javascript-basic/16-control-flow.md), но **внутри JSX** выражения или **до return** в компоненте.

## Что вы узнаете

- **`&&`** (logical AND) для «показать если truthy».
- **Тернарный оператор** `? :` для двух веток.
- **Early return** для guard-clause и loading/error.
- Переменные **`let content`** / IIFE (редко) для сложных веток.
- Ловушки: **`0`**, пустая строка, `null` vs `undefined`.
- Паттерны UI states для shop ([31-ui-states.md](31-ui-states.md)).

## Тернарный оператор в JSX

Две **ветки UI** — классика:

```tsx
function StockBadge({ inStock }: { inStock: boolean }) {
  return (
    <span className={inStock ? "badge badge--ok" : "badge badge--out"}>
      {inStock ? "В наличии" : "Нет в наличии"}
    </span>
  );
}
```

Вложенность не deeper 2–3 уровней — иначе вынесите подкомпонент `StockBadge`.

```tsx
function PriceBlock({ price, onSale }: { price: number; onSale: boolean }) {
  return (
    <p>
      {onSale ? (
        <>
          <s>€ {(price * 1.2).toFixed(2)}</s> € {price.toFixed(2)}
        </>
      ) : (
        <>€ {price.toFixed(2)}</>
      )}
    </p>
  );
}
```

## Logical AND (`&&`)

«Показать **только если** условие truthy»:

```tsx
function ProductCard({ product }: { product: Product }) {
  return (
    <article>
      <h2>{product.title}</h2>
      {product.badge && <span className="badge">{product.badge}</span>}
      {product.price < 20 && <p className="hint">Бесплатная доставка от €50</p>}
    </article>
  );
}
```

**Ловушка с числом `0`:**

```tsx
{cartCount && <span>В корзине: {cartCount}</span>}
// cartCount === 0 → на экране цифра 0, не скрыто!

{cartCount > 0 && <span>В корзине: {cartCount}</span>}
// OK
```

| Выражение | Результат `&&` |
|-----------|----------------|
| `true && <X />` | `<X />` |
| `false && <X />` | `false` (не рендерится) |
| `0 && <X />` | **`0` рендерится!** |
| `null && <X />` | `null` |
| `"" && <X />` | `""` |

Для boolean используйте явное сравнение или `!!`.

## Early return (guard clauses)

Читаемый паттерн для **страниц** с async data:

```tsx
type CatalogProps = {
  status: "loading" | "error" | "ready";
  products: Product[];
  errorMessage?: string;
};

function Catalog({ status, products, errorMessage }: CatalogProps) {
  if (status === "loading") {
    return <p className="state">Загрузка каталога…</p>;
  }

  if (status === "error") {
    return (
      <p className="state state--error">
        Ошибка API: {errorMessage ?? "Проверьте FastAPI :8090"}
      </p>
    );
  }

  if (products.length === 0) {
    return <p className="state">Каталог пуст</p>;
  }

  return (
    <div className="catalog-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

**Правило hooks:** early return **после** всех `useState`/`useEffect` на top level — нельзя ставить `if (loading) return` **до** вызова hooks ([14-useEffect.md](14-useEffect.md)). Для loading на уровне страницы часто делят: `CatalogPage` (hooks) → presentational `Catalog` (guards).

## if вне JSX

Вычислить переменную перед `return`:

```tsx
function CartButton({ count }: { count: number }) {
  let label: string;
  if (count === 0) {
    label = "Корзина пуста";
  } else if (count === 1) {
    label = "1 товар";
  } else {
    label = `${count} товаров`;
  }

  return <button type="button">{label}</button>;
}
```

Или `switch` для enum status из API.

## null и undefined

React **не рендерит** `null`, `undefined`, `false`:

```tsx
{maybeBadge ? <span>{maybeBadge}</span> : null}
// часто короче:
{maybeBadge && <span>{maybeBadge}</span>}
```

Optional chaining с API:

```tsx
{product.discount?.percent != null && (
  <span>-{product.discount.percent}%</span>
)}
```

См. [19-optional-nullish.md](../javascript-basic/19-optional-nullish.md).

## Role-based UI (preview)

```tsx
function AdminLink({ role }: { role: "guest" | "admin" }) {
  return (
    <nav>
      <a href="/catalog">Каталог</a>
      {role === "admin" && <a href="/admin">Admin</a>}
    </nav>
  );
}
```

Auth flow — [react-intermediate](../react-intermediate/README.md).

## Типичные ошибки

| Ошибка | Корневая причина | Исправление |
|--------|------------------|-------------|
| `0` на экране | `count && <UI>` | `count > 0 &&` |
| Тернарник в 5 уровней | Нечитаемость | Подкомпоненты / early return |
| `product.name` до проверки | null product | Guard или optional chaining |
| hooks после conditional return | Rules of Hooks | hooks сверху, UI guards ниже или split |
| `condition ? <A />` без `: null` | Иногда OK | Явный `: null` для ясности |
| Разный layout loading/error | Copy-paste | Единый `StateMessage` компонент |

## Резюме

В JSX: **`&&`** для optional блоков (осторожно с `0`), **тернарник** для двух вариантов, **early return** для loading/error/empty. Сложную логику — в переменные или дочерние компоненты. Shop UI на каждом экране с данными `:8090` должен явно обрабатывать все состояния.

## Чек-лист

- [ ] Когда `&&` опаснее тернарника?
- [ ] Почему `{items.length && ...}` может показать `0`?
- [ ] Где ставить early return относительно hooks?
- [ ] Три состояния каталога кроме «есть товары»
- [ ] Как отрендерить optional badge без лишнего DOM?

Следующий урок: [09. useState: локальное состояние](09-useState.md).
