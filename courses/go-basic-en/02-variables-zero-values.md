# 02. Variables: `var`, `:=`, zero values, naming

## What you'll learn

- Declaring variables with **`var`** and short **`:=`** — when to use which.
- **Zero values** for all basic types.
- **Block scope**.
- Naming rules (exported vs unexported — preview).
- Why unused variables are a **compile error**.

## Two ways to declare a variable

```go
package main

import "fmt"

func main() {
	var name string = "Ann"
	var age int           // zero value: 0
	count := 3            // short declaration, type inferred as int
	price := 79.99        // float64

	fmt.Println(name, age, count, price)
}
```

| Way | Syntax | When to use |
|--------|-----------|-------------------|
| `var` | `var x int` or `var x int = 5` | struct fields, package level, explicit type, zero value on purpose |
| `:=` | `x := 5` | local variables inside functions, type inferred |
| `:=` in `if` | `if v := f(); v > 0` | a short-lived scope for a temporary variable |

**Course rule:** inside a `func`, default to **`:=`**. Use **`var`** when you need a type without initialization, several variables in one block, or a package-level declaration.

```go
var (
	Debug   bool   = false
	APIBase string = "http://localhost:8090"
)
```

There's no hoisting in Go: a variable exists only **after** the line that declares it, within its own block.

## Zero values — "everything is filled in by default"

Every type in Go has a **zero value**. A variable without explicit initialization gets a well-defined default, rather than staying undefined:

```go
var i int
var f float64
var b bool
var s string
var p *int

fmt.Println(i, f, b, s, p)
// 0 0 false  <nil>
```

| Type | Zero value |
|-----|------------|
| `int`, `int64`, … | `0` |
| `float64` | `0` |
| `bool` | `false` |
| `string` | `""` (empty string, not nil) |
| pointer, slice, map, chan, func, interface | `nil` |

A practical case: an order struct after `json.Unmarshal`:

```go
type Order struct {
	ID       int     `json:"id"`
	Total    float64 `json:"total"`
	Discount float64 `json:"discount"` // if the key is missing from JSON → 0, not "absent"
}
```

If you need to distinguish "field not set" from "field is zero," you later reach for pointers (`*float64`) or nullable types — that's covered in the pointers chapter.

## Short declaration `:=`

Works **only inside functions** (not at package level):

```go
func example() {
	sku := "KB-1"
	qty := 2
	sku, line := sku, sku+qty // at least one new variable on the right
	_ = line
}
```

**`:=` requires at least one new variable** on the left:

```go
x := 10
x, y := 20, 30 // OK: y is new
// x := 40      // error: no new variables on left side of :=
```

The type is inferred from the right-hand side:

```go
n := 42        // int
pi := 3.14     // float64
ok := true     // bool
msg := "hi"    // string
```

An explicit type with `var`:

```go
var userID int64 = 9007199254740993
```

## Scope: blocks

```go
func process() {
	discount := 0.1
	if discount > 0 {
		label := "sale"
		fmt.Println(label)
	}
	// fmt.Println(label) // undefined: label
}
```

`if`, `for`, `switch`, `{ }` are each their own block. A variable declared with `:=` in an `if` init statement is visible **only inside** that `if`:

```go
if err := save(); err != nil {
	return err
}
// err is not accessible here
```

This deliberately limits the scope of temporary names to the block where they're needed.

### `for` and the loop variable

```go
for i := 0; i < 3; i++ {
	go func() {
		fmt.Println(i) // before Go 1.22 — the classic shared-variable trap
	}()
}
```

In Go 1.22+, the `i` in a `for` loop is a **new variable on every iteration**. On older versions, getting the same result required explicitly copying it: `i := i` inside the loop body.

## Naming

- **CamelCase** for names: `orderID`, `fullName`.
- A capital first letter means export (visible from other packages): `type Product struct`, field `Title string`.
- Lowercase means package-only visibility: `func parseSKU()`.
- Acronyms: `HTTPClient`, `userID` (not `UserId`).
- Short names in a small scope: `i`, `err`; longer ones in an API: `customerEmail`.

```go
type Product struct {
	ID    int64   // exported field
	title string  // unexported — visible only in this package
}
```

## Unused variables and imports

The compiler is **strict**:

```go
func broken() {
	x := 1
	// x is never used → compile error: x declared and not used
}
```

The only intentional way around it is the blank identifier `_`:

```go
_ = x // or _, err := f() when err isn't needed (rare)
```

The same applies to imports: an unused `"fmt"` is a compile error, not a linter warning. `goimports` removes unused imports on save.

## `var` vs `:=`: practical scenarios

**An explicit zero value before branching:**

```go
var err error
if condition {
	err = step1()
} else {
	err = step2()
}
if err != nil {
	return err
}
```

**Several variables of the same type:**

```go
var width, height int = 100, 50
a, b := 1, 2
```

**Redeclaring in the same block (rare):**

```go
x := 1
if true {
	x, y := 2, 3 // a new x in the inner block, shadowing the outer one
	_ = x
}
```

Shadowing outside the inner block is confusing enough that code review usually asks for a rename.

## Common mistakes

**Using `:=` at package level.** Only `var` works outside functions.

**Confusing a zero value with an "error."** `if s == ""` is a normal empty-string check; don't expect some special "undefined" state.

**Forgetting that `false` and `0` are valid data.** `if count` won't compile — Go has no truthy/falsy; write `if count > 0`.

**Declaring `err` twice in the same block.** `err :=` followed by another `err :=` — use `err =` to assign instead.

**Mixing `var` and `:=` without a reason.** Stick to one style per file: short local `:=`, deliberate `var`.

## Summary

Variables in Go are declared with **`var`** or **`:=`**; without initialization, they get a **zero value**, not "emptiness." Block scope and a strict compiler catch dead code before it merges. This is the foundation for structs, JSON, and errors — every following lesson relies on `0`, `""`, and `nil` having a precise meaning.

## Checklist

- [ ] You can list the zero values for `int`, `bool`, `string`, `*int`
- [ ] You understand the difference between `var x int` and `x := 0`
- [ ] You know why `:=` can't be used outside a function
- [ ] You write `if count > 0`, not `if count`
- [ ] You could explain to a colleague why a missing JSON field became `0`
- [ ] You've seen the "declared and not used" error and know about `_`

Next lesson: [03. Lab: first programs](03-lab-first-programs.md).
