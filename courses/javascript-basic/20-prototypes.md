# 20. Прототипы и цепочка `[[Prototype]]`

## Сценарий с работы

Вы отлаживаете баг: метод `toJSON` «внезапно» появился у простого объекта-словаря, хотя вы его не добавляли. Коллега спрашивает: «Почему `Array.prototype.map` доступен у массива, но `map` не виден в `Object.keys(arr)`?» На code review кто-то предлагает «дописать удобный метод» прямо в `Object.prototype`. На собеседовании звучит: «Как в JavaScript устроено наследование?» — и ответ «через классы ES6» только наполовину верен.

Без понимания **прототипов** вы не видите, откуда берутся встроенные методы, как работает `new` и `class`, и почему изменение глобальных прототипов ломает весь проект.

## Что вы узнаете

- Что такое внутренняя ссылка `[[Prototype]]` и чем она отличается от `prototype` у функции
- Как движок ищет свойство по **цепочке прототипов**
- Как создавать объекты с заданным прототипом через `Object.create`
- Как устроены функции-конструкторы и что делает оператор `new`
- Как наследовать поведение до появления `class`
- Чем `hasOwnProperty` / `Object.hasOwn` отличаются от оператора `in`
- Почему нельзя расширять `Array.prototype` в библиотеках
- Как прототипы связаны с уроками про объекты, `this` и классы

---

## Объекты не «пустые»: у каждого есть прототип

В JavaScript объект — это не просто хэш-таблица ключ–значение. У каждого обычного объекта есть скрытая внутренняя ссылка **`[[Prototype]]`** (в спецификации ECMAScript). Через неё объект **наследует** свойства и методы другого объекта, если у себя их не находит.

Представьте библиотеку: у вас есть полка с книгами (собственные свойства объекта). Если книги нет на полке, вы идёте в **общий каталог** (прототип) — и так далее, пока каталог не закончится.

Доступ к прототипу в современном коде:

```javascript
const animal = {
  eats: true,
  walk() {
    console.log("animal walks");
  },
};

const rabbit = Object.create(animal);
rabbit.jumps = true;

console.log(rabbit.jumps); // true — собственное свойство
rabbit.walk();               // "animal walks" — метод найден в animal
```

**Что происходит при `rabbit.walk()`:**

1. Движок ищет `walk` на самом `rabbit` — не находит.
2. Переходит по `[[Prototype]]` к `animal` — находит функцию `walk`.
3. Вызывает её с `this = rabbit` (поэтому внутри метода `this` указывает на вызывающий объект).

Это та же механика, что и для `this` в [14-this.md](14-this.md): метод «живёт» на прототипе, но `this` при вызове `rabbit.walk()` — это `rabbit`.

### Устаревший `__proto__`

В старых учебниках встречается `rabbit.__proto__ = animal`. Это **геттер/сеттер** к `[[Prototype]]`, не отдельное поле данных. В production-коде предпочитайте `Object.getPrototypeOf`, `Object.setPrototypeOf` (осторожно) и `Object.create`.

```javascript
console.log(Object.getPrototypeOf(rabbit) === animal); // true
```

---

## Цепочка прототипов: от кролика до `null`

Поиск свойства идёт по цепочке, пока не встретится `null`:

```text
rabbit  →  animal  →  Object.prototype  →  null
```

```javascript
const rabbit = Object.create(animal);

console.log(rabbit.toString()); // "[object Object]"
```

`toString` нет ни на `rabbit`, ни на `animal` — он берётся с **`Object.prototype`**, корневого прототипа почти всех объектов.

Проверка «есть ли свойство **где-то** в цепочке»:

```javascript
console.log("walk" in rabbit);   // true — унаследовано от animal
console.log("jumps" in rabbit);  // true — собственное

console.log(rabbit.hasOwnProperty("walk"));  // false
console.log(rabbit.hasOwnProperty("jumps")); // true

console.log(Object.hasOwn(rabbit, "walk"));   // false — современная замена hasOwnProperty
```

| Способ | Что проверяет |
|--------|----------------|
| `obj.key` / `obj["key"]` | Значение; `undefined` если нет (или если значение `undefined`) |
| `"key" in obj` | Ключ в объекте **или** в цепочке прототипов |
| `Object.hasOwn(obj, "key")` | Только **собственные** перечисляемые/неперечисляемые свойства |

