# 18. Лаба: современный синтаксис

## Цель лабораторной

Применить [17. Деструктуризация, spread, rest](17-destructuring-spread.md) и элементы [19. Optional chaining и nullish](19-optional-nullish.md) к задачам, похожим на BFF и парсинг логов. После лабы вы свободно пишете `mergeConfig`, `pick`/`omit` и безопасно разбираете строковые записи без десятка `if`.

**Время:** ~45–55 минут.  
**Окружение:** Node.js LTS, `"type": "module"`.

## Подготовка

Файл `lab/18-modern-syntax.js` (или отдельные файлы на функцию):

```javascript
export function parseLogLine(line) { /* ... */ }
export function mergeConfig(base, override) { /* ... */ }
export function pick(obj, keys) { /* ... */ }
export function omit(obj, keys) { /* ... */ }
export function rotate(arr, n) { /* ... */ }
```

Простой runner внизу файла или отдельный `18-test.mjs` с `console.assert`.

---

## Задание 1. Парсинг строки лога

### Сценарий

Агент на сервере пишет однострочные логи. Нужно превратить строку в объект для отправки в мониторинг (аналог структурированных логов в nodejs-advanced).

### Формат

```
2024-06-18T10:00:00Z ERROR auth login failed user=42
```

Поля:

| Поле | Правило |
|------|---------|
| `timestamp` | первый токен (ISO) |
| `level` | второй токен (`ERROR`, `INFO`, …) |
| `module` | третий токен |
| `message` | всё до `user=` или до конца |
| `userId` | число после `user=`, **только если** подстрока есть |

### Сигнатура

```javascript
export function parseLogLine(line) {
  const [timestamp, level, module, ...rest] = line.split(" ");
  const tail = rest.join(" ");
  const userMatch = tail.match(/user=(\d+)/);

  const message = userMatch
    ? tail.slice(0, userMatch.index).trim()
    : tail.trim();

  return {
    timestamp,
    level,
    module,
    message,
    ...(userMatch ? { userId: Number(userMatch[1]) } : {}),
  };
}
```

Реализуйте сами; приведённый код — ориентир после попытки.

### Проверка

```javascript
const a = parseLogLine(
  "2024-06-18T10:00:00Z ERROR auth login failed user=42"
);
console.assert(a.userId === 42);
console.assert(a.message === "login failed");

const b = parseLogLine("2024-06-18T11:00:00Z INFO http GET /health");
console.assert(b.userId === undefined);
console.assert(b.module === "http");
```

### Подсказки

- `split(" ")` режет по пробелам — для `message` с пробелами соберите `rest.join(" ")`.
- Условное поле: spread объекта `...(cond ? { userId: n } : {})` или собрать объект и присвоить поле при наличии.
- `userId` — число, не строка.

### Критерии

- [ ] Все обязательные поля извлекаются.
- [ ] `userId` только при `user=`.
- [ ] Пустая или malformed строка — решите сами: `throw` или частичный объект (задокументируйте).

---

## Задание 2. mergeConfig

### Сценарий

Конфиг приложения: дефолты в репозитории, override из env и флагов CLI. **Нельзя** мутировать `base` — воркеры делят ссылку.

### Сигнатура

```javascript
export function mergeConfig(base, override) {
  return { ...base, ...override };
}
```

### Проверка

```javascript
const base = { host: "localhost", port: 3000, debug: false };
const override = { port: 8080 };
const merged = mergeConfig(base, override);

console.assert(merged.port === 8080);
console.assert(base.port === 3000);
console.assert(merged.host === "localhost");
```

### Расширение

```javascript
export function mergeConfig(base, override = {}) {
  return { ...base, ...override };
}
```

Обсудите shallow merge: `base.nested` и `merged.nested` — одна ссылка. Как смержить `meta` вложенно? `{ ...base, meta: { ...base.meta, ...override.meta } }`.

### Критерии

