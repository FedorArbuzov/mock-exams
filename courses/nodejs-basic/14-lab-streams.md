# 14. Лаба: readline и потоковая обработка

Цель — **обработать большой текстовый файл построчно** без загрузки в память целиком и **стримить JSON** в HTTP-ответ. Практика [13-streams.md](13-streams.md): `createReadStream`, `readline`, `pipeline`.

**Время:** ~30–40 минут после теории (~50–70 мин на пару 13+14).

## Стенд

```bash
cd courses/nodejs-basic/examples
node --version
```

Эталон: `solutions/lab/14-streams/` (после своей попытки).

---

## Подготовка данных

Создайте `lab/data/access.log` (минимум 20 строк):

```text
2024-01-15T10:00:01Z GET /api/v1/items 200 45ms
2024-01-15T10:00:02Z GET /health 200 2ms
2024-01-15T10:00:03Z POST /api/v1/items 201 120ms
2024-01-15T10:00:04Z GET /api/v1/items/999 404 5ms
```

Скрипт генерации (опционально):

```javascript
// lab/generate-log.js — запустить один раз
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const lines = [];
for (let i = 0; i < 50_000; i++) {
  lines.push(`2024-01-15T10:00:${String(i % 60).padStart(2, "0")}Z GET /health 200 1ms`);
}
await writeFile(join(dir, "data", "access-large.log"), lines.join("\n") + "\n", "utf8");
console.log("written", lines.length, "lines");
```

---

## Задание 1. Подсчёт строк — `count-lines.js`

```javascript
// lab/count-lines.js
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const logPath = join(__dirname, "data", "access-large.log");

async function countLines(filePath) {
  const input = createReadStream(filePath, { encoding: "utf8" });
  const rl = createInterface({ input, crlfDelay: Infinity });

  let count = 0;
  for await (const line of rl) {
    if (line.length > 0) count++;
  }
  return count;
}

const n = await countLines(logPath);
console.log("Lines:", n);
```

`crlfDelay: Infinity` — корректная обработка `\r\n` на Windows.

Запуск:

```bash
node lab/generate-log.js   # если ещё нет large log
node lab/count-lines.js
```

**Ожидаемо:** `Lines: 50000` без скачка памяти (проверьте Task Manager при желании).

---

## Задание 2. Фильтр 404 — `filter-404.js`

Читайте `access.log` построчно, пишите только строки с ` 404 ` в `lab/data/404.log`:

```javascript
import { createReadStream, createWriteStream } from "node:fs";
import { createInterface } from "node:readline";
import { pipeline } from "node:stream/promises";

async function filter404(inputPath, outputPath) {
  const input = createReadStream(inputPath, { encoding: "utf8" });
  const output = createWriteStream(outputPath, { encoding: "utf8" });
  const rl = createInterface({ input, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes(" 404 ")) {
      const ok = output.write(line + "\n");
      if (!ok) {
        await new Promise((r) => output.once("drain", r));
      }
    }
  }
  output.end();
  await new Promise((r) => output.once("finish", r));
}
```

Альтернатива: собрать Transform stream — для лабы достаточно readline + Writable.

---

## Задание 3. Stream JSON — NDJSON export

Файл `lab/data/items.ndjson` — по одному JSON-объекту на строку:

```text
{"id":"kb-001","name":"Keyboard","price":79.9}
{"id":"ms-002","name":"Mouse","price":29.99}
```

Реализуйте `streamItems(filePath, onItem)`:

```javascript
export async function streamItems(filePath, onItem) {
  const input = createReadStream(filePath, { encoding: "utf8" });
  const rl = createInterface({ input, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const item = JSON.parse(trimmed);
    await onItem(item); // async callback допустим
  }
}
```

CLI `14-stream-items.js`:

```javascript
let total = 0;
await streamItems(join(__dirname, "data", "items.ndjson"), async (item) => {
  total += item.price;
  console.log(item.id, item.name);
});
console.log("Sum prices:", total.toFixed(2));
```

При битой строке JSON — понятная ошибка с номером контекста (оберните parse в try/catch).

---

## Задание 4. HTTP — стрим каталога (preview)

Мини-сервер `14-stream-server.js` на порту **3097**:

```javascript
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalogPath = join(__dirname, "data", "catalog.json");

createServer(async (req, res) => {
  if (req.url === "/catalog" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
    });
    try {
      await pipeline(createReadStream(catalogPath), res);
    } catch {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    }
    return;
  }
  res.writeHead(404).end("Not found");
}).listen(3097, () => console.log("http://localhost:3097/catalog"));
```

Проверка:

```bash
curl http://localhost:3097/catalog
```

Полный HTTP-разбор — [15-http-module.md](15-http-module.md), лаба сервера — [16-lab-http-server.md](16-lab-http-server.md).

---

## Критерии успеха

- [ ] `count-lines.js` считает 50k строк без OOM
- [ ] `filter-404.js` создаёт непустой `404.log` из sample access.log
- [ ] `streamItems` парсит NDJSON построчно
- [ ] `14-stream-server.js` отдаёт catalog через pipeline
- [ ] При удалённом catalog.json сервер отвечает 500, не падает процесс

---

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| Память растёт на count | не используйте `readFile`; только readline |
| Счётчик на 1 меньше | пустая последняя строка без `\n` |
| `write EPIPE` | клиент закрыл соединение до конца pipeline — норм для curl -m |
| JSON parse на строке 0 | BOM или пустая строка — trim / stripBom |
| Windows `\r` в конце поля | crlfDelay в readline |

---

## Рефлексия

Почему для API списка из 100k товаров **пагинация** предпочтительнее одного NDJSON-стрима в браузер?

---

Следующий урок: [15. Модуль `http`: сервер и запросы](15-http-module.md).
