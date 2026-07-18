# 15. Lab: methods for a shop service

## Lab goal

Build a small shop inventory service: a struct, **pointer receivers**, and methods on top of `map[string]*Product`. Reinforces methods, maps, and structs.

**Time:** ~50–60 minutes.
**Environment:** `courses/go-basic-en/examples`, Go 1.22+.

## Setup

```bash
cd courses/go-basic-en/examples
mkdir -p lab/15shop
```

File `lab/15shop/main.go` (package `main`), or split it into `shop/shop.go` + `main.go` within the same module.

---

## Task 1. Types and constructor

### Model

```go
type Product struct {
	SKU      string
	Name     string
	Price    int // kopecks, an integer
	Quantity int
}

type Shop struct {
	stock map[string]*Product // key — SKU
}
```

Implement:

```go
func NewShop() *Shop
```

- Inside: `stock: make(map[string]*Product)`.
- Returns `*Shop`, not a value — from here on, only pointer receivers.

### Criteria

- [ ] `NewShop().stock` is not nil.
- [ ] You can't write to the map before calling `NewShop`.

---

## Task 2. Catalog methods

Implement on `*Shop`:

| Method | Behavior |
|--------|-----------|
| `AddProduct(p Product) error` | If the SKU already exists — an `error`. Otherwise store a **copy** or a pointer to a new `Product` in the map (justify your choice in a comment). |
| `Get(sku string) (*Product, bool)` | comma ok; doesn't panic on an empty SKU. |
| `ListSKUs() []string` | A slice of all keys; order doesn't matter. |

### Hint for ListSKUs

```go
out := make([]string, 0, len(s.stock))
for sku := range s.stock {
	out = append(out, sku)
}
return out
```

### Criteria

- [ ] A duplicate SKU returns an error, the map doesn't change.
- [ ] `Get` on a missing SKU → `nil, false`.

---

## Task 3. Warehouse operations (mutation)

| Method | Behavior |
|--------|-----------|
| `Restock(sku string, delta int) error` | No such SKU → error. `delta < 0` and the result `< 0` → error. Otherwise `Quantity += delta`. |
| `SetPrice(sku string, price int) error` | `price < 0` → error. No such SKU → error. |
| `TotalValue() int` | The sum of `Price * Quantity` across all products. |

All methods are **pointer receivers**: `func (s *Shop)`.

### Demo in main

```go
shop := NewShop()
shop.AddProduct(Product{SKU: "TEA", Name: "Tea", Price: 12000, Quantity: 10})
shop.Restock("TEA", 5)
shop.SetPrice("TEA", 13000)
fmt.Println(shop.TotalValue()) // 13000 * 15 = 195000
```

### Criteria

- [ ] `Restock` changes the quantity in the map (visible through a subsequent `Get`).
- [ ] `TotalValue` on an empty shop → `0`.

---

## Task 4. String for debugging (value receiver)

Add to `Product`:

```go
func (p Product) String() string
```

Format: `TEA: Tea (13000 kop x 15)` — use the struct's fields. A **value receiver** is enough (read-only).

On `*Shop` (optional):

```go
func (s *Shop) String() string // "Shop: N products"
```

### Question

Why can `String()` on `Product` be a value receiver, while `Restock` must be a pointer receiver?

---

## Task 5 (bonus). Table-driven smoke test

In `shop_test.go` (package `shop` or `main` with `_test`):

```go
func TestRestock(t *testing.T) {
	tests := []struct {
		name    string
		delta   int
		wantErr bool
	}{
		{"ok", 5, false},
		{"negative stock", -100, true},
	}
	// ...
}
```

A full table-driven test is more involved; one case is enough here.

---

## Lab summary checklist

- [ ] `NewShop` initializes the map
- [ ] `AddProduct` / `Get` / `Restock` return the right errors
- [ ] Pointer receivers on mutating methods
- [ ] `Product.String()` for logs
- [ ] You understand the method set for `*Shop` vs `Shop`

## If something goes wrong

| Symptom | Cause |
|----------|---------|
| Restock isn't visible outside | value receiver on Shop |
| panic on nil map | forgot `NewShop` |
| duplicate isn't caught | didn't check `_, ok := s.stock[sku]` |

Next lesson: [16. Control flow](16-control-flow.md).
