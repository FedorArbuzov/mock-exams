# 25. errors.Is, errors.As, and sentinel errors

## The problem: == on wrapped errors

```go
var ErrNotFound = errors.New("not found")

func repoFind(id int) error {
    return fmt.Errorf("postgres query: %w", ErrNotFound)
}

func handler() {
    err := repoFind(42)
    fmt.Println(err == ErrNotFound)        // false
    fmt.Println(errors.Is(err, ErrNotFound)) // true
}
```

`==` compares the **top-level** interface value. `Is` walks the chain via `Unwrap()`.

## errors.Is

```go
func Is(err, target error) bool
```

Returns `true` if `err == target`, **or** if any level of unwrap matches `target`.

```go
if errors.Is(err, os.ErrNotExist) {
    // file not found — use the default config
}
if errors.Is(err, context.Canceled) {
    // the client canceled the request
}
if errors.Is(err, ErrNotFound) {
    // 404 in an HTTP handler
}
```

### Sentinel errors

A **sentinel** is a package-level variable `var ErrX = errors.New(...)`:

```go
var (
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
    ErrConflict     = errors.New("conflict")
)
```

| Pros of a sentinel | Cons |
|----------------|--------|
| A stable identity for `Is` | Can't add fields |
| A documented contract | Confusing when exported from many packages |
| Zero allocation | Bad fit for "1000 kinds" of errors |

**Don't** compare a sentinel against message strings.

### Sentinel vs a type

| Sentinel `ErrNotFound` | Type `*ValidationError` |
|------------------------|-------------------------|
| One fixed meaning | Needs fields (field, code) |
| 404, EOF, canceled | A 400 with validation details |
| `errors.Is` | `errors.As` |

## errors.As

```go
func As(err error, target any) bool
```

Finds, in the chain, an error **assignable** to `target` (a pointer to a variable of the needed type):

```go
type ValidationError struct {
    Field string
}

func (e *ValidationError) Error() string {
    return "validation: " + e.Field
}

func handle(err error) {
    var ve *ValidationError
    if errors.As(err, &ve) {
        fmt.Printf("bad field %s\n", ve.Field)
        return
    }
    // generic handling
}
```

**Important:** the second argument is a **pointer to a pointer** for pointer types:

```go
var ve *ValidationError
errors.As(err, &ve) // OK
```

For a value type (rare):

```go
var pe os.PathError
if errors.As(err, &pe) { ... }
```

## Unwrap and the chain

```go
err := fmt.Errorf("layer2: %w", fmt.Errorf("layer1: %w", ErrNotFound))
errors.Unwrap(err)           // layer1: ...
errors.Is(err, ErrNotFound)  // true
```

A custom type can implement `Unwrap() error`:

```go
type OpError struct {
    Op  string
    Err error
}

func (e *OpError) Error() string {
    return e.Op + ": " + e.Err.Error()
}

func (e *OpError) Unwrap() error {
    return e.Err
}
```

The same pattern the standard library uses (`fmt.wrapError`, `os.PathError`).

## errors.Join (Go 1.20+)

Several errors combined into one:

```go
err := errors.Join(err1, err2)
errors.Is(err, err1) // true
```

Useful when closing several resources; at the basic level, just know it exists.

## HTTP mapping (a preview)

A table for a future API:

| Check | HTTP |
|----------|------|
| `errors.Is(err, ErrNotFound)` | 404 |
| `errors.As(err, &ve)` | 400 |
| otherwise | 500 |

```go
func writeError(w http.ResponseWriter, err error) {
    var ve *ValidationError
    switch {
    case errors.Is(err, ErrNotFound):
        http.Error(w, "not found", http.StatusNotFound)
    case errors.As(err, &ve):
        http.Error(w, ve.Error(), http.StatusBadRequest)
    default:
        slog.Error("request failed", "err", err)
        http.Error(w, "internal error", http.StatusInternalServerError)
    }
}
```

## Anti-patterns

```go
// bad — fragile
if strings.Contains(err.Error(), "not found") { ... }

// bad — breaks under i18n messages
if err.Error() == "not found" { ... }

// bad — == on a wrapper
if err == ErrNotFound { ... }

// good
if errors.Is(err, ErrNotFound) { ... }
```

## Testing errors

```go
func TestFindUser_NotFound(t *testing.T) {
    _, err := FindUser(999)
    if !errors.Is(err, ErrNotFound) {
        t.Fatalf("want ErrNotFound, got %v", err)
    }
}

func TestParseID_Validation(t *testing.T) {
    _, err := ParseUserID("")
    var ve *ValidationError
    if !errors.As(err, &ve) {
        t.Fatalf("want ValidationError, got %T", err)
    }
}
```

## Sentinel ownership across package boundaries

Export a sentinel from a **single** domain package:

```go
// domain/errors.go
package domain

var ErrNotFound = errors.New("not found")
```

Consumers: `errors.Is(err, domain.ErrNotFound)`. Don't duplicate `ErrNotFound` in `http` and `repo` with separate `errors.New` calls — `Is` won't match across them.

## Common mistakes

- **`==` instead of `Is`** after `%w`.
- **`As` without a pointer** — `errors.As(err, ve)` instead of `&ve`.
- **A fresh sentinel on every call** — `errors.New` inside a function instead of a package-level variable.
- **Comparing text** via `err.Error()`.
- **Returning a typed nil** `*ValidationError` as `error`.
- **Two different `ErrNotFound`** in different packages without re-export.

## Checklist

- Why is `err == ErrNotFound` false after `fmt.Errorf("%w")`?
- How does `errors.Is` differ from `errors.As`?
- What is a sentinel error?
- What type do you pass as the second argument to `As`?
- How does `Unwrap` relate to `%w`?
- How do you map `ErrNotFound` to HTTP 404 in a handler?

Next lesson: [26. Packages and visibility](26-packages.md). Lab: [24-lab-errors.md](24-lab-errors.md).
