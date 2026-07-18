# 04. Basic types: numbers, strings, bool, rune, byte

## What you'll learn

- Integers **`int`**, **`int64`**, **`uint`** and when to pick a size explicitly.
- **`float64`** and money pitfalls (ties into lab 05).
- **`string`** as an immutable UTF-8 byte sequence.
- **`bool`** — only `true`/`false`, no truthiness.
- **`byte`** (`uint8`) and **`rune`** (`int32`, code point).
- **`uintptr`** — an overview for unsafe/advanced use, not for daily code.
- Explicit **type conversions**.

## Numeric types

### Integers

```go
var count int = 3          // int — 32 or 64 bits, depending on the platform
var productID int64 = 9007199254740993
var flags uint8 = 0b1010   // bitmasks, rare at the basic level

fmt.Printf("%T %T\n", count, productID)
```

| Type | Size | Typical use |
|-----|--------|------------------------|
| `int`, `uint` | platform-dependent | indexes, len, counters |
| `int8`…`int64` | fixed | protocols, DBs, IDs from an API |
| `uint8` (`byte`) | 8 bits | raw bytes, binary |
| `uintptr` | pointer as a number | unsafe, cgo — not in business logic |

**Shop rule:** product and order identifiers are **`int64`** or `string` (UUID), not a casually chosen `int`, if the values could exceed 32 bits.

### Floating-point

```go
price := 79.99    // float64 by default
tax := float32(0.2) // float32 is rare — it accumulates error faster
```

Go has **no** separate `decimal` type. Money in production:

```go
type MoneyCents int64

func lineTotalCents(unitCents MoneyCents, qty int) MoneyCents {
	return unitCents * MoneyCents(qty)
}
```

### Literals

```go
decimal := 42
hex := 0xFF
binary := 0b1010
octal := 0o755  // Go 1.13+
million := 1_000_000
```

## bool

Only two values. Conditions **require** a bool:

```go
var active bool
if active { // OK
	// ...
}
// if count { }  // compile error: non-bool condition

stock := 5
if stock > 0 {
	fmt.Println("in stock")
}
```

Go has no truthy/falsy values: `0`, `""`, `nil` are **not** false in an `if`.

## string

A string is an **immutable** sequence of bytes (usually UTF-8):

```go
title := "Keyboard"
fmt.Println(len(title)) // bytes, not "letters"
```

Operations:

```go
s := "shop"
fmt.Println(s + "-api")     // concatenation
fmt.Println(s[0])           // byte: 115 ('s')
// s[0] = 'x'               // compile error: immutable

for i := 0; i < len(s); i++ {
	fmt.Printf("%c ", s[i])
}
```

Comparison is lexicographic and case-sensitive. For case-insensitive comparison, use `strings.EqualFold`.

### raw strings

```go
query := `SELECT * FROM items WHERE title = "Mouse"`
// backticks — no escaping of \n
```

## rune and byte

```go
var b byte = 'A'    // alias for uint8
var r rune = 'Я'    // alias for int32, a Unicode code point

s := "Go"
fmt.Println(rune(s[0])) // 71 — the first byte, not the whole string
```

Iterating **over runes** (Unicode characters):

```go
for i, r := range "Кот" {
	fmt.Printf("%d: %c (%U)\n", i, r, r)
}
```

`i` is the **byte** index in the string, not the character number. For Cyrillic, one character is 2 UTF-8 bytes — hence the confusion between `len` and "number of letters."

## uintptr (overview)

`uintptr` is an integer large enough to hold a **pointer's bit pattern**. It's used in `unsafe.Pointer`, cgo, and low-level optimizations. You won't need it in shop catalog code. Note that interviews ask "what's the difference between rune and byte" far more often than about uintptr.

```go
// For reference only — don't copy this into labs
import "unsafe"
var x int = 42
p := uintptr(unsafe.Pointer(&x))
_ = p
```

## Type conversion — explicit

Go does **not** silently convert types in arithmetic:

```go
var a int = 10
var b float64 = 3.14
// c := a + b        // error
c := float64(a) + b // OK

var id int64 = 42
// var small int32 = id // error
small := int32(id)     // OK, may truncate — deliberately so
```

String ↔ number conversion goes through `strconv`:

```go
import "strconv"
n, err := strconv.Atoi("42")
_ = n
_ = err
```

## Zero values (recap)

```go
var i int
var f float64
var b bool
var s string
fmt.Println(i, f, b, s) // 0 0 false
```

## Common mistakes

**Storing money in `float64`.** Rounding shows up at checkout; use `int64` cents or a decimal library.

**Confusing `len(string)` with the character count.** For Unicode, use `utf8.RuneCountInString` or `range`.

**Using `int` for an ID from an external system.** It may not fit in 32 bits on some platforms — use `int64`.

**Comparing floats with `==`.** Use a tolerance, or whole cents.

**Expecting `bool` from the string `"false"`.** In Go that's a non-empty string → can't be used in an `if`; parse it with `strconv.ParseBool`.

## Summary

Go's basic types are **fixed and strict**: integers, `float64`, `string`, `bool`, `byte`, `rune`. Conversions are **explicit**; zero values are predictable. Strings are UTF-8 bytes; for a shop API and Cyrillic in the catalog, remember the difference between bytes and runes. The next lesson covers constants and `iota` for statuses and enums without magic numbers.

## Checklist

- [ ] You can name the zero value for `float64` and `string`
- [ ] You understand why `0.1+0.2 == 0.3` is false
- [ ] You know the difference between `byte` and `rune`
- [ ] You write `if n > 0`, not `if n` (compile error)
- [ ] You choose `int64` for large IDs
- [ ] You've read the "invalid operation" error from mixing int and float64

Next lesson: [05. Constants and iota](05-constants-iota.md).
