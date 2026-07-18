# 22. Лаба: модель предметной области (OOP)

## Сценарий

Вы пишете клиентскую логику для shop-трека mock-exams: корзина, позиции, итоговая сумма, подготовка JSON для POST на FastAPI `:8090` ([29-fetch.md](29-fetch.md)). Нужна **предметная модель** с валидацией, без «магических» объектов `{ id, qty }` без методов. В этом уроке вы закрепите [20-prototypes.md](20-prototypes.md) и [21-classes.md](21-classes.md) на практике.

## Что вы сделаете

- Реализуете `CartItem` с валидацией и расчётом суммы строки
- Реализуете `Cart` на `Map` с приватным хранилищем
- Подготовите `toJSON()` для сериализации
- (Опционально) сравните с фабрикой на замыканиях
- Проверите `instanceof` и цепочку прототипов

**Время:** ~45–60 минут.  
**Где код:** `courses/javascript-basic/examples/lab/` или свой каталог с `"type": "module"`.

---

## Подготовка

```bash
cd courses/javascript-basic/examples
node --version   # LTS 18+
```

Создайте файлы:

```text
lab/
  cart-item.js
  cart.js
  22-proto.js      # демо прототипов
  22-demo.js       # сценарий использования
```

---

## Задание 1. Класс `CartItem`

Файл `cart-item.js`:

```javascript
export class CartItem {
  constructor(productId, name, unitPrice, quantity = 1) {
    // TODO: валидация
    // quantity >= 1, unitPrice >= 0, непустые productId и name
  }

  lineTotal() {
    // unitPrice * quantity
  }

  increase(q = 1) {
    // увеличить quantity на q, снова проверить >= 1
    // return this для chaining (опционально)
  }

  decrease(q = 1) {
    // уменьшить, но quantity не ниже 1 — иначе throw
  }
}
```

### Требования

| Правило | Поведение |
|---------|-----------|
| `quantity < 1` при создании | `throw new Error(...)` |
| `unitPrice < 0` | `throw new Error(...)` |
| пустой `productId` или `name` | `throw new Error(...)` |
| `lineTotal()` | число, не строка |

### Пример использования (проверьте в `22-demo.js`)

```javascript
import { CartItem } from "./cart-item.js";

const item = new CartItem("SKU-1", "Keyboard", 79.99, 2);
console.log(item.lineTotal()); // 159.98

item.increase(1);
console.log(item.quantity);    // 3

try {
  new CartItem("x", "Bad", -1);
} catch (e) {
  console.log("caught:", e.message);
}
```

### Подсказки

- Сообщения ошибок должны быть **понятными** («quantity must be >= 1»).
- `increase`/`decrease` могут возвращать `this` для цепочки: `item.increase(2).increase(1)`.

---

## Задание 2. Класс `Cart`

Файл `cart.js`:

```javascript
import { CartItem } from "./cart-item.js";

export class Cart {
  #items = new Map(); // productId -> CartItem

  add(item) {
    // если item не CartItem — throw
    // если productId уже есть — увеличить quantity существующего
    // иначе положить в Map
  }

  remove(productId) {
    // удалить позицию; если нет — тихо или throw (выберите и задокументируйте)
  }

  get(productId) {
    // вернуть CartItem или undefined
  }

  total() {
    // сумма lineTotal() всех позиций
  }

  get size() {
    // число уникальных productId
  }

  toJSON() {
    // массив plain objects для API:
    // [{ productId, name, unitPrice, quantity, lineTotal }, ...]
  }

  *[Symbol.iterator]() {
    // опционально: for (const item of cart) — см. урок 23
    for (const item of this.#items.values()) {
      yield item;
    }
  }
}
```

### Сценарий merge при повторном `add`

```javascript
const cart = new Cart();
cart.add(new CartItem("A", "Mouse", 25, 1));
cart.add(new CartItem("A", "Mouse", 25, 2)); // тот же productId
console.log(cart.get("A").quantity); // 3, не две строки
```

### `toJSON` и FastAPI

Формат должен быть готов к `JSON.stringify(cart)`:

```javascript
const payload = JSON.stringify(cart);
// отправка: await fetch("http://localhost:8090/...", { method: "POST", body: payload })
```

