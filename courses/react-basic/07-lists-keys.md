# 07. Списки, keys, фрагменты

## Введение: сценарий с работы

Staging shop: после сортировки каталога «по цене» input количества в **третьей** карточке «залип» — показывает 5, хотя пользователь не трогал эту позицию. В DevTools список `<ProductRow key={0}>` … `key={4}`. При reorder React **переиспользовал DOM** третьего узла для другого товара — классический баг **index as key**. Параллельно джун вернул из map два `<td>` без `<tr>` — «Adjacent JSX elements». Senior добавляет `key={product.id}` и оборачивает ячейки во **Fragment**.

Списки — основа каталога mock-exams: `items` из JSON FastAPI `:8090`, корзина, order lines. Метод **`map`** вы уже знаете из [08-arrays.md](../javascript-basic/08-arrays.md); здесь — React-правила рендера коллекций.

## Что вы узнаете

- Рендер массива через **`array.map()`** в JSX.
- Зачем нужен **`key`** и что такое stable identity.
- Почему **index** — плохой key при reorder/filter/delete.
- **`<>...</>`** (Fragment) — группировка без лишнего DOM.
- **`React.Fragment`** с key для списков фрагментов.
- Пустой список и loading (preview [08-conditional-rendering.md](08-conditional-rendering.md)).

## map в JSX

```tsx
type Product = { id: number; title: string; price: number };

function ProductList({ products }: { products: Product[] }) {
  return (
    <ul className="product-list">
      {products.map((product) => (
        <li key={product.id}>
          {product.title} — € {product.price.toFixed(2)}
        </li>
      ))}
    </ul>
  );
}
```

**Правила:**

1. `map` возвращает **массив элементов** — React умеет их рендерить.
2. **Key** на **корневом** элементе каждой итерации (часто `<li>`, `<ProductCard>`).
3. Не вызывайте `map` ради side effects — для этого `forEach` ([08-arrays.md](../javascript-basic/08-arrays.md)).

Данные с API:

```tsx
// После fetch с :8090
const [products, setProducts] = useState<Product[]>([]);
// ...
return (
  <div>
    {products.map((p) => (
      <ProductCard key={p.id} product={p} />
    ))}
  </div>
);
```

## Key: зачем React спрашивает identity

При обновлении React сравнивает **новое** дерево со **старым** (reconciliation, [01-landscape.md](01-landscape.md)). Key говорит: «этот элемент — **тот же** logical item, что и раньше».

```tsx
// Стабильный id с сервера — идеал
products.map((p) => <ProductCard key={p.id} product={p} />);
```

| Key | Когда OK | Когда плохо |
|-----|----------|-------------|
| `product.id` | id стабилен в жизни списка | id меняется при каждом fetch без смысла |
| `uuid` с бэка | нет natural id | — |
| `index` | статичный read-only список | sort, filter, insert, delete |
| `Math.random()` | **никогда** | каждый render новый key → remount |

**Симптомы плохого key:** state input/checkbox «переезжает», анимации сбиваются, лишние запросы в `useEffect` дочернего компонента.

### Пример с reorder

```tsx
// Плохо: после sort по price DOM nodes переиспользуются неверно
items.map((item, index) => <Row key={index} item={item} />);

// OK:
items.map((item) => <Row key={item.id} item={item} />);
```

## Fragment: группировка без div-супа

Иногда нужно вернуть **несколько** sibling без обёртки в layout (лишний `<div>` ломает flex/grid или семантику `<table>`):

```tsx
import { Fragment } from "react";

function OrderSummaryLines({ lines }: { lines: { id: string; label: string; qty: number }[] }) {
  return (
    <>
      {lines.map((line) => (
        <Fragment key={line.id}>
          <dt>{line.label}</dt>
          <dd>{line.qty}</dd>
        </Fragment>
      ))}
    </>
  );
}
```

Короткий синтаксис `<>` **не** принимает `key` — для key используйте `import { Fragment } from "react"`.

### map + Fragment в таблице shop

```tsx
function CartTable({ rows }: { rows: CartRow[] }) {
  return (
    <table>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.title}</td>
            <td>{row.qty}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

Здесь key на `<tr>`, Fragment не нужен.

## Пустой список и guard

```tsx
function Catalog({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="empty">Товаров пока нет. Проверьте API :8090.</p>;
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

Early return vs inline `&&` — [08-conditional-rendering.md](08-conditional-rendering.md).

## Immutability при обновлении списка

React state — **новая ссылка** массива ([09-useState.md](09-useState.md)):

```tsx
// Добавить в корзину — новый массив
setItems((prev) => [...prev, newItem]);

// Удалить
setItems((prev) => prev.filter((x) => x.id !== removedId));

// Не мутировать:
// items.push(newItem); setItems(items); // React может не перерисовать
```

Тот же принцип, что `toSorted` vs `sort` в [08-arrays.md](../javascript-basic/08-arrays.md).

## Типичные ошибки

| Ошибка | Корневая причина | Исправление |
|--------|------------------|-------------|
| Warning: Each child should have a unique key | key забыли или на внутреннем div | key на top-level в map |
| `key={index}` после filter | index не = stable id | id сущности |
| key на Fragment `<>` | Short syntax без key | `<Fragment key=...>` |
| `map` без return в `{}` | Блок `{}` без return | Круглые скобки или return |
| Вложенные map без key на обоих уровнях | Внутренний список | key на каждом уровне |
| `key={product.title}` | duplicate titles | id |

## Резюме

Коллекции в UI — **`items.map(...)`** с **уникальным стабильным `key`**. Index — только для статичных списков. **Fragment** группирует узлы без лишнего DOM; с key — только `Fragment`. Обновление списков в state — **immutable** копии. Каталог shop на `:8090` — тот же паттерн, что mock в [06-lab-props.md](06-lab-props.md).

## Чек-лист

- [ ] Где ставить `key` в `products.map(...)`?
- [ ] Почему index ломает controlled input при sort?
- [ ] Когда `<>` недостаточно?
- [ ] Как добавить элемент в state-массив без мутации?
- [ ] Что показать при `products.length === 0`?

Следующий урок: [08. Условный рендеринг](08-conditional-rendering.md).
