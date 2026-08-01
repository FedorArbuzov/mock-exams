# 14. Lab: readline and stream processing

The goal is to **process a large text file line by line** without loading it all into memory, and to **stream JSON** into an HTTP response. Practice for [13-streams.md](13-streams.md): `createReadStream`, `readline`, `pipeline`.

**Time:** ~30-40 minutes after the theory (~50-70 min for the 13+14 pair).

## Setup

```bash
cd courses/nodejs-basic/examples
node --version
```

Reference solution: `solutions/lab/14-streams/` (check after your own attempt).

---

## Preparing the data

Create `lab/data/access.log` (at least 20 lines):

```text
2024-01-15T10:00:01Z GET /api/v1/items 200 45ms
2024-01-15T10:00:02Z GET /health 200 2ms
2024-01-15T10:00:03Z POST /api/v1/items 201 120ms
2024-01-15T10:00:04Z GET /api/v1/items/999 404 5ms
```

Generator script (optional):

```javascript
// lab/generate-log.js — run once
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

## Task 1. Counting lines — `count-lines.js`

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

`crlfDelay: Infinity` handles `\r\n` correctly on Windows.

Run it:

```bash
node lab/generate-log.js   # if you don't have the large log yet
node lab/count-lines.js
```

**Expected:** `Lines: 50000` with no memory spike (check Task Manager if you'd like).

---

## Task 2. Filtering 404s — `filter-404.js`

Read `access.log` line by line, writing only the lines with ` 404 ` to `lab/data/404.log`:

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

An alternative would be building a Transform stream — for this lab, readline + Writable is enough.

---

## Task 3. Streaming JSON — NDJSON export

The file `lab/data/items.ndjson` has one JSON object per line:

```text
{"id":"kb-001","name":"Keyboard","price":79.9}
{"id":"ms-002","name":"Mouse","price":29.99}
```

Implement `streamItems(filePath, onItem)`:

```javascript
export async function streamItems(filePath, onItem) {
  const input = createReadStream(filePath, { encoding: "utf8" });
  const rl = createInterface({ input, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const item = JSON.parse(trimmed);
    await onItem(item); // an async callback is fine here
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

On a malformed JSON line, produce a clear error with context (wrap the parse call in try/catch).

---

## Task 4. HTTP — streaming the catalog (preview)

A mini server, `14-stream-server.js`, on port **3097**:

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

Check it:

```bash
curl http://localhost:3097/catalog
```

The full HTTP walkthrough is in [15-http-module.md](15-http-module.md); the server lab is [16-lab-http-server.md](16-lab-http-server.md).

---

## Success criteria

- [ ] `count-lines.js` counts 50k lines without OOM
- [ ] `filter-404.js` produces a non-empty `404.log` from the sample access.log
- [ ] `streamItems` parses NDJSON line by line
- [ ] `14-stream-server.js` serves the catalog via pipeline
- [ ] With catalog.json deleted, the server responds 500 without crashing the process

---

## If something goes wrong

| Symptom | Check |
|---------|----------|
| Memory grows during count | don't use `readFile`; readline only |
| Counter is 1 short | empty last line without `\n` |
| `write EPIPE` | the client closed the connection before pipeline finished — normal for curl -m |
| JSON parse fails on line 0 | BOM or empty line — trim / stripBom |
| Windows `\r` at the end of a field | crlfDelay in readline |

---

## Reflection

For a 100k-item listing API, why is **pagination** preferable to a single NDJSON stream to the browser?

---

Next lesson: [15. The `http` module: server and requests](15-http-module.md).
