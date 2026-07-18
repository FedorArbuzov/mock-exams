# 06. Лаба: типы и сравнение

## Зачем эта лаба

На backend FastAPI `:8090` Pydantic отклоняет `{"age": "twenty"}` с **422 Unprocessable Entity**. JavaScript-слой между формой и API — BFF, SSR, CLI-утилита — **не имеет** Pydantic по умолчанию. Один `Number(form.age)` без проверки превращает `""` в **0** и `"abc"` в **NaN**, который уезжает дальше в JSON. Лаба тренирует то, что в Python-треке делает схема: **предсказать поведение до запуска** и **явно** преобразовывать и сравнивать.

Два навыка:

1. **Quiz mindset** — как на собеседовании и в PR «what does this log?». Закрепление [04-primitives.md](04-primitives.md) и [05-coercion-comparison.md](05-coercion-comparison.md).
2. **Defensive parsing** — функции `parseAge`, `getPort`, которые не протекают NaN и не затирают valid `0`.

Домен shop: возраст для restricted categories, порт dev-сервера BFF (3000 vs bind `0`), query params из URL как **строки**. Те же ловушки, что при интеграции с [`deploy/fastapi`](../../deploy/fastapi/README.md).

## Предварительно

- Прочитаны [04. Примитивы](04-primitives.md) и [05. Приведение и сравнение](05-coercion-comparison.md).
- Каталог: `courses/javascript-basic/examples/`.

```bash
cd courses/javascript-basic/examples
```

Не подглядывайте в `solutions/` до попытки. Ошибки в предсказаниях в задании 1 — **нормальная часть обучения**; пометьте их в комментарии.

---

## Задание 1. Таблица предсказаний

**Контекст:** senior на review вставляет однострочник `console.log([] == ![])` — не чтобы так писать, а чтобы проверить, читали ли вы главу 05.

Создайте `lab/06-predict.js`. Для **каждой** строки **сначала** комментарий с ожидаемым результатом, **потом** `console.log`:

```javascript
console.log(typeof null);
console.log(typeof NaN);
console.log("5" + 2);
console.log("5" - 2);
console.log(0 == false);
console.log(0 === false);
console.log(null == undefined);
console.log("" == 0);
console.log(Boolean([]));
console.log(Boolean(""));
```

Запустите `node lab/06-predict.js`. Несовпадения — комментарий `# было неожиданно: …` и краткое правило (falsy, `+` vs `-`, `==`).

**Критерий:** минимум 10 пар «предсказание → факт»; не менее одной исправленной ошибки в комментарии (если все угадали — добавьте добровольно `console.log(null === undefined)` и объясните).

---

## Задание 2. Парсер возраста

**Контекст:** поле «Age» из HTML form или CSV import — всегда string или пусто. API shop может требовать integer 0–120.

`lab/06-parse-age.js`:

```javascript
function parseAge(input) {
  // TODO: вернуть number (integer) или null если невалидно
  // Не возвращать NaN наружу
  // Используйте Number, Number.isFinite, Number.isInteger — без ==
}

console.log(parseAge("25"));    // 25
console.log(parseAge("25.5"));  // 25 или 26 — задокументируйте выбор в комментарии
console.log(parseAge(""));      // null
console.log(parseAge("abc"));   // null
console.log(parseAge(null));    // null
console.log(parseAge(undefined)); // null
```

**Подсказки:** `Number("") === 0` — почему пустая строка не «valid 0 years». `parseInt("25.9", 10)` vs `Math.trunc(Number(...))` — выберите и опишите.

---

## Задание 3. Безопасный дефолт порта

**Контекст:** конфиг Node BFF перед проксированием на FastAPI `:8090`:

```javascript
// config.json examples
// {}                    → default 3000
// { "port": 8080 }      → 8080
// { "port": 0 }         → 0 (OS picks ephemeral — в тестах)
// { "port": null }      → 3000
```

`lab/06-port-default.js`:

```javascript
function getPort(config) {
  // TODO: config.port; если null/undefined — 3000;
  // если явно 0 — оставить 0 (не подменять дефолтом)
}

console.log(getPort({}));              // 3000
console.log(getPort({ port: 8080 }));  // 8080
console.log(getPort({ port: 0 }));     // 0
console.log(getPort({ port: null }));  // 3000
console.log(getPort({ port: undefined })); // 3000
```

**Подсказка:** `??`, не `||`. Добавьте комментарий: что сломает `config.port || 3000` при `port: 0`.

Опционально: что вернёт `getPort({ port: "" })` с вашей реализацией? Нужен ли guard?

---

## Задание 4. Falsy quiz

**Контекст:** feature flag `if (config.feature)` — пустой массив enabled rules `[]` всё равно truthy; `0` discount falsy.

В `lab/06-falsy.md` (markdown) ответьте списком: какие значения печатают **`NO`**?

```javascript
function check(v) {
  console.log(v ? "YES" : "NO");
}
```

Значения для проверки в Node REPL или маленьком скрипте `lab/06-falsy-check.js`:

`0`, `-0`, `""`, `"0"`, `[]`, `{}`, `null`, `undefined`, `NaN`, `0n`

Для каждого **NO** — одна фраза «почему falsy». Для спорных **YES** (`"0"`, `[]`) — почему truthy и как проверять «пусто» правильно (`.length`, `=== ""`).

`document.all` (бrowsers) — пропустите в Node; упомяните в markdown одной строкой, что это legacy oddity.

---

## Задание 5 (опционально). Strict compare helper

`lab/06-strict-eq.js` — функция:

```javascript
export function sameValue(a, b) {
  // Object.is semantics для NaN и ±0 — см. глава 05
}
```

Проверки:

```javascript
console.log(sameValue(NaN, NaN)); // true
console.log(sameValue(+0, -0));   // false
console.log(sameValue(5, "5"));   // false
```

Закрепляет разницу `===` и `Object.is` — пригодится в React mental model.

---

## Критерии успеха

- [ ] `06-predict.js` — комментарии **до** каждого log
- [ ] `parseAge` никогда не возвращает `NaN`
- [ ] `getPort({ port: 0 })` === `0`
- [ ] `06-falsy.md` — все 10 значений разобраны
- [ ] Можете устно объяснить `||` vs `??` на примере порта

## Если что-то пошло не так

| Симптом | Направление |
|---------|-------------|
| `parseAge("")` → `0` | Пустая строка — invalid, не ноль лет |
| `getPort({ port: 0 })` → `3000` | Использован `\|\|`, нужен `??` |
| Все predict верны с первого раза | Добавьте `[] == ![]` с объяснением — не используйте в проде |
| ESLint ругается на `==` в predict | Для учебного файла допустимо; в prod только `===` |

## Связь с курсом

| Дальше | Связь |
|--------|-------|
| [07. Объекты](07-objects.md) | plain objects после JSON.parse |
| [19. `??` и `?.`](19-optional-nullish.md) | nullish в конфигах |
| [32. Errors](32-error-handling.md) | throw на invalid parse |
| [`fastapi/04-pydantic`](../fastapi/04-pydantic-v2.md) | параллель валидации на backend |

Следующий урок (теория): [07. Объекты](07-objects.md).
