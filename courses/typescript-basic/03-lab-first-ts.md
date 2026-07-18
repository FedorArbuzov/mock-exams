# 03. Лаба: первые файлы TypeScript

## Зачем эта лаба

Теория [00–02](00-environment.md) дала `tsc`, `tsconfig` и правила аннотаций. **Лаба** переводит это в мышечную память: открыть `.ts`, увидеть **TSxxxx** в терминале, исправить, снова `tsc`. На работе и в CI вы не читаете главу про inference — вы чините `error TS2322` в `scripts/sync-catalog.ts` перед деплоем BFF к FastAPI **:8090**.

Цель — привыкнуть к:

1. **`.ts` как единица работы** — рядом с будущим `.js` в `dist/` или emit рядом.
2. **Ошибка компилятора как учебный материал** — не `@ts-ignore` в первый день.
3. **Разница `tsc` vs `tsx`** — как в [00-environment.md](00-environment.md).

Домен shop появится позже ([06-lab-unions.md](06-lab-unions.md)); здесь — нейтральные имена и порты, но те же привычки, что в [`javascript-basic/03-lab-first-scripts`](../javascript-basic/03-lab-first-scripts.md).

## Предварительно

- Прочитаны [00](00-environment.md) и [02](02-annotations-inference.md).
- Каталог: `courses/typescript-basic/examples/`.
- Выполнено `npm install` (typescript, tsx).

```bash
cd courses/typescript-basic/examples
npx tsc --version
```

Эталоны — `solutions/` — только **после** своей попытки.

---

## Задание 1. Hello TypeScript

**Контекст:** smoke-скрипт в CI перед integration-тестами к `:8090`.

Создайте `lab/01-hello.ts`:

```typescript
const message: string = "Hello from TypeScript lab 01";
const apiPort: number = 8090;

console.log(message);
console.log("FastAPI stand port:", apiPort);
console.log("Node:", process.version);
```

```bash
npx tsc lab/01-hello.ts --outDir dist
node dist/lab/01-hello.js
```

Или с общим `tsconfig`: `npx tsc` и `node dist/lab/01-hello.js`.

**Критерий:** три строки без runtime-ошибок.

---

## Задание 2. Намеренная ошибка типа

**Контекст:** reviewer ловит несоответствие типа порта до merge.

В `lab/02-type-error.ts` **сначала** напишите код с ошибкой:

```typescript
const port: number = "8090";
console.log(port);
```

Запустите `npx tsc lab/02-type-error.ts`. Скопируйте **полный текст** `TS2322` (или аналог) в комментарий в файле.

Исправьте: `const port: number = 8090;` или `Number("8090")` с комментарием, когда string из env допустим.

Пересоберите — **exit code 0**.

---

## Задание 3. Inference vs аннотация

`lab/03-inference.ts`:

1. `const shopName = "Mock Shop";` — **без** аннотации; наведите курсор в IDE — какой тип?
2. `const prices = [79.99, 29.99];` — тип массива?
3. Функция `double(n: number): number { return n * 2; }` — вызовите с `double(21)`.
4. Добавьте строку `double("21");` — зафиксируйте код ошибки в комментарии, **закомментируйте** строку.

```bash
npx tsx lab/03-inference.ts
```

---

## Задание 4. Функция с контрактом

**Контекст:** утилита форматирования цены для логов BFF (до React UI).

`lab/04-format-price.ts`:

```typescript
function formatPrice(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

console.log(formatPrice(79.99, "USD"));
// TODO: раскомментируйте по очереди и запишите TS-ошибку:
// console.log(formatPrice("79.99", "USD"));
// console.log(formatPrice(79.99));
```

**Критерий:** рабочий вызов; в комментарии — две ошибки для неверных вызовов.

---

## Задание 5. Ловушка `any`

`lab/05-any-trap.ts`:

```typescript
function parseConfig(raw: string): any {
  return JSON.parse(raw);
}

const cfg = parseConfig('{"port":"8090"}');
const port: number = cfg.port; // компилируется!
console.log("Port + 1 =", port + 1);
```

Запустите через `tsx`. **В комментарии:** что напечатает `port + 1` и почему (связь с [`javascript-basic/05-coercion`](../javascript-basic/05-coercion-comparison.md)).

Перепишите возврат на `unknown` и покажите, что `cfg.port` без сужения — **ошибка TS**. Строку с `console.log` пока закомментируйте — narrowing в [08-narrowing.md](08-narrowing.md).

---

## Критерии успеха

- [ ] `01-hello` собирается и запускается
- [ ] В `02-type-error` есть текст ошибки TS до исправления
- [ ] `03-inference` — задокументирован TS2345 для `double("21")`
- [ ] `04-format-price` — два типа ошибок вызова описаны
- [ ] `05-any-trap` — объяснено runtime-поведение и переход на `unknown`

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `Cannot find module` | Вы в `examples/`? Путь `lab/01-hello.ts` |
| `tsc` не создаёт `dist/` | `--outDir dist` или `outDir` в tsconfig |
| `node lab/01-hello.ts` падает | Node не выполняет TS — сначала `tsc` или `tsx` |
| Ошибок нет на `port: number = "8090"` | `strict` выключен — включите в tsconfig |
| IDE и `tsc` расходятся | Workspace TypeScript version |

## Связь с курсом

| Дальше | Зачем |
|--------|-------|
| [04. Примитивы и литералы](04-primitives-literals.md) | literal types |
| [08. Narrowing](08-narrowing.md) | безопасный `unknown` |
| [`javascript-basic/03`](../javascript-basic/03-lab-first-scripts.md) | тот же цикл «файл → run» |

Следующий урок (теория): [04. Примитивы и литеральные типы](04-primitives-literals.md).
