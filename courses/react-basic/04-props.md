# 04. Props: передача данных вниз

## Введение: сценарий с работы

Standup shop-frontend. Дизайнер прислал Figma: одна карточка товара — title, price, badge «Sale». Разработчик скопировал JSX три раза и вручную подставил строки. Product owner меняет цену клавиатуры — правки в **трёх** местах, одну забыли: на staging «Mechanical Keyboard» €79.99, на prod €89.99. Reviewer: «Сделай `ProductCard` и передай **props**». Вы открываете React DevTools и видите `<ProductCard title="..." price={79.99} />` — данные текут **сверху вниз**, как JSON с FastAPI `:8090` в компонент списка.

Props — **единственный** способ (до Context) передать данные от родителя к ребёнку. Они **read-only** для ребёнка: мутировать `props.price++` нельзя — нарушение однонаправленного потока из [01-landscape.md](01-landscape.md).

## Что вы узнаете

- Что такое **props** и как их передают в JSX.
- **Деструктуризацию** параметров компонента ([destructuring](../javascript-basic/17-destructuring-spread.md)).
- **Значения по умолчанию** для optional props.
- Типизацию props в **TypeScript**: inline, `type`, `interface`.
- Разницу props vs локальный **state** (preview [09-useState.md](09-useState.md)).
- Типичные баги: spread лишних props, `children`, boolean props.

## Props как аргументы функции

Компонент — функция; props — **первый аргумент** (объект):

```tsx
type ProductCardProps = {
  title: string;
  price: number;
  currency?: string;
};

export function ProductCard({ title, price, currency = "€" }: ProductCardProps) {
  return (
    <article className="product-card">
      <h2>{title}</h2>
      <p>
        {currency} {price.toFixed(2)}
      </p>
    </article>
  );
}
```

Родитель **создаёт** элемент с атрибутами — это и есть props:

```tsx
export function App() {
  return (
    <main>
      <ProductCard title="Mechanical Keyboard" price={79.99} />
      <ProductCard title="USB-C Hub" price={34.5} currency="$" />
    </main>
  );
}
```

| Синтаксис | Значение |
|-----------|----------|
| `title="Keyboard"` | string literal |
| `price={79.99}` | JavaScript-выражение (number) |
| `items={products}` | массив/объект с сервера |
| `onAdd={() => {}}` | функция-колбэк (позже [10-events-controlled.md](10-events-controlled.md)) |

**Строки** можно без фигурных скобок; **всё остальное** — в `{ }`.

## Деструктуризация и читаемость

Без деструктуризации:

```tsx
function ProductCard(props: ProductCardProps) {
  return <h2>{props.title}</h2>;
}
```

С деструктуризацией — меньше шума, явный контракт:

```tsx
function ProductCard({ title, price }: ProductCardProps) {
  return <h2>{title}</h2>;
}
```

Rest для проброса в DOM (осторожно — только на нативные элементы):

```tsx
type ButtonProps = {
  variant: "primary" | "secondary";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function ShopButton({ variant, children, ...rest }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} {...rest}>
      {children}
    </button>
  );
}
```

## Значения по умолчанию

Default в деструктуризации (как в [10-functions.md](../javascript-basic/10-functions.md)):

```tsx
function ProductCard({
  title,
  price,
  inStock = true,
}: {
  title: string;
  price: number;
  inStock?: boolean;
}) {
  return (
    <article>
      <h2>{title}</h2>
      {!inStock && <span>Нет в наличии</span>}
    </article>
  );
}
```

**Важно:** default срабатывает при `undefined`, не при `null`. Для API shop иногда приходит `null` — нормализуйте при маппинге ответа `:8090`.

Optional prop в TypeScript — `?`:

```tsx
type ProductCardProps = {
  title: string;
  price: number;
  badge?: string;
};
```

## Типы props: type vs interface

Оба подхода valid; в курсе чаще **`type`** для props объектов:

```tsx
type Product = {
  id: number;
  title: string;
  price: number;
};

type ProductCardProps = {
  product: Product;
  highlight?: boolean;
};
```

Для расширения HTML-атрибутов удобно **intersection**:

```tsx
type InputProps = {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;
```

Строгая типизация ловит опечатки **до** runtime:

```tsx
// TS error: Property 'titel' does not exist
<ProductCard titel="Keyboard" price={10} />
```

Подробнее — [32-typescript-react.md](32-typescript-react.md) и [`typescript-basic`](../typescript-basic/README.md).

## Props vs state

| | Props | State |
|---|-------|-------|
| Кто задаёт | Родитель | Сам компонент (`useState`) |
| Изменение | Родитель re-render с новыми props | `setState` |
| Направление | Вниз | Локально (или lifted up) |

```tsx
// Props: родитель решает, что показать
function Catalog({ items }: { items: Product[] }) {
  return items.map((p) => <ProductCard key={p.id} product={p} />);
}

// State позже: фильтр, счётчик корзины
```

Данные с `GET /api/v1/items` попадут в state или Query; **карточка** останется «глупой» — только props.

## Именование и boolean props

Идиома для флагов:

```tsx
<ProductCard product={p} highlight />
// эквивалент highlight={true}
```

Избегайте `highlight="true"` — это **строка**, не boolean.

Для shop API маппинг:

```tsx
const dto = await res.json();
// FastAPI → props-friendly shape
const products: Product[] = dto.map((row: { name: string; unit_price: number; id: number }) => ({
  id: row.id,
  title: row.name,
  price: row.unit_price,
}));
```

## Типичные ошибки

| Ошибка | Корневая причина | Исправление |
|--------|------------------|-------------|
| `price="79.99"` (string) | Забыли `{}` | `price={79.99}` |
| Мутация `props.product.price = 0` | Props read-only | State в родителе, новый объект |
| `{...props}` на custom component | Проброс мусора | Явный список props |
| Optional без `?` в TS | Runtime undefined | `badge?: string` |
| Передача entire API response в leaf | Слишком толстый контракт | DTO / pick нужных полей |
| `key={index}` в списке | Антипаттерн при reorder | `key={product.id}` ([07](07-lists-keys.md)) |

## Резюме

**Props** — входные параметры компонента, задаются родителем в JSX. **Деструктуризация** и **TypeScript** делают контракт явным. **Defaults** — для optional полей. Shop UI строится из мелких компонентов (`ProductCard`, `Price`, `Badge`), получающих данные сверху — с mock-массива сейчас, с `:8090` в главе 18.

## Чек-лист

- [ ] Объясните однонаправленный поток props
- [ ] Когда нужны `{фигурные скобки}` в JSX-атрибуте?
- [ ] Как задать optional prop и default?
- [ ] Почему нельзя мутировать props?
- [ ] Чем `price={79.99}` отличается от `price="79.99"`?
- [ ] Где в shop-архитектуре родитель возьмёт items?

Следующий урок: [05. Children и композиция](05-children-composition.md).