Поле `lineTotal` в JSON удобно для отображения; сервер может пересчитать цену сам.

---

## Задание 3. Демо-сценарий `22-demo.js`

```javascript
import { Cart } from "./cart.js";
import { CartItem } from "./cart-item.js";

const cart = new Cart();
cart.add(new CartItem("KB-1", "Keyboard", 99, 1));
cart.add(new CartItem("MS-1", "Mouse", 29, 2));
cart.add(new CartItem("KB-1", "Keyboard", 99, 1)); // merge

console.log("size:", cart.size);
console.log("total:", cart.total());
console.log(JSON.stringify(cart, null, 2));
```

Запуск:

```bash
node lab/22-demo.js
```

Сверьте `total` вручную: Keyboard 99×2 + Mouse 29×2 = 198 + 58 = 256 (если merge KB-1 дал quantity 2).

---

## Задание 4. Прототипы — `22-proto.js`

Покажите связь класса с прототипом ([20-prototypes.md](20-prototypes.md)):

```javascript
import { Cart } from "./cart.js";

const cart = new Cart();

console.log(cart instanceof Cart); // true
console.log(Object.getPrototypeOf(cart) === Cart.prototype); // true
console.log("add" in cart);              // true — метод на прототипе
console.log(Object.hasOwn(cart, "add")); // false
```

Добавьте комментарий: где физически лежит метод `add` и почему `instanceof Cart` true.

---

## Задание 5. (Опционально) Фабрика без классов

Файл `cart-factory.js`:

```javascript
export function createCart() {
  const items = new Map();
  return {
    add(item) { /* тот же контракт */ },
    total() { /* ... */ },
    toJSON() { /* ... */ },
  };
}
```

В комментарии внизу файла сравните **~строк кода** и ответьте:

- Где проще приватность (`#items` vs `Map` в closure)?
- Нужен ли вам `instanceof` в проекте?
- Что выберете для shop-клиента и почему?

---

## Критерии успеха

- [ ] Отрицательная цена или `quantity < 1` при создании бросает `Error`
- [ ] Повторный `add` с тем же `productId` **увеличивает** quantity, не дублирует ключ
- [ ] `total()` совпадает с ручным расчётом
- [ ] `toJSON()` / `JSON.stringify(cart)` даёт валидный JSON-массив без циклических ссылок
- [ ] `22-proto.js` с комментарием про прототип
- [ ] (Опционально) фабрика с сравнением в комментарии

---

## Типичные ошибки в лабе

1. **Хранить позиции в массиве** — сложный merge; `Map` по `productId` проще.

2. **Забыть проверку `item instanceof CartItem` в `add`** — в корзину попадут plain objects без `lineTotal`.

3. **`toJSON` возвращает Map** — `JSON.stringify` даст `{}`; нужен массив или plain object.

4. **Путать `size` корзины с общим `quantity`** — size = число SKU, не сумма штук.

5. **Мутировать входной `CartItem` при merge без копирования** — если один item в двух корзинах, баг; для лабы достаточно merge quantity в существующем объекте в Map.

---

## Связь с курсом

- Теория: [20-prototypes.md](20-prototypes.md), [21-classes.md](21-classes.md), [23-iterators-generators.md](23-iterators-generators.md) (итератор корзины).
- Дальше: HTTP — [29-fetch.md](29-fetch.md), стенд [deploy/fastapi](../../deploy/fastapi/README.md).
- Модули: [30-es-modules.md](30-es-modules.md) — `export class`.

---

## Резюме лабы

Вы построили маленький доменный слой: валидация в конструкторе, инкапсуляция через `#items`, сериализация для API. Это тот же подход, что в backend-слоях FastAPI, только на клиенте до отправки `fetch`.

---

## Чек-лист перед сдачей

- Запускается ли `node lab/22-demo.js` без ошибок?
- Есть ли тестовые `try/catch` на невалидные данные?
- Понятны ли сообщения `Error`?
- Готов ли JSON к POST на `:8090` (поля и типы)?

Следующий урок: [23. Итераторы и генераторы](23-iterators-generators.md).
