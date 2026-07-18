# 12. Maps: `make`, `delete`, iteration, nil map

## What you'll learn

- Declaration, literal, and **`make(map[K]V)`**.
- Operations: write, read, **comma ok**, **`delete`**.
- **Iteration** with `for k, v := range m` and key order.
- The zero value **`nil` map** vs an empty initialized map.
- Common mistakes in production.

## Declaring and creating

```go
// 1. var — a nil map
var m1 map[string]int

// 2. literal — ready to write to
m2 := map[string]int{
	"apple":  50,
	"banana": 30,
}

// 3. make — an empty initialized map
m3 := make(map[string]int)
m3["cherry"] = 40
```

| Way | `== nil` | Can `m[k]=v` |
|--------|----------|----------------|
| `var m map[K]V` | yes | **no** — panic |
| `m := map[K]V{}` | no | yes |
| `m := make(map[K]V)` | no | yes |
| `m := make(map[K]V, n)` | no | yes, with a capacity hint |

**Why `make`:** a map is a reference type (a descriptor pointing to a runtime hmap). `make` allocates the internal structure; `var` only creates a nil descriptor.

### Capacity hint

```go
// expecting ~1000 SKUs — fewer reallocations
inventory := make(map[string]int, 1000)
```

Like `make([]T, 0, cap)` for a slice — an optimization, not mandatory.

## Keys: what's allowed

A map key must be a **comparable** type:

| Allowed | Not allowed |
|-------|--------|
| `int`, `string`, `bool` | `slice` |
| a pointer `*T` | `map` |
| `array` (fixed size) | `func` |
| a struct (if all fields are comparable) | a struct containing a slice |

```go
type Key struct {
	SKU string
	WH  int
}
stock := make(map[Key]int)
stock[Key{"A1", 1}] = 100
```

**Why a slice can't be a key:** slice comparison is undefined in Go — `==` only works against `nil`.

## Reading, writing, comma ok

```go
prices := map[string]int{"tea": 120}

prices["coffee"] = 200          // insert / update
v := prices["tea"]              // 120
missing := prices["unknown"]    // 0 — zero value for int, the key might just be missing!

price, ok := prices["unknown"]
if !ok {
	fmt.Println("no such SKU")
} else {
	fmt.Println(price)
}
```

**Why comma ok is mandatory in business logic:** `0` can be a **valid price** or a **missing key** — without `ok` you can't tell them apart.

### Checking presence without the value

```go
if _, ok := prices["sku-9"]; ok {
	// the key exists
}
```

## Deleting: `delete`

```go
delete(prices, "tea")
```

- Removes the key-value pair if the key exists.
- If the key doesn't exist — it's a **no-op**, not a panic.
- `delete(m, k)` on a `nil` map is safe (does nothing).

There was no separate `clear` before Go 1.21; with Go 1.21+:

```go
clear(prices) // remove all keys, the map stays usable
```

## Iteration: `range`

```go
for sku, qty := range inventory {
	fmt.Println(sku, qty)
}

for sku := range inventory {
	fmt.Println(sku)
}
```

**The order is random** (deliberately randomized since Go 1.0) — don't rely on any ordering during range. For a stable order, collect the keys, sort them with `slices.Sort`, and iterate the keys.

**Why it's random:** it protects against code depending on the hash table's implementation details.

### Modifying a map during range

```go
for k, v := range m {
	if v == 0 {
		delete(m, k) // allowed in Go
	}
}
```

Adding keys during iteration has defined-but-unspecified behavior (new keys may or may not appear in the current pass). For more involved logic, copy the keys first:

```go
keys := make([]string, 0, len(m))
for k := range m {
	keys = append(keys, k)
}
for _, k := range keys {
	// safe to mutate m here
}
```

## Nil map vs empty map

```go
var nilMap map[string]int
emptyMap := make(map[string]int)

fmt.Println(len(nilMap), len(emptyMap)) // 0, 0
fmt.Println(nilMap == nil)              // true
fmt.Println(emptyMap == nil)            // false
```

| Operation | nil map | empty map |
|----------|---------|-----------|
| `len` | 0 | 0 |
| `m[k]` read | zero value | zero value |
| `m[k] = v` | **panic** | ok |
| `delete(m,k)` | ok | ok |
| `range` | 0 iterations | 0+ |

**Initialization idiom in a struct:**

```go
type Cache struct {
	data map[string]string
}

func NewCache() *Cache {
	return &Cache{
		data: make(map[string]string), // don't leave it nil
	}
}
```

## Map vs slice vs struct

| Task | Tool |
|--------|------------|
| An ordered list | `slice` |
| A fixed set of fields | `struct` |
| O(1) average key lookup | `map` |
| A set of unique strings | `map[string]struct{}` |
| A sorted index | map + sorted keys, or another type |

### A set via `map[T]struct{}`

```go
seen := make(map[string]struct{})
if _, ok := seen[id]; ok {
	return // duplicate
}
seen[id] = struct{}{}
```

`struct{}` takes no memory for the value — only the key does.

## Passing a map to a function

A map is passed **by value** as a descriptor, but the descriptor points at **shared** data — the function sees the same inserts/deletes as the caller:

```go
func addItem(m map[string]int, k string, v int) {
	m[k] = v
}

func main() {
	inv := make(map[string]int)
	addItem(inv, "x", 1)
	fmt.Println(inv["x"]) // 1
}
```

You don't need `*map` — almost never. A pointer to a map is a code smell.

## JSON and maps (preview)

```go
// encoding/json — chapter 32
var raw map[string]any
json.Unmarshal(data, &raw)
```

`map[string]any` is flexible, but loses type safety; structs are preferred for APIs.

## Common mistakes

| Mistake | Root cause | Fix |
|--------|------------------|-------------|
| Panic on assignment to a nil map | `var m map` without `make` | `make` or a literal |
| Treating `m[k]==0` as absence | zero value | comma ok |
| Expecting a key order | random iteration | sort the keys |
| `map[slice]int` | slice isn't comparable | use a string key or a struct ID |
| Copying a map with `=` | shared backing store | deep-copy manually if needed |
| Storing `*T` in a map and mutating without sync | data race | mutex or sync.Map (concurrency) |

## In production

- Initialize maps in service constructors — don't rely on `nil` + lazy init without `sync.Once`.
- For counters and metrics touched from goroutines — don't use a bare map.
- Watch map size in long-running processes for "forgotten key" leaks; use `delete` or a Redis-backed TTL cache.

## Summary

A **map** is `map[Key]Value` with comparable keys. Create it with a **literal** or **`make`**; `var` gives you **nil** — reading is fine, **writing panics**. Read with a check using **comma ok**. **`delete`** and **`clear`** (1.21+) remove entries. **`range`** iterates in **random** order. A map passed into a function shares its **mutable** backing store. For sets, use `map[T]struct{}`.

## Checklist

- What happens with `var m map[string]int; m["a"]=1`?
- How do you tell "the key is missing" apart from "the value is 0"?
- Why is `range` order over a map unstable?
- Which types can't be used as a key?
- Do you need `*map` to mutate inside a function?
- How does `make(map[string]int)` differ from `map[string]int{}`?

Next lesson: [13. Lab: pointers and maps](13-lab-pointers-maps.md).
