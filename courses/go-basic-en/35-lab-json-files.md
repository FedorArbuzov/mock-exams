# 35. Lab: saving shop data to a JSON file

The goal is to build a **persistence** pipeline: a `Product` struct with validation, a `CatalogStore` for in-memory CRUD, and reading/atomically writing a JSON file.

```text
Product struct  →  Validate  →  CatalogStore  →  shop.json (atomic)
```

**Time:** ~35–50 minutes.

## Setup

```bash
cd courses/go-basic-en/examples
go version   # 1.22+
```

Create a package in `lab/35shop/` (or `lab/shopstore/`). The module is already declared in [`go.mod`](examples/go.mod).

### Target structure

```text
examples/lab/35shop/
├── main.go           # flag --data, Add/List demo
├── product.go        # Product, Catalog, ValidateProduct
├── product_test.go   # table-driven validation
├── store.go          # CatalogStore, Load/Save, CRUD
├── fileutil.go       # writeAtomic
└── fileutil_test.go  # atomic write in t.TempDir()
```

```bash
go run ./lab/35shop
```

A reference solution, after your own attempt — [`examples/solutions/lab/35shop/`](examples/solutions/) (open it only after 5–15 minutes of your own attempt).

---

## Prerequisites

- You've read the previous chapters: JSON, time, files and I/O.
- You understand `if err != nil` and exported struct fields.

---

## Data model

```go
type Product struct {
	ID          int       `json:"id"`
	SKU         string    `json:"sku"`
	Name        string    `json:"name"`
	Price       float64   `json:"price"`
	Description string    `json:"description,omitempty"`
	InStock     bool      `json:"in_stock"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Catalog struct {
	SchemaVersion int       `json:"schema_version"`
	Products      []Product `json:"products"`
}
```

| Field | Rules |
|------|---------|
| `schema_version` | constant `1` when saving |
| `id` | unique, > 0 |
| `sku` | not empty, unique within the catalog |
| `name` | 1–200 characters |
| `price` | ≥ 0 |
| `updated_at` | RFC3339 in JSON |

---

## Task 1. `Product` validation

File `product.go`:

```go
package shop

import "time"

var (
	ErrEmptyName  = errors.New("product name is required")
	ErrInvalidID  = errors.New("product id must be positive")
	// TODO: your own sentinel errors for sku, price
)

func ValidateProduct(p Product) error {
	// TODO
	return nil
}
```

**Requirements:**

- Empty `name` → `ErrEmptyName` (or a wrapped error with context).
- `id <= 0` → an error.
- `price < 0` → an error.
- Empty `sku` → an error.

**Verification** — a table-driven test in `product_test.go` (at least 4 cases).

```bash
go test ./lab/35shop/...
```

---

## Task 2. An in-memory `CatalogStore`

File `store.go`:

```go
type CatalogStore struct {
	path string
	data Catalog
}

func NewCatalogStore(path string) *CatalogStore {
	return &CatalogStore{
		path: path,
		data: Catalog{SchemaVersion: 1, Products: []Product{}},
	}
}

func (s *CatalogStore) List() []Product {
	// TODO: return a copy of the slice, not the internal array
}

func (s *CatalogStore) GetByID(id int) (Product, error) {
	// TODO: ErrNotFound if not found
}

func (s *CatalogStore) Add(p Product) error {
	// TODO: ValidateProduct, check for a duplicate id/sku, UpdatedAt = time.Now().UTC()
}

func (s *CatalogStore) Update(p Product) error {
	// TODO
}

func (s *CatalogStore) Delete(id int) error {
	// TODO
}
```

**`Add` behavior:**

- Set `UpdatedAt = time.Now().UTC()` if it's zero.
- Reject a duplicate `id` or `sku`.

**Important:** `List()` must not let the caller mutate the internal slice from outside — return `append([]Product(nil), s.data.Products...)` or an equivalent copy.

---

## Task 3. `Load` and `Save`

In the same `store.go`:

```go
func (s *CatalogStore) Load() error {
	// os.ReadFile(s.path)
	// if os.IsNotExist — an empty catalog, nil error
	// json.Unmarshal
	// if schema_version is unknown — an error with a clear message
}

func (s *CatalogStore) Save() error {
	// json.MarshalIndent
	// writeAtomic (the function from task 4)
}
```

| Situation | Behavior |
|----------|----------|
| No file | an empty catalog, `Load` → `nil` |
| Corrupted JSON | an error, not a silent reset |
| Successful save | file `data/shop.json` with 2-space indentation |

Call `Save()` after every mutation (`Add`, `Update`, `Delete`) — or explicitly document a batch mode in the lab's README.

---

## Task 4. `writeAtomic`

File `fileutil.go`:

```go
func writeAtomic(path string, data []byte, perm os.FileMode) error {
	// MkdirAll for Dir(path)
	// WriteFile path+".tmp"
	// Rename tmp → path
}
```

Implement the atomic-write pattern: a temporary file plus `Rename`. Cover it with a test using `t.TempDir()`.

---

## Task 5. CLI demo `main.go`

```go
package main

func main() {
	path := flag.String("data", "data/shop.json", "catalog JSON path")
	flag.Parse()

	store := shop.NewCatalogStore(*path)
	if err := store.Load(); err != nil {
		fmt.Fprintln(os.Stderr, "load:", err)
		os.Exit(1)
	}

	// Demo: Add two products, List, a restart should show the same data
}
```

**Manual check:**

```bash
rm -f data/shop.json
go run ./lab/35shop
cat data/shop.json
go run ./lab/35shop   # the data is still there
```

**Expected fragment of `data/shop.json`:**

```json
{
  "schema_version": 1,
  "products": [
    {
      "id": 1,
      "sku": "KB-001",
      "name": "Keyboard",
      "price": 79.99,
      "in_stock": true,
      "updated_at": "2024-06-18T10:30:00Z"
    }
  ]
}
```

An empty `description` is **absent** from the file thanks to `omitempty`.

---

## Task 6 (optional). Search and filter

```go
func (s *CatalogStore) Search(keyword string) []Product
func (s *CatalogStore) ListInStock(only bool) []Product
```

A case-insensitive search over `name` and `sku` — `strings.EqualFold` or `strings.Contains(strings.ToLower(...))`.

---

## Success criteria

- [ ] `go test ./lab/35shop/...` — passing tests for `ValidateProduct` and `writeAtomic`
- [ ] The first run creates `data/shop.json` after adding a product
- [ ] The second run reads the same catalog
- [ ] Corrupted JSON on `Load` → exit 1 in `main` with a message on stderr
- [ ] `List()` returns a copy, not the internal slice
- [ ] Fields in the JSON are `snake_case`, and an empty `description` is absent (`omitempty`)

---

## If something goes wrong

| Symptom | Likely cause | Action |
|---------|-------------------|----------|
| `{}` instead of a catalog | struct without exported fields | capitalize field names + add json tags |
| `updated_at` has a strange date | zero `time.Time` | set `time.Now().UTC()` |
| File isn't where expected | different cwd | `pwd`, the `--data` flag |
| `permission denied` | no `data/` directory | `MkdirAll` in `writeAtomic` |
| Tests fail on Windows | a path with `\` | use only `filepath.Join` |
| A duplicate id silently overwrites | no check in `Add` | search by id before appending |

---

## Lab summary

You connected the **model** (struct + validation), **persistence** (JSON file + atomic write), and **tests**.

**Next:** [36-interview-qa.md](36-interview-qa.md).
