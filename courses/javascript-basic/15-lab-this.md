# 15. Лаба: контекст `this`

## Цель лабораторной

На практике отработать правила из [14. `this`](14-this.md): потеря контекста при извлечении метода, исправление через вызов, `call`/`apply`, `bind`, стрелки внутри методов. После лабы баг `add(1)` → `NaN` или `TypeError` не должен повторяться в code review.

**Время:** ~35–45 минут.  
**Окружение:** Node.js LTS, `"type": "module"`.

## Подготовка

```bash
mkdir -p lab
```

Файлы:

| Файл | Назначение |
|------|------------|
| `15-lost-this.js` | калькулятор, три способа вызова |
| `15-timer.js` | `setInterval` и `this` |
| `15-emitter.js` | мини EventEmitter |

В ES modules strict mode включён по умолчанию — «голый» вызов метода даёт `this === undefined`.

---

## Задание 1. Потеря контекста

### Сценарий

Объект `calculator` передают в утилиту `runTwice(fn)`, которая вызывает `fn` дважды. Метод `add` извлекли в переменную — контекст потерян.

### Исходник

`lab/15-lost-this.js`:

```javascript
const calculator = {
  value: 0,
  add(n) {
    this.value += n;
    return this.value;
  },
  reset() {
    this.value = 0;
  },
};

console.log(calculator.add(5)); // 5

const add = calculator.add;
// console.log(add(1)); // TypeError или NaN — исправьте три способа
```

### Требование

После `calculator.add(5)` добейтесь результата **6** тремя способами (отдельные вызовы или блоки с комментариями):

1. **Прямой вызов через объект** — `calculator.add(1)`.
2. **`call` или `apply`** — `add.call(calculator, 1)`.
3. **`bind`** — создать `const boundAdd = add.bind(calculator)` и вызвать `boundAdd(1)`.

### Пошагово: почему ломается

1. `add` — ссылка на функцию без объекта.
2. `add(1)` — вызов как обычная функция → `this` = `undefined` (strict).
3. `undefined.value` → TypeError.

### Проверка

```javascript
calculator.reset();
console.log(calculator.add(5)); // 5

console.log(calculator.add(1));           // 6 — способ 1
calculator.reset(); calculator.add(5);
console.log(add.call(calculator, 1));     // 6 — способ 2
calculator.reset(); calculator.add(5);
console.log(add.bind(calculator)(1));       // 6 — способ 3
```

### Критерии

- [ ] Три способа задокументированы комментариями.
- [ ] Понимаете, какой способ создаёт **новую** функцию (bind).

---

## Задание 2. Timer с arrow

### Сценарий

Объект `timer` каждые 500 ms увеличивает `seconds`. Сейчас в `setInterval` обычная `function` — `this` не указывает на `timer`.

### Исходник

`lab/15-timer.js`:

```javascript
const timer = {
  seconds: 0,
  intervalId: null,
  start() {
    this.intervalId = setInterval(function () {
      this.seconds += 1;
      console.log(this.seconds);
    }, 500);
  },
  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  },
};

timer.start();
setTimeout(() => {
  timer.stop();
  console.log("stopped at", timer.seconds);
}, 3100);
```

### Исправления (выберите одно, остальные в комментарии)

**A. Стрелка (рекомендуется):**

```javascript
setInterval(() => {
  this.seconds += 1;
  console.log(this.seconds);
}, 500);
```

**B. `const self = this` (legacy):**

```javascript
const self = this;
setInterval(function () {
  self.seconds += 1;
}, 500);
```

**C. `bind`:**

```javascript
setInterval(function () {
  this.seconds += 1;
}.bind(this), 500);
```

### Проверка

Ожидаемый вывод (примерно): `1`, `2`, `3`, `4`, `5`, `6`, затем `stopped at 6`.  
**Обязательно** вызовите `stop()` — не оставляйте интервал в CI/терминале.

### Критерии

- [ ] `seconds` растёт при каждом тике.
- [ ] Интервал очищен через 3 с.
- [ ] В комментарии — почему стрелка видит `this` из `start`.

---

## Задание 3. EventEmitter sketch

### Сценарий

Упростённый шина событий для модулей без npm-пакета `events`. Подписчики регистрируются по имени события; `emit` вызывает все функции.

### Сигнатура

```javascript
// lab/15-emitter.js
export function createEmitter() {
  const handlers = Object.create(null);

  return {
    on(event, fn) {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(fn);
      return () => this.off(event, fn); // опционально: unsubscribe
    },
    emit(event, ...args) {
      const list = handlers[event];
      if (!list) return;
      for (const fn of list) {
        fn.apply(this, args); // this = emitter — задокументируйте
      }
    },
    off(event, fn) {
      const list = handlers[event];
      if (!list) return;
      handlers[event] = list.filter((h) => h !== fn);
    },
  };
}
```

### Документация `this` в emit

В JSDoc или комментарии укажите:

- При `emit("data", payload)` подписчик вызывается с **`this` = объект emitter** (если используете `fn.apply(this, args)`).
- Альтернатива: `this = null` в strict — тогда подписчики не должны полагаться на `this`.

Выберите один контракт и придерживайтесь его в тесте.

### Проверка

```javascript
import { createEmitter } from "./15-emitter.js";

const bus = createEmitter();
const received = [];

bus.on("order:paid", (amount) => {
  received.push(amount);
});

bus.emit("order:paid", 1999);
console.log(received); // [1999]

const log = (x) => console.log("off test", x);
bus.on("test", log);
bus.off("test", log);
bus.emit("test", 1); // не должно печатать
```

### Критерии

- [ ] `on` / `emit` / `off` работают.
- [ ] Несколько подписчиков на одно событие вызываются по порядку.
- [ ] Контракт `this` в `emit` описан в комментарии.

### Типичные ошибки

| Симптом | Причина |
|---------|---------|
| Подписчик не вызывается | Опечатка в имени события |
| `this` undefined в handler | `emit` вызывает `fn(...args)` без apply |
| Утечка памяти | Нет `off` при unmount (в React — removeListener) |

---

## Задание 4 (бонус). Метод как колбэк массива

```javascript
const repo = {
  items: [1, 2, 3],
  double(x) {
    return x * 2;
  },
};

// Исправьте: [2, 4, 6]
console.log(repo.items.map(repo.double));
```

Подсказка: `map(repo.double.bind(repo))` или `(x) => repo.double(x)`.

---

## Сводный чек-лист

- [ ] Три способа вызова `add` после извлечения метода
- [ ] Timer печатает растущие секунды и останавливается
- [ ] Emitter: on/emit/off и документированный `this`
- [ ] Можете объяснить разницу `call` vs `bind` без подсказок

## Связь с курсом

| Тема | Урок |
|------|------|
| Правила `this` | [14](14-this.md) |
| Стрелки | [10](10-functions.md) |
| Колбэки | [25](25-callbacks.md) |
| Классы React (legacy) | react-basic |
| Node EventEmitter | nodejs-basic |

## Рефлексия (1–2 предложения в комментарии в `15-lost-this.js`)

Когда в новом коде вы **не** будете использовать `bind`? (Подсказка: стрелки в колбэках внутри метода, функциональные компоненты React.)

Следующий урок: [16. Управление потоком](16-control-flow.md).
