# 21. Errors: error, fmt.Errorf, %w

## The error interface

```go
type error interface {
    Error() string
}
```

Any type with an `Error() string` method is an error. Most often:

```go
import "errors"

var ErrNotFound = errors.New("not found")

func loadUser(id int) (User, error) {
    if id <= 0 {
        return User{}, fmt.Errorf("invalid id: %d", id)
    }
    // ...
    return User{}, ErrNotFound
}
```

| Way to create an error | When |
|----------------------|-------|
| `errors.New("msg")` | A static message, a sentinel |
| `fmt.Errorf("ctx: %w", err)` | A wrapper with context + a chain |
| `fmt.Errorf("bad %d", id)` | A new error without wrapping |
| Custom type `func (e *MyErr) Error() string` | Fields: a code, an HTTP status |

**Sentinel** — a variable declared ahead of time (`ErrNotFound`) for comparison via `errors.Is` — more in chapter 25.

## The if err != nil idiom

The standard flow in Go is to **check the error right away** after a call, not defer it:

```go
f, err := os.Open(path)
if err != nil {
    return fmt.Errorf("open config %q: %w", path, err)
}
defer f.Close()

data, err := io.ReadAll(f)
if err != nil {
    return fmt.Errorf("read config %q: %w", path, err)
}
```

### Anti-patterns

```go
// bad — swallowing the error
data, _ := io.ReadAll(f)

// bad — a pointless return with no context
if err != nil {
    return err
}
// better to add context at the layer boundary:
if err != nil {
    return fmt.Errorf("load users: %w", err)
}

// bad — panic instead of an error in library code
if err != nil {
    panic(err)
}
```

**Layering rule:** the low level (a DB driver) returns the "raw" error; the service **wraps** it; the HTTP handler **maps** it to a status (404/500).

### Multiple return values

```go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

result, err := divide(10, 0)
if err != nil {
    log.Println(err)
    return
}
fmt.Println(result)
```

The error is the **last** value in the return list (a convention, not a syntax requirement).

## fmt.Errorf and formatting

```go
return fmt.Errorf("user %d: %s", id, "inactive")
```

The same verbs as in `fmt.Printf`: `%d`, `%s`, `%q`, `%v`, `%w`.

### %w — wrapping for the chain

Go 1.13+ — `%w` **wraps** an error, preserving unwrap support for `errors.Is` / `errors.As`:

```go
func readConfig(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("read config %q: %w", path, err)
    }
    return data, nil
}

func main() {
    _, err := readConfig("/etc/app.yaml")
    if errors.Is(err, os.ErrNotExist) {
        fmt.Println("file doesn't exist — using the default config")
    }
}
```

| Verb | Effect |
|------|--------|
| `%v` | The error text, **without** unwrap |
| `%w` | Wrap — `errors.Unwrap` becomes possible |
| `%s` | As a string |

**One `%w` per** `fmt.Errorf` call — a second `%w` won't compile.

```go
// not allowed
fmt.Errorf("%w and %w", e1, e2)

// chaining is fine
fmt.Errorf("step1: %w", fmt.Errorf("step0: %w", root))
```

## Creating errors: errors.New vs fmt.Errorf

```go
var ErrEmptyName = errors.New("name is empty")

func validateName(name string) error {
    if name == "" {
        return ErrEmptyName
    }
    return nil
}
```

For **dynamic** text without wrapping:

```go
return fmt.Errorf("price %.2f out of range [0, %d]", price, maxPrice)
```

## Custom error types

When you need **fields** (an HTTP code, a field name):

```go
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation: %s — %s", e.Field, e.Message)
}

func parseAge(s string) (int, error) {
    n, err := strconv.Atoi(s)
    if err != nil {
        return 0, fmt.Errorf("parse age %q: %w", s, err)
    }
    if n < 0 || n > 150 {
        return 0, &ValidationError{Field: "age", Message: "out of range"}
    }
    return n, nil
}
```

Extracting the type — `errors.As` (chapter 25).

## error and nil (the connection to interfaces)

`error` is an interface. A **typed nil** breaks the check:

```go
func fail() error {
    var ve *ValidationError = nil
    return ve // != nil as an error
}
```

Return `return nil` or `return &ValidationError{...}`, not a typed nil pointer.

## Errors vs panic

| Situation | error | panic |
|----------|-------|-------|
| File not found | `return err` | — |
| Bad user input | `return err` | — |
| A programmer bug (an invariant) | sometimes `error` | `panic` + recover at the boundary |
| `init()` at startup | `log.Fatal` / `panic` | acceptable |

`panic` is for **unrecoverable** failures or prototypes; in libraries and HTTP handlers, use **errors**.

## The "enrich and return" pattern

```go
func (s *Service) GetOrder(ctx context.Context, id string) (Order, error) {
    order, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return Order{}, fmt.Errorf("service get order %s: %w", id, err)
    }
    if order.Status == "" {
        return Order{}, fmt.Errorf("order %s: %w", id, ErrCorruptData)
    }
    return order, nil
}
```

Handler:

```go
order, err := svc.GetOrder(r.Context(), id)
if err != nil {
    if errors.Is(err, ErrNotFound) {
        http.Error(w, "not found", http.StatusNotFound)
        return
    }
    http.Error(w, "internal error", http.StatusInternalServerError)
    return
}
```

## Logging errors

```go
if err != nil {
    slog.Error("save failed", "user_id", id, "err", err)
    return fmt.Errorf("save user %d: %w", id, err)
}
```

Log **once** at the boundary (handler, main), not in every internal function — otherwise you get duplicates in Loki/ELK.

Go **doesn't force** you to handle every error at the compiler level — the `if err != nil` discipline is upheld by team culture and linters, not by language syntax.

## Common mistakes

- **`_` instead of `err`** — losing a failure without a trace.
- **`return err` without context** at a layer boundary — confusing logs.
- **`%v` instead of `%w`** — `errors.Is` stops working.
- **panic on I/O** — takes down the whole process instead of returning a 500.
- **Typed nil** in a `return` as `error`.
- **Double logging** the same error at every level of the call stack.

## Checklist

- What method must a type have to be an `error`?
- How does `errors.New` differ from `fmt.Errorf` without `%w`?
- Why use `%w` in `fmt.Errorf`?
- Why is `if err != nil` mandatory after almost every syscall?
- When is a sentinel (`ErrNotFound`) better than a string in `fmt.Errorf`?
- How does Go's `error` model fundamentally differ from exceptions?

Next lesson: [23. defer, panic, recover](23-defer-panic-recover.md). Errors lab: [24. Lab: errors](24-lab-errors.md). Deeper dive: [25. errors.Is and errors.As](25-errors-is-as.md).
