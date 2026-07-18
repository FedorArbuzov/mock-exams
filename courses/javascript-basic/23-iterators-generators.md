# 23. Итераторы, `for...of`, генераторы

## Сценарий с работы

Нужно пройти по страницам API, не загружая все 10 000 записей в массив сразу. В логах `for...in` по массиву выводит лишние ключи. Коллега пишет «свой iterable» для диапазона дат, но `for...of` падает с `object is not iterable`. В Redux-saga и некоторых библиотеках встречается `function*` — без понимания генераторов код кажется магией.

Итераторы — **единый протокол** обхода коллекций. Генераторы — удобный способ писать итераторы с паузами и ленивым вычислением.

## Что вы узнаете

- Разницу между **iterable** и **iterator**
- Протокол `Symbol.iterator` и результат `next()`
- Почему `for...of` безопаснее `for...in` для массивов
- Как сделать свой iterable (диапазон, дерево, пагинация)
- Синтаксис `function*`, `yield`, `yield*`
- Когда ленивая последовательность выгоднее массива
- Обзор async-итераторов и `for await...of`
- Связь со spread, деструктуризацией и встроенными типами

---

## Iterable и iterator: два уровня протокола

**Iterable** — объект, у которого есть метод `[Symbol.iterator]()`, возвращающий **iterator**.

**Iterator** — объект с методом `next()`, который возвращает `{ value, done }`.

```javascript
const arr = [10, 20, 30];
const iterator = arr[Symbol.iterator]();

console.log(iterator.next()); // { value: 10, done: false }
console.log(iterator.next()); // { value: 20, done: false }
console.log(iterator.next()); // { value: 30, done: false }
console.log(iterator.next()); // { value: undefined, done: true }
```

Массив — iterable; вызов `[Symbol.iterator]()` даёт итератор по элементам.

Встроенные iterable в современном JS: `Array`, `String`, `Map`, `Set`, `TypedArray`, аргументы функции, `NodeList` в DOM, и др.

---

## Что запускает iterable: `for...of`, spread, `Array.from`

```javascript
const letters = ["a", "b", "c"];

for (const ch of letters) {
  console.log(ch); // a, b, c по очереди
}

console.log([...letters]); // ["a", "b", "c"]
console.log(Array.from(letters)); // то же
```

`for...of` внутри:

1. Берёт `letters[Symbol.iterator]()`.
2. Вызывает `next()` до `done: true`.
3. Присваивает `value` переменной цикла.

**Строка** — iterable по Unicode code units (суррогатные пары эмодзи — отдельная тема; для символов есть `for...of` с итератором по graphemes в новых API).

```javascript
for (const ch of "hi") {
  console.log(ch); // "h", "i"
}
```

---

## `for...of` vs `for...in`

```javascript
const obj = { a: 1, b: 2 };
const list = [10, 20];

for (const key in obj) {
  console.log(key); // "a", "b" — перечисляемые ключи
}

for (const key in list) {
  console.log(key); // "0", "1" и возможно унаследованные ключи с массива!
}

for (const value of list) {
  console.log(value); // 10, 20 — только элементы
}
```

| Цикл | Подходит для | Перебирает |
|------|--------------|------------|
| `for...in` | plain objects (осторожно) | строковые ключи, включая унаследованные |
| `for...of` | iterable | значения по протоколу итератора |
| `for (let i=0; ...)` | массивы с индексом | индексы |

Plain object `{}` **не iterable** по умолчанию — `for...of` по нему выбросит `TypeError`. Ключи — `Object.keys` / `Object.entries`.

```javascript
for (const [key, value] of Object.entries(obj)) {
  console.log(key, value);
}
```

---

## Собственный iterable: диапазон чисел

```javascript
const range = {
  from: 1,
  to: 5,

  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;

    return {
      next() {
        if (current <= last) {
          return { value: current++, done: false };
        }
        return { done: true };
      },
    };
  },
};

for (const n of range) {
  console.log(n); // 1, 2, 3, 4, 5
}

console.log([...range]); // [1, 2, 3, 4, 5]
```

`this` внутри `[Symbol.iterator]` — сам объект `range`; замыкание `current` хранит состояние обхода.

Можно вернуть `value: undefined` при `done: true` — обычно игнорируется.

---

## Генераторы: `function*` и `yield`

Генераторная функция возвращает **итератор** автоматически:

```javascript
function* idGenerator() {
  let id = 1;
  while (true) {
    yield id++;
  }
}

const gen = idGenerator();
console.log(gen.next().value); // 1
console.log(gen.next().value); // 2
console.log(gen.next().value); // 3
```

`yield`:

- **Приостанавливает** выполнение функции.
- Сохраняет локальные переменные и точку входа.
- Возвращает `{ value: ..., done: false }` (пока не вышли из функции).

Когда генератор завершается (return или конец), следующий `next()` даёт `{ done: true }`.

### Конечный генератор

```javascript
function* threeSteps() {
  yield "first";
  yield "second";
  return "done";
}

const g = threeSteps();
console.log(g.next()); // { value: "first", done: false }
console.log(g.next()); // { value: "second", done: false }
console.log(g.next()); // { value: "done", done: true }
```

