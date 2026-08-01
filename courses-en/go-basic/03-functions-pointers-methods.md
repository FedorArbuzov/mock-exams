# 03. Functions, pointers, methods

## Functions

```go
func Add(a, b int) int {
    return a + b
}

func Div(a, b int) (int, error) {
    if b == 0 {
        return 0, fmt.Errorf("divide by zero")
    }
    return a / b, nil
}
```

**Multiple return values** are normal in Go; the second value is often `error`.

**Variadic:** `func Sum(nums ...int) int`.

## Pointers

```go
x := 10
p := &x   // address
*p = 20   // x is now 20
```

Why: mutate a struct inside a function, avoid copying large structs, mark “may be nil” explicitly.

```go
func ResetCounter(c *int) {
    *c = 0
}
```

Dereferencing a `nil` pointer **panics**. Check before use.

## Methods

```go
type Cart struct {
    Items []string
}

func (c *Cart) Add(item string) {
    c.Items = append(c.Items, item)
}
```

| Receiver | When |
|----------|------|
| `(c Cart)` value | small immutable type, copy is OK |
| `(c *Cart)` pointer | mutation, large struct, consistency with other methods |

Team rule: **if one method has a pointer receiver, use pointer receivers for all** methods on that type.

## Functions as values

```go
ops := map[string]func(int, int) int{
    "add": func(a, b int) int { return a + b },
}
```

Used in middleware and tests; for basic it is enough to know this exists.

## Common mistakes

- Passing a large struct by value on a hot path — extra copies (profile later).
- Pointer receiver on a `nil` receiver — sometimes intentional (check inside the method), easy to get wrong.
- Forgetting `return` with named returns — the compiler may warn, but logic can still be wrong.

## Checklist

- [ ] Function returns `(T, error)`
- [ ] Method with pointer receiver mutates a struct
- [ ] Understand `&x` vs `*p`

Next: [04. Control flow](04-control-flow.md).
