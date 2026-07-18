# 13. Streams: Readable, Writable, pipeline

## Сценарий с работы

Скрипт импорта читает `orders-2024.jsonl` на **2.4 GB** через `readFile` + `split`. Node падает с **JavaScript heap out of memory** — весь файл загружен в одну строку. После перехода на streams память стабильна, но появилась новая проблема: запись на диск идёт быстрее, чем парсинг, RAM растёт — **backpressure**. Коллега «починил» через `setTimeout`, review: «используйте `pipeline`».

**Streams** — потоковая обработка данных кусками (chunks), без загрузки всего файла в память. В Node это основа `fs.createReadStream`, HTTP request/response, gzip, лог-агрегации.

## Что вы узнаете

- Readable и Writable: источник и приёмник данных
- События `data`, `end`, `error` vs async iteration
- `pipeline` из `node:stream/promises`
- **Backpressure** — почему `write()` может вернуть `false`
- Когда streams вместо `readFile` / `writeFile`
- Связь с HTTP и большими JSONL-логами shop

---

## Зачем streams, а не readFile

| Подход | Память | Когда |
|--------|--------|-------|
| `readFile` целиком | O(размер файла) | малые JSON, конфиги |
| Stream по chunks | O(размер chunk) | логи, CSV, видео, прокси HTTP |
| `readline` + stream | построчно | JSONL, access.log |

Shop-каталог на 50 KB — `readFile` OK. Выгрузка заказов за год — stream.

---

## Readable — чтение по кускам

```javascript
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const stream = createReadStream("data/large.log", { encoding: "utf8" });

stream.on("data", (chunk) => {
  console.log("chunk bytes:", Buffer.byteLength(chunk, "utf8"));
});

stream.on("end", () => console.log("done"));
stream.on("error", (err) => console.error(err));
```

**Async iteration** (предпочтительнее в async/await коде):

```javascript
for await (const chunk of createReadStream("data/large.log", { encoding: "utf8" })) {
  processChunk(chunk);
}
```

Опции `highWaterMark` задают размер внутреннего буфера (по умолчанию ~64 KB).

---

## Writable — запись по кускам

```javascript
import { createWriteStream } from "node:fs";

const out = createWriteStream("output/report.txt", { encoding: "utf8" });

out.write("line 1\n");
out.write("line 2\n");
out.end("line 3\n");

out.on("finish", () => console.log("file closed"));
out.on("error", (err) => console.error(err));
```

`write()` возвращает **boolean**:

```javascript
const ok = out.write(largeChunk);
if (!ok) {
  // backpressure: подождать drain
  await new Promise((resolve) => out.once("drain", resolve));
}
```

Если `false` — внутренний буфер переполнен; продолжать писать без паузы — рост памяти.

---

## Backpressure — концепция

```text
[Disk read fast]  ──►  [Transform slow]  ──►  [Disk write]
         │                      │
         └── буферы растут ──────┘
```

**Backpressure** — механизм «замедлить источник», когда приёмник не успевает:

1. `writable.write()` → `false`
2. источник слушает `'drain'` на writable
3. или использует `pipeline`, который делает это автоматически

Без backpressure — OOM на больших объёмах при «быстром» чтении.

---

## `pipeline` — правильное соединение

```javascript
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

await pipeline(
  createReadStream("data/access.log"),
  createGzip(),
  createWriteStream("data/access.log.gz")
);
```

`pipeline`:

- пробрасывает ошибки на все звенья;
- уничтожает streams при ошибке;
- координирует backpressure.

**Не** делайте так для production-копирования без обработки ошибок:

```javascript
// антипаттерн
createReadStream("a").pipe(createWriteStream("b"));
// ошибка на read может не закрыть write
```

Используйте `pipeline` или `stream.promises.pipeline`.

---

## Transform и pass-through (обзор)

```javascript
import { Transform } from "node:stream";

const upper = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  },
});

await pipeline(
  createReadStream("input.txt"),
  upper,
  createWriteStream("output.txt")
);
```

В лабе [14-lab-streams.md](14-lab-streams.md) — подсчёт строк через `readline` без Transform.

---

## Streams и HTTP

HTTP request/response в Node — streams ([15-http-module.md](15-http-module.md)):

```javascript
import { createServer } from "node:http";
import { pipeline } from "node:stream/promises";
import { createReadStream } from "node:fs";

createServer((req, res) => {
  if (req.method === "GET" && req.url === "/export") {
    res.writeHead(200, { "Content-Type": "application/json" });
    pipeline(createReadStream("data/catalog.json"), res).catch((err) => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
    return;
  }
  res.writeHead(404).end();
}).listen(3096);
```

Ответ **стримится** клиенту — TTFB раньше, чем прочитан весь файл.

---

## Object mode (кратко)

По умолчанию chunks — `Buffer` или string. `{ objectMode: true }` — chunks как JS-объекты (редко в basic; используется в некоторых парсерах).

---

## Связь с event loop

Чтение с диска — через libuv thread pool; chunks доставляются в main thread как callbacks. Долгий **синхронный** `processChunk` на каждый chunk блокирует loop — выносите тяжёлую работу или батчите.

Сравнение с [python-async](../python-async/README.md): asyncio `StreamReader` — аналог Readable.

---

## Типичные ошибки

- **`readFile` на гигабайтный файл** — heap OOM.
- **Игнор `write() === false`** — память растёт без drain.
- **`.pipe()` без обработки error** — висящие дескрипторы, partial files.
- **Забыли `end()`** на Writable — файл не закрыт, данные в буфере.
- **Смешение encoding** — `createReadStream` без `{ encoding: "utf8" }` даёт Buffer chunks.

---

## Резюме

- **Readable** читает данные частями; **Writable** пишет частями.
- **Backpressure** — writable сигнализирует «подождите» через `false` и `'drain'`.
- **`pipeline`** — безопасное соединение с автоматическим backpressure и cleanup.
- Большие файлы и прокси HTTP — streams; малый JSON каталога — `readFile`.

## Чек-лист

- Почему `readFile` на 2 GB файле опасен?
- Что возвращает `writable.write(chunk)` при переполнении буфера?
- Чем `pipeline` лучше голого `.pipe()`?
- Какие события у Readable при успешном завершении?
- Когда chunk — Buffer, а когда string?
- Как HTTP response связан со Writable stream?

Следующий урок: [14. Лаба: readline и потоковая обработка](14-lab-streams.md).
