# 07. Объекты: свойства, ссылки, копирование

## Введение: сценарий с работы

Баг в корзине shop: пользователь применил промокод, скидка «сработала» у всех активных сессий. Root cause — **один объект** `defaultConfig` в модуле; функция `applyPromo(cart, config = defaultConfig)` **мутировала** `config.discount`, и все вызовы видели последнее значение. В Python вы бы скопировали dict через `.copy()`; в JS spread `{ ...config }` дал **shallow** copy — вложенный `config.rules` всё ещё общий.

Code review:

```javascript
const user = JSON.parse(req.body);
if (user.isAdmin) grantAccess();
```

Reviewer: «А если body `{"isAdmin": true}`?» — объекты из JSON **не валидированы**; в FastAPI Pydantic отсек бы лишнее на `:8090`. В JS слое — ваш контракт.

Interview question: «Чем `in` отличается от `hasOwnProperty`?» — без ответа не понять, откуда взялось свойство `toString` на «пустом» объекте order.

Объекты — форма **JSON** от API, **state** в React, **options** в функциях. Понимание **ссылок**, **shallow/deep copy**, **перебора** — обязательно до prototypes и classes.

## Что вы узнаете

- Лiteral objects, доступ к свойствам, computed keys.
- **Ссылочную семантику** — почему два имени, один объект.
- **Shallow vs deep** копирование, `structuredClone`, ловушки JSON.
- **Методы** объектов и превью `this`.
- **Перебор** свойств: `keys`, `entries`, `values`.
- **`in` vs `hasOwn`**, `Object.freeze` / `seal`.
- **JSON** как формат обмена с FastAPI shop API.

## Объект: коллекция ключ–значение

```javascript
const product = {
  id: 1,
  name: "Keyboard",
  price: 79.99,
  category: "electronics",
  inStock: true,
};
```

Ключи — **строки** или **Symbol** (ES6). Числа `1` становятся `"1"`.

### Доступ к свойствам

```javascript
product.name;           // dot — когда ключ известен и valid identifier
product["price"];       // bracket — динамический ключ
const field = "category";
product[field];         // "electronics"

// Invalid identifier keys
const row = { "order-id": 8842, "1st": true };
row["order-id"];
```

### Вычисляемые имена (computed keys)

```javascript
const prefix = "shipping";
const order = {
  id: 8842,
  [prefix + "Address"]: "Berlin",
  [`${prefix}Method`]: "express",
};
order.shippingAddress; // "Berlin"
```

Удобно при сборке объекта из переменных — типичный паттерн mapper API → UI model.

## Ссылочная семантика: главный источник багов

**Примитивы** копируются по значению; **объекты** — по **ссылке**:

```javascript
const a = { price: 79.99 };
const b = a;           // b указывает на тот же объект
b.price = 59.99;
console.log(a.price);  // 59.99 — a «изменился» без прямого присваивания

const c = { price: 79.99 };
console.log(a === b);  // true — same reference
console.log(a === c);  // false — different objects, same shape
```

Функции получают **ссылку** на объект:

```javascript
function addTax(item) {
  item.price = item.price * 1.2; // mutates caller's object!
  return item;
}

const keyboard = { name: "Keyboard", price: 79.99 };
addTax(keyboard);
console.log(keyboard.price); // 95.988 — surprise для вызывающего
```

**Иммутабельный** стиль — возвращать **новый** объект ([08-arrays.md](08-arrays.md), React):

```javascript
function addTaxImmutable(item) {
  return { ...item, price: item.price * 1.2 };
}
```

## Копирование: shallow vs deep

### Shallow copy

```javascript
const original = {
  id: 1,
  name: "Desk",
  meta: { views: 10, featured: false },
};

const copy = { ...original };           // spread
const copy2 = Object.assign({}, original); // equivalent shallow

copy.name = "Standing Desk";
copy.meta.views = 999;

console.log(original.name);       // "Desk" — top-level ok
console.log(original.meta.views); // 999 — nested SHARED!
```

Spread копирует **первый уровень** свойств. Вложенные объекты и массивы — **общие ссылки**.

### Deep copy

**JSON hack** (ограниченный):

```javascript
const deep = JSON.parse(JSON.stringify(original));
// Теряет: undefined, Symbol, Function, Date (→ string), BigInt
// Не работает с circular references
```

**structuredClone** (Node 17+, modern browsers):

```javascript
const clone = structuredClone(original);
clone.meta.views = 1;
console.log(original.meta.views); // 10 — независимо
```

Для сложных графов и class instances — библиотеки (lodash cloneDeep) или domain-specific copy. На курсе — **понимать shallow** достаточно для 80% багов.

## Методы объекта

Функция как свойство — **метод**:

```javascript
const cart = {
  items: [],
  add(product) {
    this.items.push(product); // this — cart при cart.add(...)
    return this.items.length;
  },
  total() {
    return this.items.reduce((s, i) => s + i.price, 0);
  },
};

cart.add({ name: "Mouse", price: 29.99 });
console.log(cart.total()); // 29.99
```

Краткая запись ES6: `add(product) { }` вместо `add: function(product) { }`. **`this`** — отдельная глава [14-this.md](14-this.md); здесь — метод вызывают через точку: `cart.add`.

