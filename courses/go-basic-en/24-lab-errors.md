# 24. Lab: wrapping errors

The goal is to write a **small error-handling layer**: a sentinel, `%w`, an `errors.Is` check, a custom validation type.

**Time:** ~30–40 minutes after [21-errors.md](21-errors.md) and [25-errors-is-as.md](25-errors-is-as.md) (you can also do it after just 21, picking up Is/As along the way).

## Setup

```bash
cd courses/go-basic-en/examples
go test ./lab/errors/... -v   # after you implement it
```

Directory: `lab/errors/`. Reference solution: `solutions/lab/errors/`.

---

## Task 1. The `ErrNotFound` sentinel

```go
package errorslab

import "errors"

var ErrNotFound = errors.New("not found")

type User struct {
    ID   int
    Name string
}

var users = map[int]User{
    1: {ID: 1, Name: "Ann"},
    2: {ID: 2, Name: "Bob"},
}

func FindUser(id int) (User, error) {
    u, ok := users[id]
    if !ok {
        return User{}, ErrNotFound
    }
    return u, nil
}
```

**Check** (`find_test.go` or `main`):

```go
_, err := FindUser(99)
fmt.Println(errors.Is(err, ErrNotFound)) // true
```

---

## Task 2. The `LoadUser` wrapper

```go
func LoadUser(id int) (User, error) {
    u, err := FindUser(id)
    if err != nil {
        return User{}, fmt.Errorf("load user %d: %w", id, err)
    }
    return u, nil
}
```

`errors.Is(LoadUser(99))` should find `ErrNotFound` **through** the wrapper.

---

## Task 3. `ValidationError` and `ParseUserID`

```go
type ValidationError struct {
    Field string
    Value string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("invalid %s: %q", e.Field, e.Value)
}

func ParseUserID(s string) (int, error) {
    if s == "" {
        return 0, &ValidationError{Field: "id", Value: s}
    }
    id, err := strconv.Atoi(s)
    if err != nil {
        return 0, fmt.Errorf("parse id %q: %w", s, err)
    }
    if id <= 0 {
        return 0, &ValidationError{Field: "id", Value: s}
    }
    return id, nil
}
```

**Checking with `errors.As`:**

```go
var ve *ValidationError
err := ParseUserID("-1")
if errors.As(err, &ve) {
    fmt.Println(ve.Field) // id
}
```

---

## Task 4. `GetUserByStringID` — composition

```go
func GetUserByStringID(s string) (User, error) {
    id, err := ParseUserID(s)
    if err != nil {
        return User{}, fmt.Errorf("get user by string id: %w", err)
    }
    u, err := LoadUser(id)
    if err != nil {
        return User{}, fmt.Errorf("get user by string id %q: %w", s, err)
    }
    return u, nil
}
```

Scenario table:

| Call | `errors.Is` / `As` |
|-------|-------------------|
| `GetUserByStringID("1")` | OK, Ann |
| `GetUserByStringID("99")` | `Is(ErrNotFound)` |
| `GetUserByStringID("x")` | `As(*ValidationError)` or a wrapped Atoi error |
| `GetUserByStringID("")` | `As(*ValidationError)` |

---

## Task 5. `FailingSink` (ties into lab 22)

```go
type FailingSink struct {
    FailOn string
}

func (f *FailingSink) Write(line string) error {
    if strings.Contains(line, f.FailOn) {
        return fmt.Errorf("sink reject %q: %w", line, ErrRejected)
    }
    return nil
}

var ErrRejected = errors.New("rejected")
```

Integration with `Run` from lab 22 — on a sink error, the pipeline returns a wrapped `ErrRejected`.

---

## Success criteria

| Command | Expectation |
|---------|----------|
| `go test ./lab/errors/...` | PASS (write a table-driven test in task 6*) |
| `errors.Is` on `LoadUser(99)` | true for `ErrNotFound` |
| `errors.As` on `ParseUserID("")` | true for `*ValidationError` |

\*Optional: one table-driven test for `ParseUserID`.

---

## Troubleshooting

| Symptom | Fix |
|---------|---------|
| `Is` returns false after wrapping | use `%w`, not `%v` |
| `As` returns false | pass `&ve`, where `ve *ValidationError` |
| typed nil in a test | `return nil`, not `return (*ValidationError)(nil)` |

Next lesson: [25. errors.Is and errors.As](25-errors-is-as.md) (if you haven't read it yet) or [26. Packages](26-packages.md).
