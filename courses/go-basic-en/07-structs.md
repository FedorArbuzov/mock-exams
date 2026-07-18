# 07. Structs: fields, nesting, tags (preview)

## What you'll learn

- Syntax **`type Name struct`** and literals.
- **Field names**, exported vs unexported.
- **Nested** structs and **anonymous embedding**.
- **Struct tags** — preview for `encoding/json`.
- Zero value struct — all fields are zero.

## Defining and using a struct

```go
type Product struct {
	ID       int64
	Title    string
	PriceCents int64
	InStock  bool
}

func main() {
	var p Product // zero: 0, "", 0, false
	p = Product{
		ID:         1,
		Title:      "Keyboard",
		PriceCents: 7999,
		InStock:    true,
	}

	_ = p.Title
}
```

A literal with field names is **recommended** (resilient to field reordering). A positional literal — only if you know the order and there are few fields:

```go
p2 := Product{2, "Mouse", 2999, true}
```

## Exported and unexported fields

```go
type Item struct {
	ID    int64  // exported — JSON, other packages
	sku   string // this package only
}
```

`encoding/json` only populates **exported** fields.

## Access and pointers (preview)

```go
p := Product{Title: "Desk"}
p.Title = "Standing Desk" // a copy? no — p is a value, but its fields change in place

ptr := &Product{Title: "Lamp"}
ptr.PriceCents = 19900
```

Passing a struct to a function makes a **copy** of the entire struct (can be expensive for large structs).

## Nested structs

An explicit field:

```go
type Address struct {
	City   string
	Street string
}

type Customer struct {
	Name    string
	Address Address
}

c := Customer{
	Name: "Ann",
	Address: Address{City: "Berlin", Street: "Main 1"},
}
fmt.Println(c.Address.City)
```

## Embedding (composition)

```go
type Address struct {
	City   string
	Street string
}

type Customer struct {
	Name string
	Address // anonymous field — embedding
}

c := Customer{
	Name: "Ann",
	Address: Address{City: "Berlin", Street: "Main 1"},
}
fmt.Println(c.City) // promoted field — c.Address.City also works
```

**Promotion** — the embedded type's fields and methods are lifted up to the outer level. This is **not** OOP inheritance: there's no override hierarchy, only composition. A name conflict between two embedded types is a compile error on ambiguous access.

```go
type Timestamps struct {
	CreatedAt string
}

type Product struct {
	Timestamps
	ID    int64
	Title string
}
```

## Struct tags (preview)

Tags are metadata strings attached to fields, read via reflection (JSON, SQL, validation):

```go
type Product struct {
	ID       int64   `json:"id"`
	Title    string  `json:"title"`
	Price    float64 `json:"price"`
	Category string  `json:"category,omitempty"`
}
```

- `json:"id"` — the JSON key name.
- `omitempty` — skip serializing the zero value (careful with `false` and `0` — this can hide valid data).

```go
import "encoding/json"

data := []byte(`{"id":1,"title":"Keyboard","price":79.99}`)
var p Product
err := json.Unmarshal(data, &p)
_ = err
```

## Comparing structs

Structs are **comparable** if all their fields are comparable:

```go
a := Product{ID: 1, Title: "A"}
b := Product{ID: 1, Title: "A"}
fmt.Println(a == b) // true
```

Slices, maps, and funcs inside a struct **cannot** be compared with `==`.

## Structs as a value type

```go
func bumpPrice(p Product) {
	p.PriceCents += 100 // a copy — the original doesn't change
}
```

For mutation, use a pointer `*Product` or return a new value (immutable style).

## Common mistakes

**Unexported fields waiting for JSON.** `title` instead of `Title` — the field stays zero.

**Tag doesn't match the API.** `json:"item_id"` vs `"itemId"` — a silent bug.

**Copying a large struct in a loop.** Use a slice of pointers or indices instead.

**Confusing embedding with inheritance.** There's no `super`, no override — just composition.

**`omitempty` hides a `0` price.** Document the contract for free items.

## Summary

A **struct** groups the fields of one entity; exported names are for APIs and other packages. **Embedding** reuses fields without duplication. **Tags** connect fields to JSON — critical for a shop API. The next chapter covers **slices** for product lists and carts.

## Checklist

- [ ] You declared `type Product struct` with exported fields
- [ ] You understand the zero value struct
- [ ] You wrote a literal with field names
- [ ] You explained embedding vs a separate `Address` field
- [ ] You've seen a struct tag `json:"..."`
- [ ] You know unexported fields don't go into JSON

Next lesson: [08. Arrays and slices](08-slices-arrays.md).
