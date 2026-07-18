# 21. Классы ES6

## Сценарий с работы

В сервисе каталога товаров каждый `Product` должен иметь имя, цену и SKU; цена не может быть отрицательной; скидочный товар переопределяет отображаемую цену. Junior пишет всё в одном объекте без структуры. На review просят «сделать класс с валидацией». В легаси вы видите `function User() { ... }` и `User.prototype.save`, в новом коде — `class User`. На собеседовании: «Где физически лежат методы класса?» и «Чем `#balance` отличается от `_balance`?»

Классы ES6 — привычный OOP-синтаксис поверх **прототипов** ([20-prototypes.md](20-prototypes.md)). Без них сложно читать NestJS, ошибки DOM и современный backend на Node.

## Что вы узнаете

- Как объявлять класс, конструктор и поля экземпляра
- Геттеры, сеттеры и вычисляемые свойства
- Статические методы и когда они нужны (фабрики, утилиты)
- Наследование `extends`, вызов `super` и порядок инициализации
- Приватные поля `#` и их отличие от соглашения `_`
- Как `class` связан с `prototype` и `instanceof`
- Когда классы уместны, а когда лучше фабрика с замыканием
- Типичные ошибки: забытый `super`, стрелки-методы на каждом экземпляре

---

## Объявление класса: синтаксис и что под капотом

```javascript
class Product {
  constructor(name, price, sku) {
    this.name = name;
    this.price = price;
    this.sku = sku;
  }

  describe() {
    return `${this.name} (${this.sku})`;
  }
}

const keyboard = new Product("Keyboard", 79.99, "KB-001");
console.log(keyboard.describe()); // "Keyboard (KB-001)"
```

Класс — это **функция**; методы попадают на `Product.prototype`:

```javascript
console.log(typeof Product); // "function"
console.log(keyboard.describe === Product.prototype.describe); // true
```

Тело класса всегда в **strict mode**. Вызов `Product()` без `new` даёт `TypeError` (в отличие от старых конструкторов без защиты).

```javascript
// Product(); // TypeError: Class constructor Product cannot be invoked without 'new'
```

---

## Поля класса (class fields)

ES2022 позволяет объявлять поля прямо в теле класса:

```javascript
class Counter {
  count = 0;           // поле экземпляра, инициализация на каждом new
  static max = 100;      // на самой функции Counter
  #secret = 0;          // приватное (см. ниже)

  inc() {
    this.count += 1;
    this.#secret += 1;
    return this.count;
  }
}

const c = new Counter();
console.log(c.inc()); // 1
console.log(c.count); // 1
console.log(Counter.max); // 100
// console.log(c.#secret); // SyntaxError — только внутри класса
```

Поля экземпляра создаются **после** вызова `super()` в наследнике (если есть родительский конструктор). Порядок важен при сложной инициализации.

---

## Геттеры и сеттеры

Инкапсуляция **логики** доступа без отдельных методов `getPrice` / `setPrice`:

```javascript
class PricedItem {
  constructor(price) {
    this._price = price;
  }

  get price() {
    return this._price;
  }

  set price(value) {
    if (value < 0) {
      throw new Error("Price cannot be negative");
    }
    this._price = value;
  }

  get displayPrice() {
    return `$${this._price.toFixed(2)}`;
  }
}

const item = new PricedItem(10);
console.log(item.displayPrice); // "$10.00"
item.price = 15;
// item.price = -1; // Error: Price cannot be negative
```

Геттер вызывается как свойство: `item.displayPrice`, не `item.displayPrice()`.

**Важно:** в сеттере не пишите `set price` с присваиванием `this.price = value` без другого поля — бесконечная рекурсия. Поэтому внутреннее поле часто `_price` или `#price`.

---

## Приватные поля `#`

Настоящая приватность на уровне языка (не только соглашение):

```javascript
class Wallet {
  #balance = 0;

  deposit(amount) {
    if (amount <= 0) throw new Error("amount must be positive");
    this.#balance += amount;
  }

  get balance() {
    return this.#balance;
  }
}

const w = new Wallet();
w.deposit(100);
console.log(w.balance); // 100
// console.log(w.#balance); // SyntaxError снаружи класса
```

| Подход | Доступ снаружи | Проверка на этапе парсинга |
|--------|----------------|----------------------------|
| `_balance` | Можно прочитать/писать | Нет |
| `#balance` | Нельзя по синтаксису | Да |

Приватные поля **не** попадают в JSON при `JSON.stringify` — только публичные данные.

---

## Статические методы и свойства

Принадлежат **классу**, не экземпляру:

```javascript
class Product {
  constructor(name, price, sku) {
    this.name = name;
    this.price = price;
    this.sku = sku;
  }

  static fromJSON(json) {
    return new Product(json.name, json.price, json.sku);
  }

  static isValidSku(sku) {
    return typeof sku === "string" && sku.length > 0;
  }
}

const raw = { name: "Mouse", price: 29.5, sku: "MS-01" };
const mouse = Product.fromJSON(raw);
console.log(mouse.name); // "Mouse"
console.log(Product.isValidSku("")); // false
```

Паттерн `fromJSON` / `fromAPI` — удобная точка валидации при разборе ответа `fetch` ([29-fetch.md](29-fetch.md)).

```javascript
console.log(mouse.fromJSON); // undefined — статика не на экземпляре
```

---

## Наследование: `extends` и `super`

