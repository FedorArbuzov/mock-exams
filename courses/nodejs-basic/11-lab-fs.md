# 11. Лаба: чтение и запись JSON-каталога

Цель — **реализовать модуль** загрузки и сохранения shop-каталога на диске: корректные пути через `__dirname`, безопасная работа с путями, обработка ошибок. Это тот же цикл, что в [10-fs-path.md](10-fs-path.md), но hands-on — как перед подключением BFF к FastAPI `:8090`.

**Время:** ~25–35 минут после теории (~50–70 мин на пару 10+11).

## Стенд

```bash
cd courses/nodejs-basic/examples
node --version   # v20+ или v22+
```

Создайте каталог `lab/` если его ещё нет. В `package.json` — `"type": "module"`. Эталон — `solutions/lab/11-catalog/` (открывайте **после** своей попытки).

---

## Архитектура

```text
examples/
├── package.json
└── lab/
    ├── 11-cli.js           # точка входа — CLI
    ├── catalog-store.js    # load / save / addItem
    └── data/
        └── catalog.json    # начальные данные
```

---

## Задание 0. Начальный `catalog.json`

Создайте `lab/data/catalog.json`:

```json
{
  "version": 1,
  "items": [
    {
      "id": "kb-001",
      "name": "Mechanical Keyboard",
      "price": 79.9,
      "category": "peripherals"
    },
    {
      "id": "ms-002",
      "name": "Wireless Mouse",
      "price": 29.99,
      "category": "peripherals"
    }
  ]
}
```

Сохраните в **UTF-8** без BOM (VS Code: статус-бар → UTF-8).

---

## Задание 1. `catalog-store.js` — пути

Реализуйте константу пути к файлу **относительно модуля**, не cwd:

```javascript
// lab/catalog-store.js
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_FILE = join(__dirname, "data", "catalog.json");

export function getCatalogPath() {
  return CATALOG_FILE;
}
```

**Проверка:** из корня `mock-exams` команда `node courses/nodejs-basic/examples/lab/11-cli.js` должна находить тот же файл.

---

## Задание 2. `loadCatalog()`

```javascript
export async function loadCatalog() {
  const raw = await readFile(CATALOG_FILE, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.items)) {
    throw new Error("catalog.json: missing items array");
  }
  return data;
}
```

Обработайте `ENOENT` понятным сообщением: «Catalog file not found at …».

---

## Задание 3. `saveCatalog(catalog)`

```javascript
export async function saveCatalog(catalog) {
  const json = JSON.stringify(catalog, null, 2) + "\n";
  await writeFile(CATALOG_FILE, json, "utf8");
}
```

Не вызывайте `saveCatalog` на каждый символ ввода — только после изменения структуры.

---

## Задание 4. `addItem(catalog, item)` — бизнес-логика

```javascript
export function addItem(catalog, item) {
  if (!item.id || typeof item.id !== "string") {
    throw new Error("item.id required");
  }
  if (catalog.items.some((x) => x.id === item.id)) {
    throw new Error(`duplicate id: ${item.id}`);
  }
  if (typeof item.price !== "number" || item.price < 0) {
    throw new Error("invalid price");
  }
  catalog.items.push(item);
  return catalog;
}
```

---

## Задание 5. Path safety — запрет traversal

Добавьте функцию безопасного разрешения пути **внутри** `data/`:

```javascript
import { resolve, sep } from "node:path";

const DATA_DIR = join(__dirname, "data");

export function safeDataPath(relativeName) {
  const base = resolve(DATA_DIR);
  const target = resolve(DATA_DIR, relativeName);
  if (!target.startsWith(base + sep) && target !== base) {
    throw new Error("path traversal denied");
  }
  return target;
}
```

Импортируйте `sep` из `node:path`. На Windows `startsWith` для путей с разным регистром диска — edge case; для лабы достаточно этого паттерна.

**Задание:** реализуйте `loadBackup(name)`, читающий только `lab/data/backups/{name}.json` через `safeDataPath`.

---

## Задание 6. CLI `11-cli.js`

```javascript
// lab/11-cli.js
import { loadCatalog, saveCatalog, addItem } from "./catalog-store.js";

const catalog = await loadCatalog();

addItem(catalog, {
  id: "hd-003",
  name: "USB Hub",
  price: 19.5,
  category: "accessories",
});

await saveCatalog(catalog);

const reloaded = await loadCatalog();
console.log("Items count:", reloaded.items.length);
console.log("Last item:", reloaded.items.at(-1).name);
```

Запуск:

```bash
node lab/11-cli.js
```

**Ожидаемый вывод (пример):**

```text
Items count: 3
Last item: USB Hub
```

Повторный запуск **без** сброса `catalog.json` упадёт на `duplicate id: hd-003` — это нормально; восстановите JSON или смените id.

---

## Задание 7. Тест «сломанного» JSON

Вручную испортьте JSON (лишняя запятая), запустите CLI. Убедитесь, что ошибка указывает на файл, а не «Unexpected token» без контекста.

---

## Критерии успеха

- [ ] `node lab/11-cli.js` добавляет товар и сохраняет файл
- [ ] Путь к `catalog.json` не зависит от cwd
- [ ] Дубликат `id` отклоняется с понятной ошибкой
- [ ] `safeDataPath("../../../etc/passwd")` бросает ошибку
- [ ] Файл на диске — валидный JSON с отступами
- [ ] После исправления битого JSON скрипт снова работает

---

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `ENOENT` на catalog.json | `CATALOG_FILE` через `__dirname`; файл в `lab/data/` |
| `JSON parse error` | UTF-8, валидный JSON; нет BOM UTF-16 |
| `duplicate id` при первом запуске | очистите добавленный item из JSON |
| Создаётся catalog в неожиданном месте | нет голого `"data/catalog.json"` без `join(__dirname, ...)` |
| Path traversal «проходит» | `resolve` + проверка префикса `DATA_DIR` |

---

## Рефлексия

В комментарии в `11-cli.js` ответьте: почему для HTTP API (FastAPI `:8090`) path traversal актуален при параметре `?file=../../../secret`?

---

## Связь с курсом

| Урок | Связь |
|------|-------|
| [09-modules-cjs-esm.md](09-modules-cjs-esm.md) | ESM, `import.meta.url` |
| [10-fs-path.md](10-fs-path.md) | теория fs/path |
| [20-fastapi-client.md](20-fastapi-client.md) | каталог с API вместо JSON |

Следующий урок: [12. Buffers и кодировки](12-buffers-encoding.md).