На массивах `for...in` перебирает и унаследованные перечисляемые ключи — ещё одна причина предпочитать `for...of` и методы массива ([23-iterators-generators.md](23-iterators-generators.md)).

---

## Функции-конструкторы и `prototype`

До ES6 классов объекты с общим поведением создавали через **функции-конструкторы**:

```javascript
function User(name) {
  this.name = name; // поля экземпляра
}

User.prototype.greet = function () {
  return `Hi, ${this.name}`;
};

const ann = new User("Ann");
const bob = new User("Bob");

console.log(ann.greet()); // "Hi, Ann"
console.log(bob.greet()); // "Hi, Bob"
```

У **функции** `User` есть свойство **`User.prototype`** — объект, который станет `[[Prototype]]` у экземпляров.

```javascript
console.log(Object.getPrototypeOf(ann) === User.prototype); // true
console.log(ann.greet === bob.greet); // true — один метод на прототипе, не копия на каждом экземпляре
```

Экономия памяти: методы на прототипе, данные (`name`) — на экземпляре.

### Что делает `new` (пошагово)

Когда вы пишете `new User("Ann")`, движок примерно:

1. Создаёт новый пустой объект.
2. Устанавливает его `[[Prototype]]` равным `User.prototype`.
3. Вызывает `User` как обычную функцию с `this`, указывающим на этот объект.
4. Если `User` не вернула другой объект, возвращает созданный экземпляр.

Эквивалент «вручную» (для понимания, не для копирования в код):

```javascript
function manualNew(Constructor, ...args) {
  const obj = Object.create(Constructor.prototype);
  const result = Constructor.apply(obj, args);
  return result instanceof Object ? result : obj;
}
```

Если забыть `new`, `this` внутри конструктора будет не тем (часто `undefined` в модулях), и поля «повиснут» в глобале или вы получите ошибку.

```javascript
function Broken() {
  this.x = 1;
}
// const b = Broken(); // TypeError в strict / мусор в global в non-strict
const ok = new Broken();
```

---

## Наследование через прототипы (до `class`)

Допустим, нужен `Admin`, расширяющий `User`:

```javascript
function Admin(name, level) {
  User.call(this, name); // «вызвать родительский конструктор» на этом экземпляре
  this.level = level;
}

Admin.prototype = Object.create(User.prototype);
Admin.prototype.constructor = Admin;

Admin.prototype.describe = function () {
  return `${this.greet()}, level ${this.level}`;
};

const root = new Admin("Root", 99);
console.log(root.describe()); // "Hi, Root, level 99"
console.log(root instanceof User);  // true
console.log(root instanceof Admin); // true
```

**Почему `Admin.prototype = Object.create(User.prototype)`, а не `= User.prototype`?**

Второй вариант **мутирует** общий прототип `User` при добавлении методов `Admin`. Первый создаёт промежуточный объект-звено цепочки.

Синтаксис `class Admin extends User` делает то же самое, но безопаснее и читабельнее — [21-classes.md](21-classes.md).

---

## `instanceof` и прототипы

```javascript
console.log(ann instanceof User);   // true
console.log(ann instanceof Object); // true

console.log([] instanceof Array);   // true
console.log([] instanceof Object);  // true
```

`instanceof` проверяет, есть ли `Constructor.prototype` в цепочке `[[Prototype]]` объекта. Это не проверка «типа» в смысле TypeScript — только связь прототипов.

Практика: для plain objects чаще проверяют форму данных (поля, Zod в typescript-basic), а не `instanceof Object`.

---

## Встроенные прототипы: откуда `map`, `slice`, `trim`

| Конструктор | Прототип экземпляра | Примеры методов |
|-------------|---------------------|-----------------|
| `Array` | `Array.prototype` | `map`, `filter`, `push` |
| `Object` | `Object.prototype` | `toString`, `hasOwnProperty` |
| `String` | `String.prototype` | `trim`, `slice` |
| `Function` | `Function.prototype` | `call`, `apply`, `bind` |

```javascript
const nums = [1, 2, 3];
console.log(Object.getPrototypeOf(nums) === Array.prototype); // true

console.log(Object.keys(nums)); // ["0", "1", "2"] — только собственные индексы
console.log("map" in nums);     // true — метод на Array.prototype
```

Примитивы при обращении к свойствам **временно оборачиваются** объектами (boxing):

```javascript
const s = "  hi  ";
console.log(s.trim()); // "hi" — вызов String.prototype.trim
```

### Не расширяйте чужие прототипы

