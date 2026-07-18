# 08. Arrays and slices: length, capacity, append, copy

## What you'll learn

- **Array** `[N]T` — fixed size, a value type.
- **Slice** `[]T` — length, capacity, a view into an array.
- **`append`** — when cap grows and when a new backing array is allocated.
- **`copy`** — explicit copying of elements.
- **Slicing** `s[i:j:k]` — three indices (full slice expression).
- Idioms: iteration, preallocating, not mutating a shared slice.

## Array — fixed length

```go
var a [3]int           // [0 0 0]
a[0] = 10
fmt.Println(len(a))    // 3 — always

b := [2]string{"go", "shop"}
// c := [2]int{1, 2, 3}  // error: too many elements
```

The size is **part of the type**: `[3]int` and `[4]int` are different types and can't be assigned to each other.

```go
type Row [5]byte // sometimes used for protocols
```

In application code, arrays show up less often than slices — except for `[...]int{1,2,3}`, where the compiler counts the elements for you:

```go
nums := [...]int{1, 2, 3} // len 3
```

## Slice — a dynamic window

```go
s := []int{10, 20, 30}
fmt.Println(len(s), cap(s)) // 3 3

s = append(s, 40)
fmt.Println(s, len(s), cap(s)) // cap may double
```

Internally, a slice is a struct (simplified):

```text
ptr → | 10 | 20 | 30 | 40 | ... |  // backing array
len = 4
cap = 6 (for example)
```

| | Array `[n]T` | Slice `[]T` |
|--|--------------|-------------|
| Size | fixed | dynamic |
| Assignment | copies the whole array | copies the header (ptr, len, cap) |
| Passed to a function | copy of the array | copy of the header — shared backing array |

## Creating a slice

```go
var s1 []int              // nil slice, len 0, cap 0
s2 := []int{}             // empty, non-nil (usually)
s3 := make([]int, 5)      // len 5, cap 5, zeros
s4 := make([]int, 0, 10)  // len 0, cap 10 — preallocate

fmt.Println(s1 == nil, len(s1)) // true, 0
fmt.Println(s2 == nil)          // false
```

A `nil` slice is valid: `len` is 0, and `append` works fine.

## append

```go
items := []string{"keyboard"}
items = append(items, "mouse")
items = append(items, "desk", "lamp")

more := []string{"cable"}
items = append(items, more...) // spread another slice
```

**Important:** `append` may allocate a **new** array if `len+add > cap`. You must **assign** the result back:

```go
s := []int{1, 2}
append(s, 3)     // not a compile error — but the result is discarded, s is unchanged
s = append(s, 3) // OK
```

If there's enough capacity, `append` writes into the **same** backing array — other slices sharing that array will see the change:

```go
a := []int{1, 2, 3}
b := a[:2]        // [1 2], shared backing
b = append(b, 99) // may overwrite a[2] if cap allows it
fmt.Println(a, b)
```

## copy

```go
src := []int{1, 2, 3}
dst := make([]int, len(src))
n := copy(dst, src)
fmt.Println(n, dst) // 3 [1 2 3]
```

`copy` copies **min(len(dst), len(src))** elements. It doesn't duplicate a backing array — just the values.

An immutable catalog update:

```go
func addItem(cart []string, sku string) []string {
	out := make([]string, len(cart), len(cart)+1)
	copy(out, cart)
	return append(out, sku)
}
```

## Slicing

```go
s := []int{0, 10, 20, 30, 40}
fmt.Println(s[1:4])    // [10 20 30], len 3
fmt.Println(s[:2])     // [0 10]
fmt.Println(s[2:])     // [20 30 40]

// full slice expression (limits cap)
t := s[1:3:4]          // len 2, cap 3 (up to index 4)
```

Indices: `[low:high]` — high is **exclusive**. There are no negative indices.

**Trap:** a sub-slice keeps the **entire** backing array in memory:

```go
big := make([]byte, 1<<20) // 1 MB
small := big[:10]
_ = small // big's backing array won't be GC'd while small is alive
```

The fix: `copy` into a new, small slice.

## Iteration

```go
products := []Product{{ID: 1}, {ID: 2}}
for i, p := range products {
	fmt.Println(i, p.ID)
}

for _, p := range products {
	_ = p
}

// indices only
for i := range products {
	_ = i
}
```

`range` copies the element's **value** — for large structs, use the index or a pointer:

```go
for i := range products {
	products[i].Title = "x" // OK
}
```

## []Product in a shop API

```go
type Product struct {
	ID    int64
	Title string
}

func filterInStock(all []Product) []Product {
	out := make([]Product, 0)
	for _, p := range all {
		if p.InStock {
			out = append(out, p)
		}
	}
	return out
}
```

## Common mistakes

**Forgetting to assign the result of `append`.** The old slice won't be updated.

**Mutating a slice from a cache.** Always copy before `append`/`sort` if the data is shared.

**Confusing `nil` and an empty slice in JSON.** `null` vs `[]` are different; consider `omitempty` on a slice field.

**Using an array instead of a slice in an API.** Almost always use `[]T`.

**Sub-slicing a large buffer.** A memory leak — `copy` into a new slice.

**Ranging over structs and mutating `p.Field`.** You change the copy, not the element.

## Summary

An **array** is a value with a fixed size; a **slice** is a flexible view into an array with a `len` and a `cap`. **`append`** and **`copy`** are the core tools; slices share a backing array until it gets reallocated. For a shop catalog and cart, slices are an everyday structure; lab 09 puts Product + Cart together end to end.

## Checklist

- [ ] You explained the difference between `[3]int` and `[]int`
- [ ] You know when `append` creates a new backing array
- [ ] You use `make([]T, 0, n)` to preallocate
- [ ] You copy a slice before mutating shared data
- [ ] You understand `s[low:high]` and that high is exclusive
- [ ] In `range`, you mutate through the index, not the value copy

Next lesson: [09. Lab: structs and slices](09-lab-structs-slices.md).
