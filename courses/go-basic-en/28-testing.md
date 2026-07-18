# 28. Testing: testing, table-driven, t.Run

## The testing package

Tests live in `*_test.go` files, in functions `func TestXxx(t *testing.T)`.

```go
// catalog/product_test.go
package catalog

import "testing"

func TestProductLineTotal(t *testing.T) {
    p := Product{Price: 10, Qty: 3}
    got := p.LineTotal()
    want := 30.0
    if got != want {
        t.Fatalf("LineTotal() = %v, want %v", got, want)
    }
}
```

Running:

```bash
go test ./...
go test -v ./internal/catalog/   # verbose
go test -run TestProduct ./...  # filter by name
go test -count=1 ./...          # skip the cache
```

| Flag | Purpose |
|------|------------|
| `-v` | logs from passing tests |
| `-run Regexp` | run a subset of tests |
| `-race` | race detector |
| `-cover` | coverage |
| `-short` | skip long-running tests |

## Test structure: arrange / act / assert

```go
func TestParseUserID_Valid(t *testing.T) {
    // arrange
    input := "42"
    // act
    id, err := ParseUserID(input)
    // assert
    if err != nil {
        t.Fatalf("unexpected err: %v", err)
    }
    if id != 42 {
        t.Errorf("id = %d, want 42", id)
    }
}
```

| Method | When |
|-------|-------|
| `t.Error` / `t.Errorf` | the test keeps running, marked failed |
| `t.Fatal` / `t.Fatalf` | **immediately** stops the test |

After `Fatal`, don't write code that relies on success — it won't run.

## Table-driven tests — a Go idiom

One test — a **table** of cases:

```go
func TestParseUserID(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        wantID  int
        wantErr bool
    }{
        {"valid", "42", 42, false},
        {"empty", "", 0, true},
        {"negative", "-1", 0, true},
        {"letters", "abc", 0, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            id, err := ParseUserID(tt.input)
            if (err != nil) != tt.wantErr {
                t.Fatalf("err = %v, wantErr %v", err, tt.wantErr)
            }
            if !tt.wantErr && id != tt.wantID {
                t.Errorf("id = %d, want %d", id, tt.wantID)
            }
        })
    }
}
```

Advantages:

- a new case is **one line** in the slice;
- the subtest name shows up in CI output;
- parallelism: `t.Parallel()` inside `t.Run`.

**Always** include a `name` field — on failure you see `TestParseUserID/negative`, not a line number.

## t.Run and subtests

```go
func TestCart(t *testing.T) {
    t.Run("add single", func(t *testing.T) { ... })
    t.Run("add duplicate merges qty", func(t *testing.T) { ... })
}
```

Nested `t.Run` calls group related tests. `go test -run TestCart/add` runs only that subtest.

### t.Parallel

```go
for _, tt := range tests {
    tt := tt // Go < 1.22: capture a copy
    t.Run(tt.name, func(t *testing.T) {
        t.Parallel()
        // ...
    })
}
```

In Go 1.22+, `for _, tt := range` creates a new `tt` on every iteration — the shadowing trick isn't needed.

Don't run tests in parallel if they share **mutable** global state without synchronization.

## Testing errors

```go
func TestLoadUser_NotFound(t *testing.T) {
    _, err := LoadUser(999)
    if !errors.Is(err, ErrNotFound) {
        t.Fatalf("got %v, want ErrNotFound", err)
    }
}
```

Don't compare `err.Error()` against a string when a sentinel error exists.

## package xxx vs. package xxx_test

```go
// white-box — access to private identifiers
package catalog

func Test_normalize(t *testing.T) {
    if normalize("  A ") != "a" { ... }
}
```

```go
// black-box — public API only
package catalog_test

import "github.com/acme/shop/catalog"

func TestList(t *testing.T) {
    _, err := catalog.List()
    ...
}
```

Reviewers tend to prefer **black-box** tests — they exercise the package the way a consumer would.

## Benchmarks (overview)

```go
func BenchmarkLineTotal(b *testing.B) {
    p := Product{Price: 1, Qty: 1}
    for i := 0; i < b.N; i++ {
        p.LineTotal()
    }
}
```

```bash
go test -bench=. -benchmem ./...
```

## testify — briefly

```bash
go get github.com/stretchr/testify@v1.9.0
```

```go
import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestHello(t *testing.T) {
    require.NoError(t, err)           // like t.Fatal
    assert.Equal(t, 42, id)           // like t.Errorf
    assert.True(t, errors.Is(err, ErrNotFound))
}
```

| | std `testing` | testify |
|---|---------------|---------|
| Dependency | none | external |
| Style | explicit ifs | assert/require |
| In interviews | required | "we know it, we use it on the job" |

**At the basic level**, know how to write tests **without** testify; on a team, testify is often used for readability.

## httptest (a preview)

```go
req := httptest.NewRequest("GET", "/items/1", nil)
rec := httptest.NewRecorder()
handler.ServeHTTP(rec, req)
```

## Coverage

```bash
go test -cover ./...
go test -coverprofile=cover.out ./...
go tool cover -html=cover.out
```

100% coverage ≠ 100% quality; the goal is covering **critical** branches and errors.

## -race in CI

```bash
go test -race ./...
```

Mandatory for code with goroutines. At the basic level — build the habit from your first MR.

## Common mistakes

- **One giant test** without a table — an unreadable diff in CI.
- **No `name` in the table** — unclear what failed.
- **Forgetting `tt := tt`** on older Go versions in a parallel loop.
- **Testing private logic** instead of the package's public API behavior.
- **Depending on test order** and global state.
- **Skipping `-race`** with shared memory.

## Checklist

- How do you name a test file and a test function?
- Why use table-driven tests in Go?
- How does `t.Fatal` differ from `t.Error`?
- Why use `t.Run("name", ...)`?
- How do you check for `ErrNotFound` in a test?
- What does `go test -race` give you?

Next lesson: [29. Lab: testing](29-lab-testing.md).
