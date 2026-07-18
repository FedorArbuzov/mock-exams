# 34. Map, Set, WeakMap, WeakSet

## Сценарий с работы

Эндпоинт возвращает 10 000 заказов; нужно **сгруппировать по `customerId`** и убрать дубликаты тегов. Джун пишет:

```javascript
const cache = {};
cache[userObj] = profile; // [object Object] как ключ — баг
```

Старший предлагает `Map`. В другом тикете: «утечка памяти» — глобальный `Map` держит ссылки на DOM-узлы после удаления из документа; ревью предлагает `WeakMap`.

`Object`, `Map` и `Set` решают похожие задачи, но с **разной семантикой**. Эта глава — когда что выбирать и как не стрелять себе в ногу.

## Map — ассоциативная коллекция с любым ключом

```javascript
const byId = new Map();

byId.set(1, { name: "Ann", role: "admin" });
byId.set("1", { name: "Bob", role: "user" }); // другой ключ!
byId.set(true, { name: "Flag" });

console.log(byId.get(1));    // Ann
console.log(byId.get("1"));    // Bob
console.log(byId.size);        // 3
```

Ключи сравниваются по **SameValueZero** (как `===`, но `NaN` равен `NaN`).

### Объект как ключ — по ссылке

```javascript
const user = { id: 7 };
const meta = new Map();

meta.set(user, { lastLogin: "2024-06-18" });

console.log(meta.get(user)); // работает

const otherRef = { id: 7 };
console.log(meta.get(otherRef)); // undefined — другой объект!
```

Именно поэтому `obj[someObject]` в plain object **не работает** как ожидают: ключ приводится к строке `"[object Object]"`.

### Основной API Map

| Метод | Действие |
|-------|----------|
| `set(key, value)` | добавить/обновить |
| `get(key)` | получить или `undefined` |
| `has(key)` | есть ли ключ |
| `delete(key)` | удалить, вернуть boolean |
| `clear()` | очистить |
| `size` | количество записей |

```javascript
const m = new Map([["a", 1], ["b", 2]]); // из iterable пар

for (const [key, value] of m) {
  console.log(key, value);
}

for (const key of m.keys()) { /* ... */ }
for (const value of m.values()) { /* ... */ }

m.forEach((value, key) => {
  console.log(key, value);
});
```

**Порядок итерации** — порядок вставки (ES2015+).

## Map vs обычный Object

| Критерий | `Map` | `Object` |
|----------|-------|----------|
| Ключи | любой тип | string, Symbol |
| Размер | `.size` O(1) | `Object.keys().length` |
| Частые add/delete | оптимизирован | медленнее |
| JSON.stringify | не сериализуется напрямую | да |
| Прототип | чистая коллекция | может иметь унаследованные ключи |
| Итерация | встроенная | `Object.entries` |

**Object** — когда фиксированная «запись» (DTO, config literal):

```javascript
const user = { name: "Ann", age: 30 };
```

**Map** — индекс, кэш, группировка с динамическими ключами:

```javascript
const sessions = new Map(); // sessionId -> Session
```

## Set — множество уникальных значений

```javascript
const tags = new Set(["js", "web", "js", "api"]);

tags.add("node");
tags.add("js"); // дубликат игнорируется

console.log(tags.size);       // 4
console.log(tags.has("web")); // true

tags.delete("web");
```

### Дедупликация массива

```javascript
const ids = [1, 2, 2, 3, 1, 4];
const unique = [...new Set(ids)];
// [1, 2, 3, 4]
```

### Операции над множествами (вручную)

```javascript
function union(a, b) {
  return new Set([...a, ...b]);
}

function intersection(a, b) {
  return new Set([...a].filter((x) => b.has(x)));
}

function difference(a, b) {
  return new Set([...a].filter((x) => !b.has(x)));
}
```

Set сравнивает **примитивы по значению**, **объекты по ссылке**:

```javascript
const s = new Set();
s.add({ id: 1 });
s.add({ id: 1 });
console.log(s.size); // 2 — два разных объекта
```

## Паттерн groupBy с Map

Задача из аналитики: сгруппировать товары по категории.

```javascript
function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(item);
  }
  return map;
}

const products = [
  { id: 1, name: "Keyboard", category: "electronics" },
  { id: 2, name: "Mouse", category: "electronics" },
  { id: 3, name: "Desk", category: "furniture" },
];

const byCategory = groupBy(products, (p) => p.category);

for (const [category, list] of byCategory) {
  console.log(category, list.length);
}
```

