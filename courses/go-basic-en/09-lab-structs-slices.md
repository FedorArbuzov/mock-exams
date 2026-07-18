# 09. Lab: structs and slices (shop)

## Why this lab

This lab connects structs and slices in a single end-to-end example — a product catalog and a cart:

```text
[]Product (catalog)  →  filter / find  →  Cart (slice + methods)  →  total cents
```

The tasks reinforce filtering a slice without mutating the source data (task 4) and accumulating elements via `append` (task 3).

## Prerequisites

- You've read [07. Structs](07-structs.md) and [08. Slices](08-slices-arrays.md).
- Working directory:

```bash
cd courses/go-basic-en/examples
go version
```

Module `github.com/mock-exams/go-basic-en-labs`. Reference solutions are in `examples/solutions/` — check them after you've made an attempt.

---

## Setup: the Product type

Create a `lab/09shop` package (one directory with several files **or** a single `main.go` — for this course, a single file is fine for simplicity).

Base types:

```go
package main

type Product struct {
	ID         int64
	Title      string
	PriceCents int64
	Category   string
	InStock    bool
}

func catalog() []Product {
	return []Product{
		{ID: 1, Title: "Keyboard", PriceCents: 7999, Category: "electronics", InStock: true},
		{ID: 2, Title: "Mouse", PriceCents: 2999, Category: "electronics", InStock: true},
		{ID: 3, Title: "Desk", PriceCents: 19900, Category: "furniture", InStock: false},
	}
}
```

---

## Task 1. Catalog overview

**Context:** the CLI `go run ./lab/09shop` as an offline snapshot of the catalog.

In `main`:

```go
func main() {
	products := catalog()
	fmt.Println("count:", len(products))
	fmt.Println("first:", products[0].Title)
	fmt.Println("categories:", uniqueCategories(products))
}
```

Implement `uniqueCategories(products []Product) []string` — unique categories, in order of first appearance. Without a `map` (a topic for a future chapter), or with one if you'd like.

**Criterion:** `count: 3`, `first: Keyboard`, two categories: `electronics`, `furniture`.

```bash
go run ./lab/09shop
```

---

## Task 2. Filter and search

**Context:** the "Electronics in stock" block — filtering the catalog by category and price.

```go
func filterByCategory(products []Product, category string) []Product {
	// a new slice, don't mutate products
}

func titlesUnderPrice(products []Product, maxCents int64) []string {
	// title where PriceCents < maxCents
}
```

Check in `main`:

```go
fmt.Println(len(filterByCategory(products, "electronics"))) // 2
fmt.Println(titlesUnderPrice(products, 5000))                 // [Mouse]
```

**Criterion:** `filterByCategory` doesn't change the length of the original `catalog()` on repeated calls.

---

## Task 3. Cart via append

**Context:** the cart is a `Cart` with a slice of elements, filled via `append`.

```go
type CartItem struct {
	Product  Product
	Quantity int
}

type Cart struct {
	Items []CartItem
}

func (c *Cart) Add(p Product, qty int) {
	// append a CartItem; pointer receiver — a preview of methods
}

func (c Cart) TotalCents() int64 {
	var sum int64
	for _, it := range c.Items {
		sum += it.Product.PriceCents * int64(it.Quantity)
	}
	return sum
}
```

In `main`: add Keyboard x2 and Mouse x1, print `TotalCents`.

**Criterion:** `15998 + 2999 = 18997` (check the arithmetic). Use `*Cart` for `Add`.

---

## Task 4. Discount without mutating the catalog

**Context:** a -10% promo on electronics — the source slice in the "cache" must not change.

```go
func applyDiscountCopy(products []Product, category string, percent int) []Product {
	out := make([]Product, len(products))
	copy(out, products)
	for i := range out {
		if out[i].Category == category {
			discount := out[i].PriceCents * int64(percent) / 100
			out[i].PriceCents -= discount
		}
	}
	return out
}
```

In `main`: call it on `catalog()`, then print `products[0].PriceCents` from the **original** again — still `7999`.

**Criterion:** discounted keyboard `7199` (10% off 7999), original unchanged.

---

## Task 5. The shared-backing trap (optional, but useful)

**Context:** debugging "why did the catalog get corrupted" after a sub-slice.

In a comment or a separate `demoSliceTrap()` function:

```go
all := catalog()
view := all[:2]
view = append(view, Product{ID: 99, Title: "Hacked", PriceCents: 1})
// what happens to all? explain in a comment
```

Run it, check `len(all)` and its contents. Explain when `append` stops affecting `all` (cap exhausted — a new array).

---

## Success criteria

- [ ] `go run ./lab/09shop` from `examples/` runs without errors
- [ ] `filterByCategory` / `titlesUnderPrice` produce the expected output
- [ ] `Cart.TotalCents()` for three units of product
- [ ] `applyDiscountCopy` doesn't mutate the original catalog
- [ ] A comment about shared backing (task 5, or from the theory in 08)

## If something goes wrong

| Symptom | Check |
|---------|----------|
| `index out of range` | `len(products)` before `products[0]` |
| Filter changes the catalog | Copy into a new slice, don't do `products = products[:0]` |
| Total is wrong | `int64` for cents, order of multiplication |
| `cannot define new methods on non-local type` | Methods on `Cart` in the `main` package of this file |
| `go: cannot find main module` | `cd examples`, path `./lab/09shop` |

Next lesson (theory): [10. Functions](10-functions.md).
