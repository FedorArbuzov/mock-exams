# 08. Массивы и методы высокого порядка

## Введение: сценарий с работы

Dashboard shop admin: «Покажи топ-5 товаров electronics дешевле $100, отсортированных по имени». Джун пишет три вложенных `for`, off-by-one в индексе, мутирует исходный массив `.sort()` без comparator — цены 10, 2, 1 превращаются в 1, 10, 2. Senior за 15 минут:

```javascript
products
  .filter((p) => p.category === "electronics" && p.price < 100)
  .toSorted((a, b) => a.name.localeCompare(b.name))
  .slice(0, 5);
```

Code review React: `setItems(items.sort(...))` — **sort мутирует** state in place; React не видит новой ссылки. Fix: `toSorted` или `[...items].sort()`.

Async bug в BFF:

```javascript
const ids = userIds.map(async (id) => fetchItem(id));
console.log(ids); // [Promise, Promise, ...] — не данные!
```

Нужен `Promise.all` — [26-promises.md](26-promises.md).

Массивы — рабочая лошадка для JSON lists от FastAPI `:8090` (`items`, `orders`). Эта глава — **мутability, map/filter/reduce, поиск, sort**, immutability для будущего React state.

## Что вы узнаете

- Массив как объект с индексами; **length**, mutating methods.
- **`map`**, **`filter`**, **`reduce`** — декларативная обработка коллекций.
- **`find`**, **`some`**, **`every`**, **`includes`**.
- **Сортировку** и ловушку default string sort для чисел.
- **`forEach` vs `map`**, spread/rest с массивами.
- **`flat`**, **`flatMap`**, чейны методов.
- Immutability patterns для shop catalog.

## Массив: упорядоченная коллекция

```javascript
const products = [
  { id: 1, name: "Keyboard", price: 79.99 },
  { id: 2, name: "Mouse", price: 29.99 },
  { id: 3, name: "Desk", price: 199.0 },
];

products[0].name;   // "Keyboard"
products.length;    // 3
products[products.length - 1]; // last
```

Массив — **объект** с особым прототипом (`Array.prototype`). `typeof [] === "object"`, проверка — `Array.isArray()`.

### Mutating операции

```javascript
const nums = [10, 20];
nums.push(30);      // [10, 20, 30] — в конец, return new length
nums.pop();         // 30, массив [10, 20]
nums.unshift(5);    // в начало
nums.shift();       // удалить первый
nums.splice(1, 1);  // удалить 1 элемент с index 1
```

### Non-mutating (или возвращают новое)

```javascript
nums.slice(0, 1);   // копия части [10]
nums.concat([99]);  // новый массив
[...nums, 99];      // spread — idiomatic
```

ES2023 **не мутирующие** аналоги:

```javascript
[3, 1, 2].toSorted((a, b) => a - b);   // [1, 2, 3], original unchanged
[1, 2, 3].toReversed();                // [3, 2, 1]
```

**Разреженные массивы** (holes): `[1, , 3]` — редко нужны; `map` пропускает empty slots.

## `map`: преобразовать каждый элемент

```javascript
const prices = [79.99, 29.99, 199.0];
const withTax = prices.map((p) => Math.round(p * 1.2 * 100) / 100);
// новый массив, prices не изменился

const names = products.map((p) => p.name);
// ["Keyboard", "Mouse", "Desk"]
```

Callback: `(element, index, array) => ...`. **Всегда** return value (или implicit return без `{}`):

```javascript
// Bug:
products.map((p) => { p.name.toUpperCase(); }); // undefined each — forgot return

// OK:
products.map((p) => p.name.toUpperCase());
```

## `filter`: отбор по условию

```javascript
const cheap = products.filter((p) => p.price < 50);
// [{ id: 2, name: "Mouse", price: 29.99 }]

const electronics = products.filter((p) => p.category === "electronics");
```

Empty result — `[]`, truthy! Проверяйте `.length`.

## `reduce`: свёртка в одно значение

```javascript
const total = products.reduce((sum, p) => sum + p.price, 0);
// 308.98

const byCategory = products.reduce((acc, p) => {
  const cat = p.category ?? "other";
  acc[cat] = (acc[cat] ?? 0) + p.price;
  return acc; // обязательно return acc
}, {});
```

**Начальное значение** accumulator — почти всегда указывайте явно. Без него на пустом массиве — TypeError; на одном элементе — первый элемент как acc (surprise).

Группировка заказов по status, подсчёт inventory — типичные reduce в shop domain.

## Поиск и проверки