```javascript
class DiscountProduct extends Product {
  constructor(name, price, sku, discount) {
    super(name, price, sku); // обязательно до this в constructor
    this.discount = discount;
  }

  get displayPrice() {
    const discounted = this.price * (1 - this.discount);
    return `$${discounted.toFixed(2)}`;
  }

  describe() {
    return `${super.describe()} -${this.discount * 100}%`;
  }
}

const sale = new DiscountProduct("Keyboard", 100, "KB-1", 0.2);
console.log(sale.displayPrice); // "$80.00"
console.log(sale.describe());   // "Keyboard (KB-1) -20%"
```

**Правила `super`:**

- В `constructor` наследника — `super(...)` **до** первого обращения к `this`.
- В методах — `super.method()` вызывает реализацию родителя.

Цепочка прототипов:

```javascript
console.log(sale instanceof DiscountProduct); // true
console.log(sale instanceof Product);         // true
console.log(Object.getPrototypeOf(DiscountProduct.prototype) === Product.prototype); // true
```

---

## `instanceof` и проверка типа в runtime

```javascript
const p = new Product("A", 1, "X");
console.log(p instanceof Product); // true
console.log(p instanceof Object);  // true
```

`instanceof` смотрит на прототипы, не на «класс» в смысле интерфейса. Для duck typing часто достаточно проверить наличие методов:

```javascript
function canDescribe(obj) {
  return obj && typeof obj.describe === "function";
}
```

В TypeScript проверки переносятся на этап компиляции ([typescript-basic](../javascript-path.md)).

---

## Методы: обычные, стрелки как поля

```javascript
class Handler {
  label = "btn";

  onClick() {
    console.log(this.label);
  }

  onClickArrow = () => {
    console.log(this.label);
  };
}
```

| Вид | Где лежит | `this` при передаче как callback |
|-----|-----------|----------------------------------|
| `onClick() {}` | прототип | теряется без bind ([14-this.md](14-this.md)) |
| `onClickArrow = () => {}` | каждый экземпляр | лексический `this` класса/конструктора |

Стрелка как поле класса создаёт **новую функцию на каждом экземпляре** — дороже по памяти, но удобно для `addEventListener` без `bind`. В React class components это был типичный компромисс; в hooks — функции без `this`.

---

## Классы vs фабрики с замыканиями

**Класс** — когда нужны наследование, `instanceof`, единый прототип методов.

**Фабрика** ([12-closures.md](12-closures.md)) — когда достаточно счётчика или API без подклассов:

```javascript
function createCounter(start = 0) {
  let count = start;
  return {
    inc() { return ++count; },
    value() { return count; },
  };
}
```

| Критерий | `class` | фабрика + closure |
|----------|---------|-------------------|
| Наследование | `extends` | композиция вручную |
| Приватность | `#` | переменные в closure |
| Память методов | один на прототипе | на каждый экземпляр или общий объект |
| Знакомость | Java/C#/OOP | функциональный стиль |

В React доминируют функциональные компоненты; классы остаются в Node (ошибки, некоторые SDK), NestJS, DOM API (`classList` не класс, но OOP везде).

---

## Пример: модель для shop-трека

Упрощённый фрагмент домена mock-exams (полная лаба — [22-lab-oop.md](22-lab-oop.md)):

```javascript
class CartItem {
  constructor(productId, name, unitPrice, quantity = 1) {
    if (quantity < 1) throw new Error("quantity must be >= 1");
    if (unitPrice < 0) throw new Error("unitPrice cannot be negative");
    this.productId = productId;
    this.name = name;
    this.unitPrice = unitPrice;
    this.quantity = quantity;
  }

  lineTotal() {
    return this.unitPrice * this.quantity;
  }
}
```

Такие классы потом сериализуют в JSON для POST на FastAPI `:8090` в nodejs/react курсах.

---

## Связь с курсом

- [20-prototypes.md](20-prototypes.md) — прототипная модель под классами.
- [14-this.md](14-this.md) — методы класса и потеря `this` в колбэках.
- [22-lab-oop.md](22-lab-oop.md) — корзина, `Map`, `toJSON`.
- [29-fetch.md](29-fetch.md) — `static fromJSON` и тела запросов.
- [30-es-modules.md](30-es-modules.md) — `export class Cart` из модулей.

---

## Типичные ошибки

1. **Забыть `super()` в конструкторе наследника** — `ReferenceError: Must call super constructor`.

2. **Использовать `this` до `super()`** — та же ошибка.

3. **Стрелку как метод в объекте-литерале для `this`** — в классе поле-стрелка другое; путать с обычным методом.

4. **Ожидать глубокую приватность `_`** — это только договорённость в команде.

5. **Дублировать методы на каждом экземпляре без нужды** — лишние поля-стрелки в горячих путях.

6. **Вызывать класс без `new`** — `TypeError` по дизайну.

7. **Геттер с рекурсивным сеттером** — `set price(v) { this.price = v }` без внутреннего поля.

---

## Резюме

`class` в JavaScript — синтаксический сахар над функцией-конструктором и прототипом. Конструктор инициализирует экземпляр; методы на `ClassName.prototype`; статика — на функции. `extends` и `super` связывают цепочку прототипов. Поля `#` дают приватность; геттеры/сеттеры — контроль доступа. Выбор между классом и фабрикой зависит от наследования, памяти и стиля команды. Для API и JSON важны собственные перечисляемые поля и методы вроде `toJSON`, а не магия классов при передаче по сети.

---

## Чек-лист

- Где физически хранится метод `describe()` у `class Product`?
- Почему `super(name, price, sku)` обязателен в конструкторе наследника?
- Чем `#sku` отличается от `_sku` для внешнего кода?
- Зачем статический `fromJSON`?
- Что произойдёт при `Product()` без `new`?
- Когда поле-стрелка предпочтительнее метода на прототипе?
- Что проверяет `p instanceof Product`?

Следующий урок: [22. Лаба: OOP](22-lab-oop.md).
