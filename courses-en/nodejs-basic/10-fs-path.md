# 10. The `fs` and `path` modules

## A scenario from work

A deploy script needs to read `catalog.json`, add a new SKU, and write the file back. On Linux everything works; on Windows a colleague runs `node scripts/update.js` from the repo root — the script creates `data\catalog.json` in the **wrong place**, not where the source catalog lives. In the logs: `ENOENT: no such file or directory, open 'data/catalog.json'`. A second incident: after manually editing the JSON in Notepad, the server crashes with `SyntaxError: Unexpected token` — the file was saved as **UTF-16 LE** with a BOM.

Node doesn't block the event loop for **asynchronous** I/O via `fs/promises`. The `path` module builds paths independently of `\` and `/`. For the shop BFF, the product catalog is a local JSON before connecting FastAPI `:8090`.

## What you'll learn

- Reading and writing files via `node:fs/promises`
- Synchronous `fs` — when it's acceptable and why to avoid it in a server
- `path.join`, `path.resolve`, `path.basename`
- Anchoring paths to the **script file** via `__dirname` (ESM)
- Working with the shop catalog JSON files
- The `utf8` encoding when reading/writing

---

## Asynchronous `fs/promises`

The preferred API in modern Node:

```javascript
import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
```

**Reading a text file:**

```javascript
const raw = await readFile("/path/to/catalog.json", "utf8");
const catalog = JSON.parse(raw);
```

The second argument `"utf8"` (or `"utf-8"`) — Node returns a **string** rather than a `Buffer`. Without it `readFile` returns a binary `Buffer`.

**Writing:**

```javascript
const updated = { ...catalog, updatedAt: new Date().toISOString() };
await writeFile(
  "/path/to/catalog.json",
  JSON.stringify(updated, null, 2),
  "utf8"
);
```

`JSON.stringify(obj, null, 2)` — readable indentation for a Git diff.

**Checking existence:**

```javascript
try {
  await access("data/catalog.json", fsConstants.F_OK);
  console.log("file exists");
} catch {
  console.log("file missing");
}
```

---

## `path`: cross-platform paths

Windows uses `\`, POSIX uses `/`. `path.join` joins segments **correctly** for the current OS:

```javascript
import { join, resolve, basename, dirname, extname } from "node:path";

join("data", "shop", "catalog.json");
// Windows: data\shop\catalog.json
// Linux:   data/shop/catalog.json

basename("/var/app/data/catalog.json"); // catalog.json
extname("catalog.json");                 // .json
dirname("/var/app/data/catalog.json");   // /var/app/data
```

| Method | Purpose |
|-------|------------|
| `join(a, b, c)` | segments without duplicated separators |
| `resolve(...)` | absolute path from cwd or from the given segments |
| `basename` | file name |
| `dirname` | file's directory |

**`resolve` vs `join`:** `resolve("data", "x.json")` gives an absolute path from the current cwd. `join` only concatenates. For data next to the script, use `join(__dirname, "data", "catalog.json")`.

---

## `__dirname` in ESM and the catalog JSON

Structure for the shop labs:

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

Example `catalog.json`:

```json
{
  "version": 1,
  "items": [
    { "id": "kb-001", "name": "Keyboard", "price": 79.9, "category": "peripherals" },
    { "id": "ms-002", "name": "Mouse", "price": 29.99, "category": "peripherals" }
  ]
}
```

The path does **not** depend on which directory you ran `node` from:

```bash
cd courses/nodejs-basic/examples
node lab/load-catalog.js
# or
node examples/lab/load-catalog.js   # from the mock-exams root — still finds data/
```

---

## Synchronous `fs` — carefully

```javascript
import { readFileSync, writeFileSync } from "node:fs";

const raw = readFileSync(catalogPath, "utf8");
```

Synchronous calls **block** the event loop for the duration of the disk operation. For a CLI script at 100 ms it's acceptable. For an HTTP server under load — no: one large `readFileSync` will delay all requests.

| Context | Recommendation |
|----------|--------------|
| HTTP server, BFF | `fs/promises` |
| One-off CLI, config on startup | sync is sometimes OK |
| Large files | streams ([13-streams.md](13-streams.md)) |

---

## Creating a directory before writing

```javascript
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

async function writeJson(filePath, data) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}
```

`{ recursive: true }` — doesn't fail if the directory already exists (Node 10+).

---

## Handling fs errors

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

Common `err.code` values: `ENOENT` (no file), `EACCES` (permissions), `EISDIR` (the path is a directory).

---

## Link to the mock-exams ecosystem

| Component | Role |
|-----------|------|
| Local `catalog.json` | a prototype before FastAPI `:8090` |
| [deploy/fastapi](../../deploy/fastapi/README.md) | the source of truth for items in prod |
| [11-lab-fs.md](11-lab-fs.md) | lab: catalog CRUD with path safety |

---

## Common mistakes

- **A relative path from cwd** — `readFile("data/catalog.json")` breaks when run from a different directory.
- **Forgot `"utf8"`** — you get a `Buffer`, and `JSON.parse` fails.
- **Notepad / UTF-16** — a BOM breaks `JSON.parse`; save as UTF-8 (VS Code, `writeFile` with `"utf8"`).
- **`readFileSync` in a request handler** — blocking the loop under concurrent requests.
- **String concatenation** `"dir" + "/" + file` instead of `path.join` — double slashes, errors on Windows.

---

## Summary

- Use **`node:fs/promises`** and **`node:path`** in ESM code.
- Anchor to data with **`join(__dirname, "data", "file.json")`**, not a bare relative path.
- JSON: `readFile(..., "utf8")` → `JSON.parse`; writing — `JSON.stringify` + `writeFile`.
- Synchronous fs — only for short CLIs, not for a server.

## Checklist

- How does `readFile(path, "utf8")` differ from `readFile(path)` without an encoding?
- Why `path.join` instead of concatenating strings?
- How do you get the absolute path to `data/catalog.json` relative to the **script** file?
- Why is `readFileSync` dangerous in an HTTP handler?
- What does `err.code === "ENOENT"` mean?
- Why `mkdir(..., { recursive: true })` before the first write?

Next lesson: [11. Lab: reading and writing files](11-lab-fs.md).
