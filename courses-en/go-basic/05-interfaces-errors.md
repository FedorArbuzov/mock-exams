# 05. Interfaces and errors

## Interface — a behavior contract

```go
type Pricer interface {
    Price() float64
}

type Product struct {
    Name  string
    Cents int
}

func (p Product) Price() float64 {
    return float64(p.Cents) / 100
}

func PrintPrice(p Pricer) {
    fmt.Println(p.Price())
}
```

**No `implements` keyword.** A type satisfies an interface if it implements all methods. The compiler checks at the use site.

Empty interface `any` means “any type”; in new code, prefer narrow types — don’t sprinkle `any` without need.

### Type assertion

```go
var v any = "hello"
s, ok := v.(string)
if !ok {
    // not a string
}
```

## Errors — values, not exceptions

```go
if err != nil {
    return fmt.Errorf("load config: %w", err)
}
```

`error` is an interface with one method `Error() string`.

**Sentinel errors:**

```go
var ErrNotFound = errors.New("not found")

if errors.Is(err, ErrNotFound) { }
```

**Wrappers and types:**

```go
var e *ValidationError
if errors.As(err, &e) { }
```

Pattern: return the error **upward**; log at the boundary (`main`, HTTP handler).

## panic / recover

**panic** is for programmer bugs and unrecoverable situations — not for “file not found”.

**recover** only inside `defer` in the same goroutine; HTTP frameworks catch panic for you.

On `go-basic`: write `return err`, not `panic`.

## defer

```go
defer mu.Unlock()
defer cancel()
```

Execution order is the reverse of `defer` order. Common pattern: open a resource → `defer Close()`.

## Common mistakes

| Mistake | What to do |
|---------|------------|
| `if err != nil` with a nil interface | Watch the nil-interface gotcha — assign typed `nil` carefully |
| `panic` instead of `error` | Return `error`; panic is rare |
| Interfaces on everything | Small interfaces (1–2 methods), like `io.Reader` |

## Checklist

- [ ] Defined an interface and implemented it with a struct
- [ ] Wrap errors with `%w`
- [ ] Know `errors.Is` / `errors.As`

Next: [06. Packages and go mod](06-packages-modules.md).