```javascript
products.find((p) => p.id === 2);       // object or undefined
products.findIndex((p) => p.id === 999); // -1

products.some((p) => p.price > 100);    // true — хотя бы один
products.every((p) => p.price > 0);     // true — все

products.includes(products[0]); // false — includes by reference for objects!
[1, 2, 3].includes(2);          // true for primitives
```

Для object by id — `find`, не `includes`.

## Сортировка

Default **string** sort:

```javascript
[10, 2, 1].sort(); // [1, 10, 2] — lexicographic!
"10" < "2" as strings
```

Numeric:

```javascript
[10, 2, 1].sort((a, b) => a - b); // [1, 2, 10]
products.toSorted((a, b) => a.name.localeCompare(b.name));
```

**`sort` mutates** — в immutable коде `toSorted` или `[...arr].sort()`.

## `forEach` vs `map`

```javascript
products.forEach((p) => console.log(p.name)); // undefined return, side effects only

const ids = products.map((p) => p.id); // [1, 2, 3] — new array
```

Не используйте `map` если результат не нужен. Не используйте `forEach` если нужен массив (нет chain). `for...of` — когда нужен break/continue.

## Spread и rest

```javascript
const a = [1, 2];
const b = [...a, 3, 4]; // [1, 2, 3, 4]

function head(first, ...rest) {
  console.log(first, rest);
}
head(1, 2, 3); // 1, [2, 3]

const [top, second, ...others] = products;
```

Копия массива: `[...products]` — shallow; nested objects shared.

## `flat` и `flatMap`

```javascript
[1, [2, 3], 4].flat(); // [1, 2, 3, 4]
[1, [2, [3]]].flat(2); // depth

products.flatMap((p) => [p.name, p.price]); // interleave
// alternative: map + flat(1)
```

## Чейны методов

```javascript
const result = products
  .filter((p) => p.price < 100)
  .map((p) => ({ ...p, label: `${p.name} ($${p.price})` }))
  .toSorted((a, b) => a.name.localeCompare(b.name));
```

Читаемость > гольф. Разбивайте на named steps если chain > 4–5 операций.

## Immutability: обновление catalog

```javascript
function applyDiscount(products, percent) {
  return products.map((p) => ({
    ...p,
    price: Math.round(p.price * (1 - percent / 100) * 100) / 100,
  }));
}

function removeProduct(products, id) {
  return products.filter((p) => p.id !== id);
}
```

Лаба [09-lab-objects-arrays.md](09-lab-objects-arrays.md) закрепляет на `products.json`.

## Async в map — ловушка

```javascript
// WRONG for sequential intent without await:
userIds.map(async (id) => {
  const res = await fetch(`http://localhost:8090/api/v1/items/${id}`);
  return res.json();
});
// Returns Promise[] — need:
// await Promise.all(userIds.map(async (id) => { ... }));
```

Подробно — [27-async-await.md](27-async-await.md).

## Как это связано с курсом

| Урок | Связь |
|------|-------|
| [07. Объекты](07-objects.md) | элементы массива — objects, shallow copy |
| [09. Лаба](09-lab-objects-arrays.md) | shop products JSON |
| [17. Spread](17-destructuring-spread.md) | `[...arr]`, destructuring |
| [23. Iterators](23-iterators-generators.md) | `for...of` over arrays |
| [29. fetch](29-fetch.md) | массив items из API |
| [`fastapi/17-pagination`](../fastapi/17-pagination-filters.md) | lists + total на backend |

## Типичные ошибки

**Mutate state then setState same reference.** В React — новый array reference.

**Numeric sort без comparator.** `[10,2,1].sort()` wrong order.

**`map` callback with `{` without return.** Silent undefined array.

**`reduce` without initial value** on empty or single-element arrays.

**`find` vs `filter[0]`** — find stops early; filter scans all.

**`async map` without Promise.all.** Array of pending promises.

**Confuse `slice` (copy) and `splice` (mutate).** splice returns removed elements.

## Резюме

Массивы — ordered collections с богатым API. **`map`/`filter`/`reduce`** — основной стиль обработки shop lists. Mutators (`push`, `sort`) vs immutability (`toSorted`, spread) — осознанный выбор. Сортировка чисел требует comparator. Цепочки читаемы для ETL JSON от `:8090`; async требует `Promise.all`.

## Чек-лист

- [ ] Чем `slice` отличается от `splice`?
- [ ] `[10,2,1].sort()` без comparator — результат?
- [ ] `reduce` на `[]` без initial — что будет?
- [ ] Когда `find` вернёт `undefined`?
- [ ] Напишите `totalByCategory(products)` одним reduce
- [ ] Почему `setItems(items.sort())` опасен в React?
- [ ] Как получить данные из `ids.map(async ...)`?

Следующий урок: [09. Лаба: объекты и массивы](09-lab-objects-arrays.md).
