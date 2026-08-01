# 13. Streams: Readable, Writable, pipeline

## A story from work

An import script reads `orders-2024.jsonl` — **2.4 GB** — using `readFile` + `split`. Node crashes with **JavaScript heap out of memory**: the whole file gets loaded into a single string. After switching to streams, memory stays flat, but a new problem shows up: disk writes happen faster than parsing, and RAM keeps climbing — **backpressure**. A coworker "fixed" it with `setTimeout`; the review comment: "use `pipeline`."

**Streams** process data in pieces (chunks) instead of loading the whole file into memory. In Node, they're the foundation of `fs.createReadStream`, HTTP requests/responses, gzip, and log aggregation.

## What you'll learn

- Readable and Writable: data sources and sinks
- `data`, `end`, `error` events vs async iteration
- `pipeline` from `node:stream/promises`
- **Backpressure** — why `write()` can return `false`
- When to use streams instead of `readFile` / `writeFile`
- The connection to HTTP and the shop's large JSONL logs

---

## Why streams instead of readFile

| Approach | Memory | When |
|--------|--------|-------|
| `readFile` whole file | O(file size) | small JSON, configs |
| Stream by chunks | O(chunk size) | logs, CSV, video, HTTP proxying |
| `readline` + stream | line by line | JSONL, access.log |

A 50 KB shop catalog — `readFile` is fine. A year's worth of order exports — stream it.

---

## Readable — reading in chunks

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

**Async iteration** (preferred in async/await code):

```javascript
for await (const chunk of createReadStream("data/large.log", { encoding: "utf8" })) {
  processChunk(chunk);
}
```

The `highWaterMark` option sets the internal buffer size (default is about 64 KB).

---

## Writable — writing in chunks

```javascript
import { createWriteStream } from "node:fs";

const out = createWriteStream("output/report.txt", { encoding: "utf8" });

out.write("line 1\n");
out.write("line 2\n");
out.end("line 3\n");

out.on("finish", () => console.log("file closed"));
out.on("error", (err) => console.error(err));
```

`write()` returns a **boolean**:

```javascript
const ok = out.write(largeChunk);
if (!ok) {
  // backpressure: wait for drain
  await new Promise((resolve) => out.once("drain", resolve));
}
```

If it returns `false`, the internal buffer is full — continuing to write without pausing means growing memory.

---

## Backpressure — the concept

```text
[Disk read fast]  ──►  [Transform slow]  ──►  [Disk write]
         │                      │
         └── buffers keep growing ──┘
```

**Backpressure** is the mechanism for "slowing down the source" when the consumer can't keep up:

1. `writable.write()` returns `false`
2. the source listens for `'drain'` on the writable
3. or it uses `pipeline`, which does this automatically

Without backpressure, you get OOM on large volumes when reading is "fast."

---

## `pipeline` — connecting streams correctly

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

- propagates errors through every link in the chain;
- destroys the streams on error;
- coordinates backpressure.

**Don't** do this for production copying without error handling:

```javascript
// anti-pattern
createReadStream("a").pipe(createWriteStream("b"));
// a read error might not close the write stream
```

Use `pipeline` or `stream.promises.pipeline`.

---

## Transform and pass-through (overview)

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

In the lab [14-lab-streams.md](14-lab-streams.md) we count lines using `readline`, without a Transform.

---

## Streams and HTTP

HTTP requests/responses in Node are streams ([15-http-module.md](15-http-module.md)):

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

The response **streams** to the client — TTFB happens before the whole file is read.

---

## Object mode (briefly)

By default, chunks are `Buffer`s or strings. `{ objectMode: true }` makes chunks JS objects (rare in the basics; used by some parsers).

---

## The connection to the event loop

Disk reads go through the libuv thread pool; chunks arrive on the main thread as callbacks. A long **synchronous** `processChunk` call on every chunk blocks the loop — offload heavy work or batch it.

Compare with [python-async](../python-async/README.md): asyncio's `StreamReader` is the analog of Readable.

---

## Common mistakes

- **`readFile` on a gigabyte-sized file** — heap OOM.
- **Ignoring `write() === false`** — memory grows without a drain wait.
- **`.pipe()` without error handling** — hanging file descriptors, partial files.
- **Forgetting `end()`** on a Writable — the file never closes, data stays buffered.
- **Mixing up encoding** — `createReadStream` without `{ encoding: "utf8" }` gives you Buffer chunks.

---

## Summary

- **Readable** reads data in pieces; **Writable** writes it in pieces.
- **Backpressure** — the writable signals "wait" via `false` and `'drain'`.
- **`pipeline`** is the safe way to connect streams, with automatic backpressure and cleanup.
- Large files and HTTP proxying call for streams; a small catalog JSON is fine with `readFile`.

## Checklist

- Why is `readFile` on a 2 GB file dangerous?
- What does `writable.write(chunk)` return when the buffer overflows?
- How is `pipeline` better than a bare `.pipe()`?
- Which events does a Readable emit on successful completion?
- When is a chunk a Buffer, and when is it a string?
- How does an HTTP response relate to a Writable stream?

Next lesson: [14. Lab: readline and stream processing](14-lab-streams.md).