## Перебор свойств

```javascript
const user = { name: "Ann", role: "admin", active: true };

for (const key of Object.keys(user)) {
  console.log(key, user[key]);
}

for (const [key, value] of Object.entries(user)) {
  console.log(`${key}=${value}`);
}

Object.values(user); // ["Ann", "admin", true]
```

**Собственные** enumerable свойства — `Object.keys`. Унаследованные от `Object.prototype` (`toString`, …) — не в keys, но **`"toString" in obj`** может быть true через prototype chain — [20-prototypes.md](20-prototypes.md).

```javascript
const sym = Symbol("internal");
const obj = { a: 1, [sym]: "secret" };
Object.keys(obj);           // ["a"]
Object.getOwnPropertySymbols(obj); // [sym]
```

## Проверка наличия свойства

```javascript
"name" in user;                    // true, включая inherited
Object.hasOwn(user, "name");       // true — ES2022, number
user.hasOwnProperty("name");       // true — avoid on objects with null prototype issues

Object.hasOwn(user, "toString");   // false — inherited
"toString" in user;                // true — from prototype
```

Для JSON data from API обычно **`Object.hasOwn(obj, key)`** или **`key in obj`** если prototype чистый plain object.

## Изменение, удаление, descriptors (обзор)

```javascript
product.discount = 0.1;
delete product.inStock;

Object.defineProperty(product, "id", { writable: false }); // advanced
```

**Заморозка:**

```javascript
Object.freeze(product);  // no add/delete/reassign properties (shallow!)
Object.seal(product);    // can change values, no add/delete
```

`freeze` не рекурсивен — nested objects still mutable.

## Деструктуризация (превью)

```javascript
const { name, price, category = "misc" } = product;
const { name: productName } = product; // rename

function printItem({ name, price }) {
  console.log(name, price);
}
```

Полностью — [17-destructuring-spread.md](17-destructuring-spread.md).

## JSON: мост к FastAPI и shop API

HTTP body и `JSON.parse` дают **plain objects**:

```javascript
const json = JSON.stringify(product);
// '{"id":1,"name":"Keyboard","price":79.99,...}'

const parsed = JSON.parse(json);
parsed.id; // 1
```

Особенности `JSON.stringify`:

- ключи всегда строки в JSON text;
- `undefined`, функции, Symbol — **опускаются** в objects или → `null` в arrays;
- `Date` → ISO string.

Ответ FastAPI `:8090`:

```javascript
// const res = await fetch("http://localhost:8090/api/v1/items/1");
// const item = await res.json(); // plain object
```

Валидация на клиенте до TypeScript — manual checks или Zod позже. **try/catch** на `JSON.parse` user input — [32-error-handling.md](32-error-handling.md).

```javascript
function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
```

## Plain objects vs Map (preview)

Objects — строковые ключи, prototype, JSON-native. **Map** — любые ключи, порядок insertion — [34-map-set.md](34-map-set.md). Для `{ id → product }` из списка часто `reduce` или Map.

## Как это связано с курсом

| Урок | Связь |
|------|-------|
| [04. Примитивы](04-primitives.md) | object vs primitive |
| [08. Массивы](08-arrays.md) | массивы — объекты; массив объектов products |
| [09. Лаба](09-lab-objects-arrays.md) | products.json, shallow trap |
| [14. this](14-this.md) | методы объекта |
| [17. Destructuring](17-destructuring-spread.md) | spread copy |
| [20. Prototypes](20-prototypes.md) | chain, `hasOwn` vs `in` |
| [29. fetch](29-fetch.md) | JSON bodies |
| [`api-design`](../api-design/README.md) | контракт полей JSON |

## Типичные ошибки

**Мутировать shared config/default object.** Копируйте на входе функции: `{ ...defaults, ...overrides }`.

**Думать spread = deep clone.** Nested shared — классика lab 09.

**`const obj` запрещает менять поля.** Запрещает только reassignment `obj`.

**`JSON.parse` без try/catch** на user/admin input.

**Путать `==` для nested comparison.** Сравнение `{a:1} === {a:1}` — false (different refs).

**Доверять `JSON.parse` prototype pollution** (legacy libs) — plain objects from `JSON.parse` safe in modern Node.

**Использовать objects с integer-like keys как arrays.** Use arrays for lists.

## Резюме

Объекты — ассоциативные коллекции со **ссылочной** семантикой. Shallow copy (`spread`, `assign`) не клонирует nested. `structuredClone` и JSON — deep с оговорками. Перебор — `Object.keys/entries/values`; ownership — `Object.hasOwn`. JSON — lingua franca с FastAPI shop API. Immutability через новые объекты готовит к React и предсказуемым функциям.

## Чек-лист

- [ ] Чем dot access отличается от bracket?
- [ ] После `const b = a` и `b.x = 1` — что у `a.x`?
- [ ] Почему `{ ...obj }` не deep copy?
- [ ] Чем `in` отличается от `Object.hasOwn`?
- [ ] Что `JSON.stringify({ a: 1, b: undefined })`?
- [ ] Зачем не мутировать объект config по default?
- [ ] Что вернёт `Object.keys({ a: 1, [Symbol()]: 2 })`?

Следующий урок: [08. Массивы](08-arrays.md).
