# 13. Лаба: closures и фабрики

## Цель лабораторной

Закрепить [12. Замыкания](12-closures.md) на практике: приватное состояние в closure, фабрики функций, исправление классического бага цикла с `var`. После лабы вы должны уверенно объяснить, **какое** окружение удерживает каждая возвращённая функция и почему.

**Время:** ~40–50 минут.  
**Окружение:** Node.js LTS, ES modules (`"type": "module"` в `package.json` или расширение `.mjs`).

## Подготовка

Создайте каталог `lab/` рядом с уроками или в корне учебного проекта:

```bash
mkdir -p lab
cd lab
npm init -y
```

В `package.json` добавьте `"type": "module"`. Файлы заданий:

| Файл | Экспорт |
|------|---------|
| `13-rate-limit.js` | `createRateLimiter` |
| `13-memoize.js` | `memoize` (можно скопировать заготовку из задания 2) |
| `13-stack.js` | `createStack` |
| `13-loop-trap.js` | исправленный скрипт (можно без export) |

Запуск проверки: `node 13-loop-trap.js` или `node --experimental-vm-modules` при необходимости.

---

## Задание 1. Rate limiter (упрощённый)

### Сценарий

Внутренний скрипт дергает платный API не чаще **2 раз в 5 секунд**. Нужна фабрика `createRateLimiter(maxCalls, windowMs)`, возвращающая функцию `check()`:

- `true` — вызов разрешён, учитывается в окне;
- `false` — лимит исчерпан, вызов **не** учитывается.

### Сигнатура

```javascript
// lab/13-rate-limit.js
export function createRateLimiter(maxCalls, windowMs) {
  // TODO: closure с массивом timestamps (или счётчиком в окне)
  return function check() {
    // ...
  };
}
```

### Пошаговая подсказка

1. В closure храните массив **временных меток** успешных `check()` (те, что вернули `true`).
2. При каждом `check()` отфильтруйте метки: оставьте только те, что `Date.now() - t < windowMs`.
3. Если длина массива `< maxCalls` — `push(Date.now())`, верните `true`.
4. Иначе верните `false`.

### Пример ручной проверки

```javascript
import { createRateLimiter } from "./13-rate-limit.js";

const check = createRateLimiter(2, 5000);

console.log(check(), check(), check());
// ожидается: true, true, false

setTimeout(() => console.log(check()), 5100);
// после окна снова true
```

### Критерии

- [ ] Первые `maxCalls` вызовов в окне возвращают `true`.
- [ ] Следующий в том же окне — `false`.
- [ ] После истечения `windowMs` слот освобождается.
- [ ] Состояние не хранится в global — только в closure.

### Типичные ошибки

| Симптом | Причина |
|---------|---------|
| Всегда `true` | Не удаляете старые timestamps |
| Всегда `false` | Не очищаете окно / неверное сравнение времени |
| Лимит «навсегда» | Счётчик в module scope, а не в factory |

---

## Задание 2. Memoize

### Сценарий

Тяжёлый расчёт цены корзины вызывается из UI многократно с теми же аргументами. Оберните функцию в `memoize`, чтобы повторный вызов с теми же args брал результат из кэша.

### Заготовка

```javascript
// lab/13-memoize.js
export function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
```

### Проверка

```javascript
import { memoize } from "./13-memoize.js";

const slowSquare = memoize((n) => {
  console.log("computing", n);
  return n * n;
});

slowSquare(5); // computing 5 → 25
slowSquare(5); // без "computing" → 25
slowSquare(6); // computing 6 → 36
```

### Расширение (по желанию)

- Добавьте `memoize.maxSize` и вытеснение старых ключей (LRU).
- Обсудите: почему `JSON.stringify` плох для объектов с разным порядком ключей.

### Критерии

- [ ] Второй вызов с теми же аргументами не вызывает `fn`.
- [ ] Разные аргументы — отдельные записи в кэше.
- [ ] `Map` недоступен снаружи — приватный closure.

---

## Задание 3. createStack

### Сценарий

Парсер выражений хранит промежуточные токены в стеке **без** класса — только closure и публичный API.

### Сигнатура

```javascript
// lab/13-stack.js
export function createStack() {
  const items = []; // приватно

  return {
    push(v) {
      items.push(v);
      return items.length;
    },
    pop() {
      if (items.length === 0) return undefined;
      return items.pop();
    },
    peek() {
      return items[items.length - 1];
    },
    size() {
      return items.length;
    },
  };
}
```

### Проверка

```javascript
const s = createStack();
s.push(1);
s.push(2);
console.log(s.peek());  // 2
console.log(s.pop());   // 2
console.log(s.size());  // 1
console.log(s.pop());   // 1
console.log(s.pop());   // undefined
```

### Критерии

- [ ] LIFO: последний in — первый out.
- [ ] `items` снаружи недоступен.
- [ ] Два вызова `createStack()` — независимые стеки.

---

## Задание 4. Loop trap

### Сценарий

Legacy-код регистрирует обработчики в цикле с `var`. Все печатают одно число. Исправьте — **два** способа в одном файле (второй в комментарии).

### Исходник

`lab/13-loop-trap.js`:

```javascript
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => console.log(i));
}
fns.forEach((fn) => fn());
// сейчас: 3, 3, 3 — нужно: 0, 1, 2
```

### Решение A: `let`

```javascript
const fns = [];
for (let i = 0; i < 3; i++) {
  fns.push(() => console.log(i));
}
fns.forEach((fn) => fn());
```

### Решение B: factory (оставьте в комментарии)

```javascript
// for (var i = 0; i < 3; i++) {
//   fns.push(((j) => () => console.log(j))(i));
// }
```

### Вопросы для самопроверки

1. Сколько binding'ов `i` в решении A?
2. Зачем параметр `j` в IIFE в решении B?

Ответы — в [11. Scope](11-scope-hoisting.md) и [12. Closures](12-closures.md).

### Критерии

- [ ] Вывод строго `0`, `1`, `2` по строке на вызов.
- [ ] В файле есть комментарий со вторым способом.

---

## Задание 5 (бонус). Debounce

Реализуйте `debounce(fn, delayMs)` — функция вызывает `fn` только после паузы `delayMs` с последнего вызова. Используйте `let timerId` в closure и `clearTimeout` / `setTimeout`.

Проверка: при быстрых 10 кликах `fn` вызывается один раз.

---

## Сводный чек-лист лабы

- [ ] `createRateLimiter` блокирует после лимита и отпускает после окна
- [ ] `memoize` кэширует по аргументам
- [ ] `createStack` — LIFO, изолированное состояние
- [ ] `13-loop-trap.js` выводит 0, 1, 2
- [ ] Можете устно объяснить, какое окружение держит `check` у rate limiter

## Связь с курсом

| Тема | Урок |
|------|------|
| Scope, `let` vs `var` | [11](11-scope-hoisting.md) |
| Определение closure | [12](12-closures.md) |
| Функции как значения | [10](10-functions.md) |
| Память / утечки | [12](12-closures.md), [36](36-debugging.md) |
| nodejs rate limit | nodejs-intermediate |

## Что сдать (если учитесь с наставником)

1. Четыре файла в `lab/` без ошибок при `node`.
2. Короткий комментарий в `13-rate-limit.js`: почему timestamps в closure, а не в global.

Следующий урок: [14. `this`](14-this.md).