Значение из `return` попадает в последний `value` с `done: true`.

### Переписываем range через генератор

```javascript
function* rangeGen(from, to) {
  for (let i = from; i <= to; i++) {
    yield i;
  }
}

for (const n of rangeGen(2, 4)) {
  console.log(n); // 2, 3, 4
}
```

Код короче, чем ручной объект с `next`.

---

## `yield*` — делегирование другому iterable

```javascript
function* concat(a, b) {
  yield* a;
  yield* b;
}

console.log([...concat([1, 2], ["x"])]); // [1, 2, "x"]
```

`yield*` разворачивает вложенный iterable в текущий генератор — удобно для деревьев и вложенных списков.

```javascript
function* walkTree(node) {
  yield node.value;
  for (const child of node.children) {
    yield* walkTree(child);
  }
}
```

---

## Ленивые последовательности: зачем не массив

```javascript
function* readPages(totalPages) {
  for (let page = 1; page <= totalPages; page++) {
  // имитация запроса — в реальности await fetch(...)
    yield { page, items: [`item-${page}-1`, `item-${page}-2`] };
  }
}

for (const chunk of readPages(3)) {
  console.log(chunk.page, chunk.items.length);
  // обрабатываем страницу, не держа все страницы в памяти
}
```

Массив `allItems` на 10 000 элементов занимает память сразу; генератор отдаёт по одной порции.

В nodejs-курсах тот же приём для **streams** и async generators с `yield` после `await`.

---

## Iterable на классе

```javascript
class Team {
  #members = [];

  add(name) {
    this.#members.push(name);
  }

  *[Symbol.iterator]() {
    for (const name of this.#members) {
      yield name;
    }
  }
}

const team = new Team();
team.add("Ann");
team.add("Bob");

for (const name of team) {
  console.log(name); // Ann, Bob
}
```

Связь с [21-classes.md](21-classes.md): метод может быть генератором.

---

## Map и Set: iterable пар и значений

```javascript
const map = new Map([["a", 1], ["b", 2]]);

for (const [key, value] of map) {
  console.log(key, value);
}

for (const value of map.values()) {
  console.log(value);
}
```

Порядок обхода — порядок вставки ([34-map-set.md](34-map-set.md)).

---

## Async iterators (обзор)

Для асинхронных источников — протокол с `Symbol.asyncIterator` и `for await...of`:

```javascript
async function* fetchPages(urls) {
  for (const url of urls) {
    const res = await fetch(url);
    yield await res.json();
  }
}

// for await (const page of fetchPages(list)) { ... }
```

Подробности — в [27-async-await.md](27-async-await.md) и nodejs-basic (streams). Синтаксис похож на генераторы, но каждый шаг может ждать Promise.

---

## Где встречается в индустрии

- **Пагинация API** — async generator вместо рекурсивных колбэков.
- **Redux-saga** — `function*` для описания побочных эффектов (исторический стек).
- **Итерация DOM** — `document.querySelectorAll` в современных браузерах iterable.
- **React** — не генераторы, но идея «ленивого» обхода children через итераторы в reconciler (внутренности).

---

## Связь с курсом

- [08-arrays.md](08-arrays.md) — массив iterable; методы `map`/`filter` создают новые массивы, генератор — ленивую цепочку.
- [16-control-flow.md](16-control-flow.md) — циклы; `for...of` — предпочтительный обход iterable.
- [24-event-loop.md](24-event-loop.md) — async iterators и microtasks при `await` внутри генератора.
- [29-fetch.md](29-fetch.md) — постраничная загрузка с FastAPI `:8090`.

---

## Типичные ошибки

1. **Забыть `[Symbol.iterator]`** — объект не iterable, spread и `for...of` падают.

2. **`for...in` по массиву** — индексы строками и унаследованные свойства.

3. **Бесконечный генератор без выхода** — `while(true)` без `break` в потребителе держит состояние вечно.

4. **Повторный обход одноразового итератора** — итератор исчерпывается; для второго прохода нужен новый `[Symbol.iterator]()`.

5. **Мутировать коллекцию во время `for...of`** — непредсказуемое поведение (особенно Map/Set).

6. **Путать `yield` и `return` в генераторе** — только `return` завершает с финальным `value` и `done: true`.

---

## Резюме

**Iterable** предоставляет `[Symbol.iterator]()`, **iterator** — `next()` с `{ value, done }`. `for...of`, spread и `Array.from` используют этот протокол. Для объектов-словарей — `Object.entries`, не `for...of` напрямую. Генераторы `function*` пишут итераторы с `yield` и сохранением состояния между шагами. Ленивые последовательности экономят память при больших или бесконечных данных. Async iterators расширяют модель на `await` между шагами.

---

## Чек-лист

- Чем iterable отличается от iterator?
- Что вернёт четвёртый `next()` у итератора массива `[1,2]`?
- Почему `for...in` опасен для массивов?
- Как сделать объект `{ from: 1, to: 3 }` обходимым в `for...of`?
- Что делает `yield*`?
- Зачем генератор вместо `Array.from({ length: n }, (_, i) => i)`?
- Что такое `for await...of` в двух словах?

Следующий урок: [24. Event loop](24-event-loop.md).
