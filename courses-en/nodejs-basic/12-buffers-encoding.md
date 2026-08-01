# 12. Buffers and encodings

## A scenario from work

A microservice reads a CSV export from 1C and returns it in an HTTP response. On staging (Linux) the Cyrillic in product names is correct; on a Windows laptop QA sees "РџСЂРёРЅС‚" instead of "Принтер". The developer called `readFile` without an encoding, got a `Buffer`, and did `.toString()` without an argument — Node used UTF-8, but the file was in **Windows-1251**. A second bug: `writeFile` wrote the JSON, but another service can't parse it — there's a **BOM** `EF BB BF` at the start of the file.

In Node.js binary data is represented by **`Buffer`** — an array-like object of bytes. Text on disk and on the wire is always bytes; the **encoding** determines how characters ↔ bytes map. For the shop catalog and HTTP bodies, the course standardizes on **UTF-8**.

## What you'll learn

- What a `Buffer` is and when `readFile` returns one
- Explicitly specifying `"utf8"` / `"utf-8"`
- `Buffer.from`, `buf.toString(encoding)`
- BOM and the problems with Windows editors
- Comparing buffers, length in bytes vs characters
- The link Buffer ↔ streams ([13-streams.md](13-streams.md))

---

## Buffer in Node.js

`Buffer` is memory allocated outside the V8 heap for I/O:

```javascript
import { readFile } from "node:fs/promises";

// without an encoding — Buffer
const buf = await readFile("data/catalog.json");
console.log(Buffer.isBuffer(buf)); // true
console.log(buf.length);           // size in BYTES

// with utf8 — string
const text = await readFile("data/catalog.json", "utf8");
console.log(typeof text); // string
```

| API | Result |
|-----|-----------|
| `readFile(path)` | `Buffer` |
| `readFile(path, "utf8")` | `string` (UTF-8 decode inside) |
| `writeFile(path, string, "utf8")` | string → UTF-8 bytes on disk |
| `writeFile(path, buffer)` | bytes as-is |

---

## Creating and converting

```javascript
const buf1 = Buffer.from("Привет", "utf8");
const buf2 = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);

console.log(buf1.toString("utf8")); // Привет
console.log(buf2.toString("utf8")); // Hello

const hex = buf1.toString("hex");
console.log(hex); // d09f0440043504350442...
```

**Important:** the string length in characters ≠ the Buffer length in bytes for non-ASCII:

```javascript
const s = "€";
console.log(s.length);                    // 1 (one character)
console.log(Buffer.from(s, "utf8").length); // 3 bytes in UTF-8
```

---

## UTF-8 as the course standard

JSON, HTTP JSON, FastAPI `:8090` — **UTF-8** without a BOM:

```javascript
await writeFile(
  "catalog.json",
  JSON.stringify(data, null, 2) + "\n",
  "utf8"
);
```

The HTTP header ([15-http-module.md](15-http-module.md)):

```javascript
res.setHeader("Content-Type", "application/json; charset=utf-8");
```

---

## Encoding problems on Windows

### UTF-16 and Notepad

Old Notepad saved "Unicode" as **UTF-16 LE** with a BOM `FF FE`. `JSON.parse` on such a file:

```text
SyntaxError: Unexpected token '' ...
```

**Fix:** VS Code / `writeFile(..., "utf8")`; when reading others' files — detect it or agree on UTF-8.

### UTF-8 BOM

Some editors add a BOM `EF BB BF` at the start of UTF-8. `JSON.parse` can fail on the first `{` character.

```javascript
function stripBom(text) {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

const catalog = JSON.parse(stripBom(raw));
```

### CP1251 / legacy CSV

If the source is explicitly Windows-1251:

```javascript
import { readFile } from "node:fs/promises";
// Node doesn't decode cp1251 in readFile directly — you need Buffer + iconv-lite
// or conversion to UTF-8 at the export stage
const buf = await readFile("export.csv");
const text = buf.toString("utf8"); // WRONG for cp1251
```

In practice: **agree on UTF-8 at the boundary between systems**; for legacy — the `iconv-lite` package (in the intermediate course).

### `toString()` without an argument

```javascript
buffer.toString(); // equivalent to utf8
```

If the bytes aren't UTF-8 — garbage without a throw. Specify the encoding explicitly and validate the source.

---

## Buffer and the HTTP body

When working with the `http` module ([15-http-module.md](15-http-module.md)) the request body is assembled from chunks:

```javascript
const chunks = [];
for await (const chunk of req) {
  chunks.push(chunk); // chunk is a Buffer
}
const body = Buffer.concat(chunks).toString("utf8");
```

For a JSON API, check the `Content-Type` and the body size limit.

---

## Comparing and copying

```javascript
const a = Buffer.from("abc");
const b = Buffer.from("abc");
const c = Buffer.from("abd");

console.log(a.equals(b)); // true — safe content comparison
console.log(a.equals(c)); // false

const copy = Buffer.from(a); // a copy
```

Don't compare secrets via `===` on strings (timing attack) in auth code — for fs labs `equals` is enough.

---

## `TextEncoder` / `TextDecoder` (Web API in Node)

An alternative to Buffer for UTF-8:

```javascript
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

const bytes = encoder.encode("shop");
const text = decoder.decode(bytes);
```

Convenient for interop with `fetch` and TypedArray; for fs the course uses `"utf8"` in `readFile`/`writeFile`.

---

## Link to previous lessons

| Lesson | Link |
|------|-------|
| [10-fs-path.md](10-fs-path.md) | `"utf8"` when reading/writing JSON |
| [11-lab-fs.md](11-lab-fs.md) | saving the catalog without a BOM |
| [13-streams.md](13-streams.md) | chunks as Buffer in streams |

---

## Common mistakes

- **`readFile` without an encoding** + `JSON.parse(buf)` — parse expects a string; the implicit coercion breaks.
- **The editor saved UTF-16** — SyntaxError on JSON.parse.
- **A BOM at the start of JSON** — strip it or configure the editor.
- **Mixing cp1251 and utf8** — mojibake in product names.
- **Confusing `length`** — Buffer bytes vs string characters for Unicode.

---

## Summary

- `readFile` without a second argument → a **Buffer**; for text specify **`"utf8"`**.
- The course and FastAPI use **UTF-8**; avoid UTF-16 and a BOM in JSON.
- On Windows, check the encoding in the editor and in the CSV export pipeline.
- In streams and HTTP, chunks arrive as **Buffer** — decode them explicitly.

## Checklist

- When does `readFile` return a Buffer, and when a string?
- How many bytes does the character "€" take in UTF-8?
- What is a BOM and why does it break JSON.parse?
- Why `buffer.toString("utf8")` with an explicit encoding?
- How is `Buffer.concat(chunks)` useful when reading an HTTP body?
- What charset do you specify in `Content-Type` for a JSON API?

Next lesson: [13. Streams: Readable, Writable, pipeline](13-streams.md).
