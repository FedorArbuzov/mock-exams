# 02. Structs, slices, maps

## Struct — data model

```go
type Product struct {
    ID    string
    Name  string
    Price float64
}

p := Product{ID: "kb-1", Name: "Keyboard", Price: 79.99}
p.Price = 69.99
```

**Nesting** (composition instead of inheritance):

```go
type LineItem struct {
    Product Product
    Qty     int
}
```

Struct tags (`json:"name"`) — in [08-json-files-time.md](08-json-files-time.md).

## Array vs slice

**Array** — fixed length: `[3]int`. Rarely used in APIs.

**Slice** — a dynamic view onto an array:

```go
items := []string{"a", "b"}
items = append(items, "c")

sub := items[1:3] // shares backing array — be careful with mutations
```

| Operation | Example |
|-----------|---------|
| length | `len(s)` |
| capacity | `cap(s)` |
| copy | `copy(dst, src)` |
| append | `s = append(s, x)` |

A nil slice is fine; `append` on `nil` works. Empty slice: `[]int{}` or `make([]int, 0)`.

## Map

```go
prices := map[string]float64{
    "kb-1": 79.99,
}
prices["ms-2"] = 29.99

v, ok := prices["kb-1"] // ok == true
delete(prices, "ms-2")

for id, price := range prices {
    _ = id
    _ = price
}
```

**A nil map panics on write.** Create with `make` or a literal:

```go
m := make(map[string]int)
```

## When to use what

| Structure | When |
|-----------|------|
| struct | fixed set of fields of different types |
| slice | ordered list |
| map | fast lookup by key |

In `go-intermediate` the same types land in the repository layer and DTOs.

## Common mistakes

- Mutating a subslice that someone else still holds — surprising side effects.
- `append` without assignment: `append(s, x)` without `s =` — result discarded.
- Iterating a nil slice/map is safe (0 iterations); writing to a nil map is not.

## Checklist

- [ ] Declared a struct and a slice, used `append`
- [ ] Created a map with `make`, checked `ok` on read

Next: [03. Functions, pointers, methods](03-functions-pointers-methods.md).
