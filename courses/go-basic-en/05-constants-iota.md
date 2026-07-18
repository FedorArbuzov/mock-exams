# 05. Constants and iota: typed, untyped, enums

## What you'll learn

- Declaring **`const`** — a single one and a group.
- **Untyped** and **typed** constants and the type-inference rules.
- **`iota`** for automatic numbering inside a const block.
- Enum patterns: order statuses, bit flags (overview).

## Basic const

```go
const AppName = "shop-catalog"
const MaxCartItems = 100

const (
	Pi       = 3.141592653589793
	APIBase  = "http://localhost:8090/api/v1"
	Debug    = false
)
```

- The value must be **computable at compile time** (literals, arithmetic over constants).
- A `const` **cannot** be reassigned.
- At package level, consts are visible within the package; a capital letter means export.

```go
// const now = time.Now()  // error: time.Now() is not a compile-time value
```

For "lifetime constants," people use `var` with initialization at startup — rare at the basic level.

## Untyped vs typed constants

```go
const untyped = 42        // untyped integer constant
const typed int8 = 42     // type int8

var a int = untyped       // OK: 42 fits into int
var b int8 = untyped      // OK: implicit conversion const → int8
// var c int8 = 300       // error: constant 300 overflows int8
```

An **untyped constant** is "flexible": it takes on a type at the point of use, as long as the value is representable.

```go
const million = 1_000_000
var x int = million
var y float64 = million
```

String and bool constants are untyped in the same way.

### Typed const — a distinct type

```go
type Status int

const (
	StatusPending Status = 1
	StatusPaid    Status = 2
)
```

Now you can't accidentally compare `Status` to an `int` without a conversion:

```go
var s Status = StatusPending
// if s == 1 { }  // compile error without Status(1)
if s == StatusPending {
	// OK
}
```

## iota — automatic numbering

Inside a `const` block, **`iota`** is a line counter starting from 0:

```go
type OrderStatus int

const (
	OrderPending OrderStatus = iota // 0
	OrderPaid                         // 1
	OrderShipped                      // 2
	OrderCancelled                    // 3
)
```

Each following line in the block increments `iota` by 1 until the block ends.

### Skipping values

```go
const (
	_  = iota             // skip 0
	KB = 1 << (10 * iota) // 1024
	MB                    // 1048576
	GB
)
```

A pattern for file sizes and bitmasks.

### Setting a value explicitly after iota

```go
const (
	A = iota // 0
	B        // 1
	C = 10   // 10 — the expression is reset, but iota is still 2 on this line
	D        // iota is 3, value 10+1? No — D repeats the previous line's expression when its own is empty
)
```

The rule: an **empty line** repeats the **previous expression** with the new `iota`. In practice, keep enum blocks simple to avoid surprises.

## Enum for the shop domain

Order statuses for the shop domain:

```go
type OrderStatus int

const (
	OrderStatusUnknown OrderStatus = iota
	OrderStatusPending
	OrderStatusConfirmed
	OrderStatusShipped
	OrderStatusDelivered
	OrderStatusCancelled
)

func (s OrderStatus) String() string {
	switch s {
	case OrderStatusPending:
		return "pending"
	case OrderStatusConfirmed:
		return "confirmed"
	// ...
	default:
		return "unknown"
	}
}
```

The `String()` method is a preview of a later chapter on methods. In JSON, APIs often send **strings** like `"pending"`, not numbers — that requires a custom `MarshalJSON`.

## const and performance

Constants **don't take up** memory the way variables do — they're baked into the code at compile time. For paths and limits:

```go
const defaultPageSize = 20
```

Don't confuse this with **configuration** from the environment (`os.Getenv`) — that uses `var` at startup.

## Common mistakes

**Duplicate iota values without a typed enum.** Two statuses both equal to 2 — the compiler won't warn you.

**Using iota outside a const block.** It only works inside `const (...)`.

**Expecting `const` for slices and maps.** You need a `var` or a function.

**Mixing `iota` with different types in one block without explicit types.** The first value sets the type for the whole typed const group.

**Magic numbers in an HTTP handler with "I'll extract them later."** Extract them right away — a fix during review is cheaper than an incident.

## Summary

**`const`** locks in compile-time values; **`iota`** builds sequential enums. **Typed constants** via `type Status int` separate domain statuses from arbitrary `int`s. Lab 06 will reinforce predicting iota values and conversions.

## Checklist

- [ ] You can write an order-status enum using iota
- [ ] You understand the untyped const `42` and its assignment to `int`/`float64`
- [ ] You know why `time.Now()` can't be a const
- [ ] You use a typed const for statuses, not a bare `int`
- [ ] You've read a const block with `_ = iota` for skipping zero

Next lesson: [06. Lab: types and constants](06-lab-types.md).
