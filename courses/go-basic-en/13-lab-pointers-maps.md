# 13. Lab: pointers and maps

## Lab goal

Reinforce pointers and maps in practice: mutating a struct through a pointer, safely working with a `nil` map, a SKU → quantity index. After the lab you'll be able to explain **why** `addStock(p Product)` doesn't change the original, and **why** `var m map[string]int` panics on write.

**Time:** ~45–55 minutes.
**Environment:** Go 1.22+, module [`examples/`](examples/go.mod).

## Setup

```bash
cd courses/go-basic-en/examples
go version   # go1.22+
mkdir -p lab/13pointersmaps
```

Create `main` packages in subdirectories, or a single file `lab/13pointersmaps/main.go` with the functions from the tasks. Run with:

```bash
go run ./lab/13pointersmaps
```

---

## Task 1. Inventory: a pointer to Product

### Scenario

The shop's mini-warehouse stores `Product`. You need a `restock` function that increases `Quantity` **for the caller**.

### Types

```go
type Product struct {
	SKU      string
	Quantity int
}

// TODO: restock(p *Product, delta int)
```

### Step by step

1. Implement `restock` with the mutation logic through a pointer (a function, not a method — methods come later).
2. In `main`: `p := Product{SKU: "TEA-01", Quantity: 10}` → `restock(&p, 5)` → the printed value shouldn't be `20`; it should be `15`.
3. Add a call with `delta < 0` where `Quantity+delta < 0` — it should **not** go negative; return an `error` instead.

### Criteria

- [ ] After `restock(&p, n)`, `p.Quantity` changes outside the function.
- [ ] `restock(p, n)` called **without** `&` (try it by hand and comment out the demonstration) — the quantity doesn't change.
- [ ] A negative resulting stock is blocked with an `error`.

### Common mistakes

| Symptom | Cause |
|---------|---------|
| Quantity doesn't change | the parameter is `Product`, not `*Product` |
| panic | dereferencing a nil `*Product` |

---

## Task 2. Price cache: map and comma ok

### Scenario

A price cache `map[string]int` keyed by SKU. The function `getPrice(cache map[string]int, sku string) (int, bool)` returns the price and a presence flag.

### Requirements

1. `getPrice` doesn't panic on a `nil` cache — reading from a nil map is allowed.
2. The function `setPrice(cache map[string]int, sku string, price int) error` — if `cache == nil`, return the error `"cache not initialized"`; otherwise write to it.
3. In `main`, show: an uninitialized cache + `setPrice` → an error; `make(map[string]int)` + `setPrice` → ok.

### Verification

```go
var cache map[string]int
err := setPrice(cache, "A1", 100) // err != nil

cache = make(map[string]int)
setPrice(cache, "A1", 100)
price, ok := getPrice(cache, "A1") // 100, true
_, ok = getPrice(cache, "MISSING")  // 0, false
```

### Criteria

- [ ] comma ok distinguishes a missing key from a price of `0`.
- [ ] Writing to a nil map doesn't happen — the error is returned before the assignment.

---

## Task 3. Merge inventory

### Scenario

Two warehouses each hand you a `map[string]int` (SKU → qty). You need `mergeStock(a, b map[string]int) map[string]int` — a **new** map with the sums per key (a key present only in `b` also ends up in the result).

### Hint

```go
out := make(map[string]int, len(a)+len(b))
for sku, q := range a {
	out[sku] = q
}
for sku, q := range b {
	out[sku] += q
}
return out
```

### Criteria

- [ ] The original `a` and `b` are not mutated.
- [ ] Keys present only in `b` show up too.
- [ ] Duplicates get summed.

---

## Task 4. In-memory index (bonus)

Implement `type StockIndex struct { items map[string]*Product }` with the methods:

- `NewStockIndex() *StockIndex` — the map is initialized via `make`.
- `Get(sku string) (*Product, bool)` — comma ok.
- `Upsert(p *Product) error` — if `p == nil`, an error; otherwise store the pointer in the map.

**Self-check question:** if the caller later changes `p.Quantity` from outside, will what `Get` returns change too? Why?

The answer ties pointers and maps together.

---

## Lab summary checklist

- [ ] `restock` only works with `*Product`
- [ ] `setPrice` guards against a nil map
- [ ] `getPrice` uses comma ok
- [ ] `mergeStock` returns a new map
- [ ] You can explain out loud a nil map vs `make`

## If something goes wrong

| Problem | Solution |
|----------|---------|
| `go: cannot find module` | `cd examples`, check `go.mod` |
| panic on nil map | `make` before writing |
| merge "ate" keys | the second loop over `b` needs `+=` |

Next lesson: [14. Methods and receivers](14-methods.md).
