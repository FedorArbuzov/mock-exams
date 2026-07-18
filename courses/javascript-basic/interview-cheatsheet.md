# JavaScript Basic — Interview Cheatsheet

Проверьте себя **без подглядывания**, затем откройте ответы.

---

## Быстрые ответы

### Типы

| Вопрос | Ответ |
|--------|-------|
| Примитивы | undefined, null, boolean, number, bigint, string, symbol |
| `typeof null` | `"object"` (исторический баг) |
| Falsy | false, 0, -0, 0n, "", null, undefined, NaN |
| `===` vs `==` | строгое без coercion; `==` с приведением |
| `??` vs `\|\|` | `??` только null/undefined; `\|\|` любой falsy |

### Scope

| Вопрос | Ответ |
|--------|-------|
| TDZ | let/const доступны после объявления, до — ReferenceError |
| Closure | функция + лексическое окружение, доступ к внешним переменным после return |
| `var` в for + setTimeout | одна переменная i → все колбэки видят финальное i |

### `this`

| Вызов | this |
|-------|------|
| `fn()` strict | undefined |
| `obj.m()` | obj |
| arrow | лексический из окружения |
| `bind(x)` | x |

### Async

```text
sync → microtasks (Promise.then) → macrotask (setTimeout) → …
```

| API | Поведение |
|-----|-----------|
| `Promise.all` | все или первая ошибка |
| `allSettled` | все результаты |
| `fetch` | reject только на network; 4xx/5xx — ok:false |

### Прототипы

- Метод ищется по цепочке `[[Prototype]]` до `null`.
- `class` — синтаксис над prototype.
- `new Fn()` → объект с `[[Prototype]] = Fn.prototype`.

### Модули

- ESM: `import`/`export`, `"type":"module"`.
- CJS: `require`/`module.exports`.
- Node ESM: расширение `.js` в относительных import.

---

## Мини-сниппеты

```javascript
// debounce sketch
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// shallow clone
const copy = { ...obj, nested: { ...obj.nested } };

// parallel fetch
const data = await Promise.all(urls.map((u) => fetch(u).then((r) => r.json())));

// safe JSON
function safeJsonParse(s) {
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
```

---

## Частые ловушки

1. `[] + {}` → `"[object Object]"`
2. `0.1 + 0.2 !== 0.3`
3. `map(async () => …)` без `Promise.all`
4. Мутация state: `arr.push` vs `[...arr, x]`
5. Стрелка как метод объекта — нет `this` объекта
6. `JSON.stringify` теряет `undefined`, функции
7. `sort()` без comparator на числах
8. `for...in` на массивах

---

## Что учить дальше

| Тема | Курс |
|------|------|
| Типы | typescript-basic |
| HTTP сервер | nodejs-basic |
| UI | react-basic |
| Тесты | javascript-testing |
| REST контракты | api-design |
| Event loop углублённо | nodejs-basic + python-async |

---

[← README](README.md) · [38-interview-qa](38-interview-qa.md) · [39-capstone](39-capstone.md)