- [ ] `base` не изменён после merge.
- [ ] Поля из `override` перекрывают `base`.
- [ ] Возвращается **новый** объект.

---

## Задание 3. pick и omit

### Сценарий

Перед логированием объекта пользователя нужно убрать `passwordHash`; в PATCH уходят только разрешённые поля.

### Сигнатуры

```javascript
export function pick(obj, keys) {
  return Object.fromEntries(
    keys.filter((k) => k in obj).map((k) => [k, obj[k]])
  );
}

export function omit(obj, keys) {
  const exclude = new Set(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !exclude.has(k))
  );
}
```

Допустима реализация через reduce или rest после деструктуризации для omit известных ключей.

### Проверка

```javascript
const user = { id: 1, name: "Ann", role: "admin", passwordHash: "xxx" };

const publicUser = omit(user, ["passwordHash"]);
console.assert(publicUser.passwordHash === undefined);
console.assert(user.passwordHash === "xxx");

const patch = pick(user, ["name", "role"]);
console.assert(Object.keys(patch).length === 2);
```

### Критерии

- [ ] `pick` / `omit` возвращают новые объекты.
- [ ] Исходный `user` не мутирован.
- [ ] `pick` с несуществующим ключом — не добавляет `undefined` (или явно задокументируйте иное).

---

## Задание 4. swap и rotate

### Swap (демонстрация)

Без временной переменной:

```javascript
let x = 1;
let y = 2;
[x, y] = [y, x];
console.assert(x === 2 && y === 1);
```

### rotate

Сдвиг массива влево на `n` позиций (нормализуйте `n` по длине):

```javascript
export function rotate(arr, n) {
  const len = arr.length;
  if (len === 0) return [];
  const k = ((n % len) + len) % len;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

console.assert(JSON.stringify(rotate([1, 2, 3, 4], 2)) === JSON.stringify([3, 4, 1, 2]));
console.assert(JSON.stringify(rotate([1, 2, 3, 4], 0)) === JSON.stringify([1, 2, 3, 4]));
```

### Пошагово rotate([1,2,3,4], 2)

1. `k = 2`.
2. `slice(2)` → `[3, 4]`.
3. `slice(0, 2)` → `[1, 2]`.
4. spread → `[3, 4, 1, 2]`.

### Критерии

- [ ] Исходный массив не мутирован.
- [ ] `rotate(arr, 0)` и `rotate(arr, len)` — копия с тем же порядком.

---

## Задание 5 (бонус). normalizePort

```javascript
export function normalizePort(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 3000;
}
```

Сравните с `value || 3000` — почему `0` ломает `||`? См. [19](19-optional-nullish.md): `value ?? 3000` после проверки `Number`.

---

## Сводный чек-лист

- [ ] `parseLogLine` извлекает `userId` только при `user=`
- [ ] `mergeConfig` не меняет `base`
- [ ] `pick` / `omit` — новые объекты
- [ ] `rotate` через slice + spread
- [ ] Понимаете shallow merge и риск общего `nested`

## Типичные ошибки

| Ошибка | Причина |
|--------|---------|
| `Object.assign(base, override)` | Мутация base |
| `const { ...rest, id } = o` | rest не последний |
| `parseLogLine` без join rest | message обрезан одним словом |
| `rotate` мутирует `arr` | `push`/`splice` на исходнике |

## Связь с курсом

| Тема | Урок |
|------|------|
| Spread / rest | [17](17-destructuring-spread.md) |
| `??` для дефолтов | [19](19-optional-nullish.md) |
| Shallow copy | [07](07-objects.md) |
| Массивы | [08](08-arrays.md) |
| Env merge в Node | nodejs-basic |

## Мини-тест (устно)

1. Чем `omit` отличается от `delete obj.key`?
2. Почему `{ ...base, ...override }` безопаснее `base.port = override.port`?

Следующий урок: [19. Optional chaining и nullish](19-optional-nullish.md).