```javascript
// НИКОГДА так в библиотеке или общем коде
Array.prototype.last = function () {
  return this[this.length - 1];
};
```

Если два пакета добавят `last` по-разному, или итерация сломается, или полифиллы конфликтуют. В своём коде — обычные функции или классы.

---

## `Object.create(null)` — словарь без наследования

```javascript
const dict = Object.create(null);
dict.count = 1;

console.log(dict.toString); // undefined — нет Object.prototype
console.log("toString" in dict); // false
```

Удобно для **чистых map-подобных** структур, где ключи могут быть `"constructor"` или `"__proto__"` без сюрпризов. В современном коде часто достаточно `Map` ([34-map-set.md](34-map-set.md)).

---

## `class` — синтаксический сахар над прототипами

```javascript
class User {
  constructor(name) {
    this.name = name;
  }
  greet() {
    return `Hi, ${this.name}`;
  }
}

console.log(typeof User); // "function"
console.log(User.prototype.greet); // function — метод на прототипе
```

Классы **не** копируют модель C++/Java с отдельными таблицами виртуальных методов. Под капотом — те же прототипы и `[[Prototype]]`. Отличия в синтаксисе: `class` тело в strict mode, методы неперечисляемы, `new` обязателен.

Сравнение подходов:

| Подход | Когда уместен |
|--------|----------------|
| Литерал `{}` + `Object.create` | Простые объекты, один-off |
| Фабрика + closure ([12-closures.md](12-closures.md)) | Приватное состояние без `#` |
| Конструктор + `.prototype` | Легаси, чтение старого кода |
| `class` | Новый OOP-код, наследование, `extends` |

---

## Связь с курсом

- [07-objects.md](07-objects.md) — собственные свойства и ссылки; прототип объясняет, откуда берутся «лишние» методы.
- [14-this.md](14-this.md) — при вызове `obj.method()` метод может жить на прототипе, но `this` — `obj`.
- [21-classes.md](21-classes.md) — современный синтаксис поверх той же модели.
- [22-lab-oop.md](22-lab-oop.md) — практика: корзина, `instanceof`, `getPrototypeOf`.
- Дальше по треку: TypeScript добавит **статические** типы; runtime-наследование останется прототипным.

В экосистеме mock-exams модели FastAPI/Django сериализуются в JSON — **прототипы при передаче по сети не участвуют**. `JSON.stringify` видит только собственные перечисляемые данные.

---

## Типичные ошибки

1. **Путать `__proto__` и `prototype`.** `__proto__` (лучше `getPrototypeOf`) — у **экземпляра**. `prototype` — у **функции-конструктора** (кроме стрелок и async function как конструкторов).

2. **Мутировать `Object.prototype` или `Array.prototype`.** Ломаете весь runtime и сторонние библиотеки.

3. **Думать, что `class` — другая модель наследования.** Это обёртка; на собеседовании ждут объяснение через цепочку прототипов.

4. **Проверять методы через `Object.keys`.** На прототипе — используйте `in` или прямой доступ.

5. **Забыть `User.call(this, ...)` в конструкторе наследника** (старый стиль) или `super(...)` в `class` — экземпляр без полей родителя.

6. **Присвоить `Child.prototype = Parent.prototype`.** Общий объект прототипа — методы дочернего класса перезапишут родительские для всех.

---

## Резюме

Наследование в JavaScript — **делегирование через цепочку `[[Prototype]]`**, а не копирование классов. Объект ищет свойство у себя, затем у прототипа, и так до `null`. Функции-конструкторы задают общее поведение через `Constructor.prototype`; `new` связывает экземпляр с этим прототипом. `instanceof` и `in` смотрят на цепочку; `Object.hasOwn` — только на собственные ключи. Классы ES6 — удобный синтаксис над той же механикой. Встроенные методы массивов и объектов живут на встроенных прототипах — их не трогают в прикладном коде.

---

## Чек-лист

- Объясните разницу между `[[Prototype]]` у объекта и `prototype` у функции-конструктора
- Проследите цепочку поиска `toString` у объекта `{}`
- Что делает `new User("Ann")` в четырех шагах?
- Чем `Object.create(animal)` лучше присваивания `__proto__` в учебных примерах?
- Почему `ann.greet === bob.greet` для экземпляров одного конструктора?
- Зачем `Object.create(null)` для словарей?
- Что проверяет `instanceof` — и чего не проверяет?

Следующий урок: [21. Классы ES6](21-classes.md).
