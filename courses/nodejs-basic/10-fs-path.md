# 10. Модуль `fs` и `path`

## Сценарий с работы

Скрипт деплоя должен прочитать `catalog.json`, добавить новый SKU и записать файл обратно. На Linux всё работает; на Windows коллега запускает `node scripts/update.js` из корня репозитория — скрипт создаёт `data\catalog.json` **не там**, где лежит исходный каталог. В логах: `ENOENT: no such file or directory, open 'data/catalog.json'`. Второй инцидент: после ручного редактирования JSON в Notepad сервер падает с `SyntaxError: Unexpected token` — файл сохранён в **UTF-16 LE** с BOM.

Node не блокирует event loop при **асинхронном** I/O через `fs/promises`. Модуль `path` строит пути независимо от `\` и `/`. Для shop-BFF каталог товаров — локальный JSON до подключения FastAPI `:8090`.

## Что вы узнаете

- Чтение и запись файлов через `node:fs/promises`
- Синхронный `fs` — когда допустим и почему избегать в сервере
- `path.join`, `path.resolve`, `path.basename`
- Привязка путей к **файлу скрипта** через `__dirname` (ESM)
- Работа с JSON-файлами каталога shop
- Кодировка `utf8` при чтении/записи

---

## Асинхронный `fs/promises`

Предпочтительный API в современном Node:

```javascript
import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
```

**Чтение текстового файла:**

```javascript
const raw = await readFile("/path/to/catalog.json", "utf8");
const catalog = JSON.parse(raw);
```

Второй аргument `"utf8"` (или `"utf-8"`) — Node вернёт **строку**, а не `Buffer`. Без него `readFile` возвращает бинарный `Buffer`.

**Запись:**

```javascript
const updated = { ...catalog, updatedAt: new Date().toISOString() };
await writeFile(
  "/path/to/catalog.json",
  JSON.stringify(updated, null, 2),
  "utf8"
);
```

`JSON.stringify(obj, null, 2)` — читаемый отступ для diff в Git.

**Проверка существования:**

```javascript
try {
  await access("data/catalog.json", fsConstants.F_OK);
  console.log("file exists");
} catch {
  console.log("file missing");
}
```

---

## `path`: кроссплатформенные пути

Windows использует `\`, POSIX — `/`. `path.join` склеивает сегменты **правильно** для текущей ОС:

```javascript
import { join, resolve, basename, dirname, extname } from "node:path";

join("data", "shop", "catalog.json");
// Windows: data\shop\catalog.json
// Linux:   data/shop/catalog.json

basename("/var/app/data/catalog.json"); // catalog.json
extname("catalog.json");                 // .json
dirname("/var/app/data/catalog.json");   // /var/app/data
```

| Метод | Назначение |
|-------|------------|
| `join(a, b, c)` | сегменты без дублирования разделителей |
| `resolve(...)` | абсолютный путь от cwd или от переданных сегментов |
| `basename` | имя файла |
| `dirname` | каталог файла |

**`resolve` vs `join`:** `resolve("data", "x.json")` даёт абсolutный путь от текущего cwd. `join` — только склеивает. Для данных рядом со скриптом используйте `join(__dirname, "data", "catalog.json")`.

---

## `__dirname` в ESM и JSON каталог

Структура для shop-лаб:

```text
examples/
├── package.json
└── lab/
    ├── load-catalog.js
    └── data/
        └── catalog.json
```

`load-catalog.js`:

```javascript
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const catalogPath = join(__dirname, "data", "catalog.json");

export async function loadCatalog() {
  const raw = await readFile(catalogPath, "utf8");
  return JSON.parse(raw);
}

export async function saveCatalog(catalog) {
  const json = JSON.stringify(catalog, null, 2) + "\n";
  await writeFile(catalogPath, json, "utf8");
}
```

Пример `catalog.json`:

```json
{
  "version": 1,
  "items": [
    { "id": "kb-001", "name": "Keyboard", "price": 79.9, "category": "peripherals" },
    { "id": "ms-002", "name": "Mouse", "price": 29.99, "category": "peripherals" }
  ]
}
```

Путь **не** зависит от того, из какого каталога запустили `node`:

```bash
cd courses/nodejs-basic/examples
node lab/load-catalog.js
# или
node examples/lab/load-catalog.js   # из корня mock-exams — всё равно найдёт data/
```

---

## Синхронный `fs` — осторожно

```javascript
import { readFileSync, writeFileSync } from "node:fs";

const raw = readFileSync(catalogPath, "utf8");
```

Синхронные вызовы **блокируют** event loop на время дисковой операции. Для CLI-скрипта на 100 ms — допустимо. Для HTTP-сервера под нагрузкой — нет: один большой `readFileSync` задержит все запросы.

| Контекст | Рекомендация |
|----------|--------------|
| HTTP-сервер, BFF | `fs/promises` |
| Одноразовый CLI, старт конфига | sync иногда OK |
| Большие файлы | streams ([13-streams.md](13-streams.md)) |

---

## Создание каталога перед записью

```javascript
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

async function writeJson(filePath, data) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}
```

`{ recursive: true }` — не падает, если каталог уже есть (Node 10+).

---

## Обработка ошибок fs

```javascript
import { readFile } from "node:fs/promises";

try {
  const raw = await readFile(catalogPath, "utf8");
  return JSON.parse(raw);
} catch (err) {
  if (err.code === "ENOENT") {
    throw new Error(`Catalog not found: ${catalogPath}`);
  }
  if (err instanceof SyntaxError) {
    throw new Error(`Invalid JSON in ${catalogPath}: ${err.message}`);
  }
  throw err;
}
```

Типичные `err.code`: `ENOENT` (нет файла), `EACCES` (права), `EISDIR` (путь — каталог).

---

## Связь с экосистемой mock-exams

| Компонент | Роль |
|-----------|------|
| Локальный `catalog.json` | прототип до FastAPI `:8090` |
| [deploy/fastapi](../../deploy/fastapi/README.md) | источник правды для items в проде |
| [11-lab-fs.md](11-lab-fs.md) | лаба: CRUD каталога с path safety |

---

## Типичные ошибки

- **Относительный путь от cwd** — `readFile("data/catalog.json")` ломается при другом каталоге запуска.
- **Забыли `"utf8"`** — получили `Buffer`, `JSON.parse` упал.
- **Notepad / UTF-16** — BOM ломает `JSON.parse`; сохраняйте UTF-8 (VS Code, `writeFile` с `"utf8"`).
- **`readFileSync` в request handler** — блокировка loop под конкурентными запросами.
- **Конкатенация строк** `"dir" + "/" + file` вместо `path.join` — двойные слэши, ошибки на Windows.

---

## Резюме

- Используйте **`node:fs/promises`** и **`node:path`** в ESM-коде.
- Якорь к данным — **`join(__dirname, "data", "file.json")`**, не голый относительный путь.
- JSON: `readFile(..., "utf8")` → `JSON.parse`; запись — `JSON.stringify` + `writeFile`.
- Синхронный fs — только для коротких CLI, не для сервера.

## Чек-лист

- Чем `readFile(path, "utf8")` отличается от `readFile(path)` без кодировки?
- Зачем `path.join` вместо склеивания строк?
- Как получить абсolutный путь к `data/catalog.json` относительно **файла** скрипта?
- Почему `readFileSync` опасен в HTTP-обработчике?
- Что означает `err.code === "ENOENT"`?
- Зачем `mkdir(..., { recursive: true })` перед первой записью?

Следующий урок: [11. Лаба: чтение и запись файлов](11-lab-fs.md).
