# 01. Types, variables, constants

## Declaring variables

```go
var count int = 0          // full form
var name string            // zero value: ""
total := 42                // short form, only inside functions
```

**Zero value** is the default: `0`, `""`, `false`, `nil` for pointers, slices, maps, channels.

Rule: **`:=` when the type is obvious**; `var` at package level or when you need an explicit type.

## Basic types

| Type | Examples | Zero value |
|------|----------|------------|
| `int`, `int64` | counters, indexes | `0` |
| `float64` | prices, metrics | `0` |
| `string` | text, JSON fields | `""` |
| `bool` | flags | `false` |
| `byte` (`uint8`) | raw bytes | `0` |
| `rune` (`int32`) | Unicode code point | `0` |

Go **does not coerce types implicitly** (unlike JavaScript):

```go
var a int = 5
var b float64 = float64(a) // explicit conversion
```

## Constants and iota

```go
const MaxRetries = 3

const (
    StatusTodo = iota // 0
    StatusDone        // 1
)
```

`iota` is handy for enum-like constants in one `const` block.

## Naming

- **Export:** a name starting with a **capital** letter (`User`, `ParseConfig`) is visible to other packages.
- Style: `MixedCaps`, not `snake_case`.
- Abbreviations: `HTTPClient`, `userID`.

## Quick comparison with JS/Python

| | Go | JS | Python |
|---|-----|-----|--------|
| Typing | static | dynamic | dynamic |
| Unused imports/vars | compile error | no | no |
| `null` | `nil` only for reference types | `null`/`undefined` | `None` |

## Common mistakes

- `:=` outside a function — syntax error.
- Comparing `float64` with `==` for money — prefer integer cents or `decimal` (in intermediate).
- Mixing up `byte` and `rune` when working with strings — see [04-control-flow.md](04-control-flow.md).

## Checklist

- [ ] Know zero values of the main types
- [ ] Can use `var` and `:=`
- [ ] Understand that `3 + 3.0` will not compile without a cast

Next: [02. Structs, slices, maps](02-structs-slices-maps.md).
