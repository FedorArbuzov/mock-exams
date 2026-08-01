# 11. Lab: reading and writing the JSON catalog

The goal is to **implement a module** for loading and saving the shop catalog on disk: correct paths via `__dirname`, safe path handling, error handling. This is the same cycle as in [10-fs-path.md](10-fs-path.md), but hands-on — as you would before connecting the BFF to FastAPI `:8090`.

**Time:** ~25–35 minutes after the theory (~50–70 min for the 10+11 pair).

## Setup

```bash
cd courses/nodejs-basic/examples
node --version   # v20+ or v22+
```

Create the `lab/` directory if it doesn't exist yet. In `package.json` — `"type": "module"`. Reference — `solutions/lab/11-catalog/` (open it **after** your own attempt).

---

## Architecture

```text
examples/
├── package.json
└── lab/
    ├── 11-cli.js           # entry point — CLI
    ├── catalog-store.js    # load / save / addItem
    └── data/
        └── catalog.json    # initial data
```

---

## Task 0. Initial `catalog.json`

Create `lab/data/catalog.json`:

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

Save it as **UTF-8** without a BOM (VS Code: status bar → UTF-8).

---

## Task 1. `catalog-store.js` — paths

Implement the file path constant **relative to the module**, not cwd:

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

**Check:** from the `mock-exams` root the command `node courses/nodejs-basic/examples/lab/11-cli.js` should find the same file.

---

## Task 2. `loadCatalog()`

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

Handle `ENOENT` with a clear message: "Catalog file not found at …".

---

## Task 3. `saveCatalog(catalog)`

```javascript
export async function saveCatalog(catalog) {
  const json = JSON.stringify(catalog, null, 2) + "\n";
  await writeFile(CATALOG_FILE, json, "utf8");
}
```

Don't call `saveCatalog` on every input character — only after the structure changes.

---

## Task 4. `addItem(catalog, item)` — business logic

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

## Task 5. Path safety — deny traversal

Add a function that safely resolves a path **inside** `data/`:

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

Import `sep` from `node:path`. On Windows, `startsWith` for paths with a different drive-letter case is an edge case; for the lab this pattern is enough.

**Task:** implement `loadBackup(name)` that reads only `lab/data/backups/{name}.json` via `safeDataPath`.

---

## Task 6. CLI `11-cli.js`

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

Run:

```bash
node lab/11-cli.js
```

**Expected output (example):**

```text
Items count: 3
Last item: USB Hub
```

Running it again **without** resetting `catalog.json` will fail with `duplicate id: hd-003` — that's normal; restore the JSON or change the id.

---

## Task 7. Test a "broken" JSON

Manually corrupt the JSON (an extra comma), then run the CLI. Make sure the error points to the file, not a bare "Unexpected token" without context.

---

## Success criteria

- [ ] `node lab/11-cli.js` adds an item and saves the file
- [ ] The path to `catalog.json` doesn't depend on cwd
- [ ] A duplicate `id` is rejected with a clear error
- [ ] `safeDataPath("../../../etc/passwd")` throws an error
- [ ] The file on disk is valid, indented JSON
- [ ] After fixing broken JSON the script works again

---

## If something goes wrong

| Symptom | Check |
|---------|----------|
| `ENOENT` on catalog.json | `CATALOG_FILE` via `__dirname`; the file is in `lab/data/` |
| `JSON parse error` | UTF-8, valid JSON; no UTF-16 BOM |
| `duplicate id` on the first run | remove the added item from the JSON |
| A catalog is created in an unexpected place | no bare `"data/catalog.json"` without `join(__dirname, ...)` |
| Path traversal "passes through" | `resolve` + a `DATA_DIR` prefix check |

---

## Reflection

In a comment in `11-cli.js`, answer: why is path traversal relevant for an HTTP API (FastAPI `:8090`) with a parameter like `?file=../../../secret`?

---

## Related courses

| Lesson | Link |
|------|-------|
| [09-modules-cjs-esm.md](09-modules-cjs-esm.md) | ESM, `import.meta.url` |
| [10-fs-path.md](10-fs-path.md) | fs/path theory |
| [20-fastapi-client.md](20-fastapi-client.md) | the catalog with the API instead of JSON |

Next lesson: [12. Buffers and encodings](12-buffers-encoding.md).