ES2024 добавил `Object.groupBy` / `Map.groupBy` — в старых Node проверяйте [node.green](https://node.green); паттерн с `Map` универсален.

## Map в модели предметной области

Из [22-lab-oop.md](22-lab-oop.md) — корзина с `Map`:

```javascript
class Cart {
  #items = new Map(); // productId -> CartItem

  add(item) {
    const existing = this.#items.get(item.productId);
    if (existing) {
      existing.increase(item.quantity);
    } else {
      this.#items.set(item.productId, item);
    }
  }

  get size() {
    return this.#items.size;
  }
}
```

`Map` быстрее для частых `get/set/delete` по произвольному ключу, чем `Object` с числовыми id.

## WeakMap — слабые ключи-объекты

```javascript
const privateData = new WeakMap();

function attachSecret(obj, secret) {
  privateData.set(obj, secret);
}

function readSecret(obj) {
  return privateData.get(obj);
}

const user = { name: "Ann" };
attachSecret(user, "token-xyz");
readSecret(user); // token-xyz
```

Свойства WeakMap:

- ключи **только объекты** (не примитивы);
- **слабая** ссылка — если объект больше нигде не используется, GC **может** собрать запись;
- **нет** итерации, **нет** `.size`;
- не сериализуется.

Типичные кейсы:

- метаданные DOM-элементов;
- приватные поля до `#` в классах;
- кэш, привязанный к lifetime объекта.

```javascript
// кэш результатов для объектов запроса
const resultCache = new WeakMap();

function expensiveCompute(requestObj) {
  if (resultCache.has(requestObj)) {
    return resultCache.get(requestObj);
  }
  const result = doWork(requestObj);
  resultCache.set(requestObj, result);
  return result;
}
// когда requestObj GC — запись в WeakMap исчезнет
```

## WeakSet

```javascript
const visited = new WeakSet();

function walk(node) {
  if (visited.has(node)) return;
  visited.add(node);
  // обход соседей...
}
```

Хранит **только объекты**, слабые ссылки, без итерации. Реже WeakMap — маркировка «уже обработан» в обходе графа.

## Конвертация Map ↔ Object / Array

```javascript
const map = new Map([["a", 1], ["b", 2]]);

// Map → массив пар
const entries = [...map.entries()];
// или [...map]

// Map → Object (ключи строковые!)
const obj = Object.fromEntries(map);

// Object → Map
const map2 = new Map(Object.entries({ x: 10, y: 20 }));
```

**Осторожно:** `Object.fromEntries` теряет ключи не-string/Symbol.

## Сериализация

```javascript
const map = new Map([[1, "one"]]);
JSON.stringify(map); // "{}" — пустой объект!

// обходной путь
JSON.stringify([...map.entries()]); // [[1,"one"]]
```

Для API и файлов чаще используют plain objects или массивы, не Map.

## Связь с другими уроками

| Урок | Связь |
|------|-------|
| [07-objects.md](07-objects.md) | Object как record |
| [08-arrays.md](08-arrays.md) | `[...set]` для dedupe |
| [23-iterators-generators.md](23-iterators-generators.md) | Map/Set итерируемы |
| [37-lab-collections.md](37-lab-collections.md) | groupBy, parseLog |

## Типичные ошибки

- **Object как ключ plain object** — все ключи схлопываются в `"[object Object]"`.
- **Глобальный Map кэша без eviction** — утечка памяти; для long-lived процесса нужен TTL или WeakMap.
- **Дедуп объектов через Set** — дубликаты по содержимому не удалятся, только по ссылке.
- **Путать `map.get("1")` и `map.get(1)`** — разные ключи.
- **Искать `.length` у Map** — нужно `.size`.
- **JSON.stringify(Map)** — ожидать данные в файле.

## Чек-лист

- Когда **Map**, когда plain **Object**?
- Почему `map.get("1")` и ключ `1` — разные записи?
- Как убрать дубликаты из массива через **Set**?
- Чем **WeakMap** отличается от **Map** (GC, итерация, ключи)?
- Как реализовать **groupBy** с Map?
- Почему Set не dedupe объекты `{ id: 1 }` и `{ id: 1 }`?

Следующий урок: [35. RegExp, JSON, Date](35-regex-json-date.md).
