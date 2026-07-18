# 03. Лаба: первые скрипты

## Зачем эта лаба

Теория [00–02](00-environment.md) дала карту: Node, `let`/`const`, strict mode, первый `console.log`. **Лаба** переводит это в **мышечную память**. На работе и в CI вы не читаете главу про переменные — вы открываете `scripts/reindex-catalog.js`, запускаете `node scripts/reindex-catalog.js`, смотрите stdout/stderr, правите, коммитите. Тот же цикл, что smoke-тест [`deploy/fastapi`](../../deploy/fastapi/README.md) или bash-лабы [`linux-basic`](../linux-basic/02-lab-shell.md), только runtime — V8.

Цель лабы **не** «выучить синтаксис по списку задач». Цель — привыкнуть к:

1. **Файл как единица работы** — версионируется в git, reviewable, воспроизводим.
2. **Терминал как источник правды** — вывод не «мигает» как окно проводника Windows.
3. **Ошибки как учебный материал** — `ReferenceError`, странный `"23"`, `var` vs `let` — вы **видите** их руками до production.

Домен **shop** (товары, цены) появится позже в [09-lab-objects-arrays.md](09-lab-objects-arrays.md) и на `:8090`. Здесь — нейтральные числа и имена, но те же привычки, что понадобятся для BFF к FastAPI.

## Предварительно

- Node **LTS 20+** установлен, терминал перезапускали после установки.
- Прочитаны [00. Окружение](00-environment.md) и [02. Переменные](02-variables-strict.md).
- Вы в каталоге **`courses/javascript-basic/examples/`** (не в корне репозитория).

```bash
cd courses/javascript-basic/examples
node --version
```

В [`package.json`](examples/package.json) указано `"type": "module"`. В этой лабе достаточно обычных `.js` файлов без `import` — но каталог уже готов к [30-es-modules.md](30-es-modules.md).

Эталоны — [`examples/solutions/`](examples/solutions/) — открывайте **только после** своей попытки и короткого ступора (5–15 минут).

---

## Задание 1. Hello и версия Node

**Контекст:** в CI pipeline первый шаг часто `node --version`, чтобы не гонять миграции на Node 16. Локальный скрипт дублирует эту проверку для логов.

Создайте `lab/01-hello.js`:

```javascript
console.log("Hello from lab 01");
console.log("Node version:", process.version);
console.log("Platform:", process.platform);
```

```bash
node lab/01-hello.js
```

**Критерий:** три строки без ошибок. `process.platform` — `win32`, `linux` или `darwin`; полезно в тикетах «не воспроизводится».

---

## Задание 2. Переменные и шаблонные строки

**Контекст:** генерация label для invoice в shop — `firstName`, `lastName`, шаблонная строка вместо конкатенации с `+` (меньше coercion-сюрпризов из [05-coercion-comparison.md](05-coercion-comparison.md)).

В `lab/02-variables.js`:

1. Объявите `const firstName` и `const lastName`.
2. Соберите `fullName` через **template literal** `` `${firstName} ${lastName}` ``.
3. Выведите одной строкой: `fullName`, `typeof fullName`, `typeof null`, `typeof undefined`.

**Пример вывода:**

```text
Ann Smith
string object undefined
```

Подсказка: `typeof null === "object"` — исторический баг; запишите в комментарий одной фразой «почему так».

---

## Задание 3. Блоки и `let`

**Контекст:** отложенные задачи (retry, analytics batch) в Node ставят в `setTimeout` / queue. Одна переменная цикла на все колбэки — классический баг с `var`.

В `lab/03-blocks.js`:

```javascript
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log("tick", i), 10);
}
```

Запустите. Затем **намеренно** замените `let` на `var`, запустите снова.

**В комментарии в файле** (2–4 предложения): какой вывод при `let`, какой при `var`, почему (scope + closure — preview [12-closures.md](12-closures.md)).

---

## Задание 4. Мини-калculator и coercion

**Контекст:** форма количества пришла строкой `"2"` — без `Number()` сложение склеивает.

`lab/04-calc.js`:

```javascript
function add(a, b) {
  return a + b;
}

console.log("2 + 3 =", add(2, 3));
console.log('"2" + 3 =', add("2", 3));
```

**В комментарии:** почему второй вызов даёт `"23"`, не `5`. Упомяните правило `+` и string из [05-coercion-comparison.md](05-coercion-comparison.md).

Опционально: добавьте `addStrict(a, b)` с `Number(a) + Number(b)` и третий `console.log` для `"2"` и `3`.

---

## Задание 5. REPL и float

**Контекст:** сумма line items shop не сходится на копейку — IEEE 754 ([04-primitives.md](04-primitives.md)).

В терминале `node` (REPL), без файла:

```javascript
const a = 0.1 + 0.2;
a === 0.3;
Math.abs(a - 0.3) < Number.EPSILON;
```

Запишите результаты в комментарий в начале `lab/05-float.js`. Одной строкой:

```javascript
console.log(a.toFixed(20));
```

**Критерий:** видите `0.30000000000000004` (или похожее) и понимаете, почему `=== 0.3` false.

---

## Критерии успеха

- [ ] Все файлы `01`–`05` запускаются: `node lab/….js` из `examples/`
- [ ] В `03-blocks.js` есть комментарий про `var` vs `let`
- [ ] В `04-calc.js` объяснено поведение `"2" + 3`
- [ ] Понимаете, зачем логировать `process.version` в CI
- [ ] REPL использовали хотя бы для задания 5

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `Cannot find module` | Вы в `examples/`? Путь `lab/01-hello.js` |
| `SyntaxError: Unexpected token` | UTF-8, кавычки `"`/`'` парные, не «умные» из Word |
| Пустой вывод от `setTimeout` | Подождите ~50 ms; Node не завершит процесс пока таймеры в оч even loop |
| `ReferenceError: process is not defined` | Запуск в браузере, не в Node — используйте терминал |
| Кириллица в пути ломает Node | Переместите repo в ASCII path или обновите Node |

## Связь с курсом

| Следующий шаг | Зачем |
|--------------|-------|
| [04. Примитивы](04-primitives.md) | typeof, number, float |
| [05. Coercion](05-coercion-comparison.md) | углубление `+` и `===` |
| [06. Лаба: типы](06-lab-types.md) | предсказание вывода до запуска |

Следующий урок (теория): [04. Примитивные типы](04-primitives.md).
