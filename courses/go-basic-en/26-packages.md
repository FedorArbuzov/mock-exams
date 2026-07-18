# 26. Packages: main, lib, exported names

## package — the unit of compilation

Every `.go` file starts with `package <name>`. All files in one directory form **one** package (except `_test.go` files, which may use `package xxx_test`).

```go
// file: greeter.go
package greet

import "fmt"

func Hello(name string) string {
    return fmt.Sprintf("Hello, %s", name)
}
```

Import:

```go
import "github.com/mock-exams/go-basic-en-labs/greet"

greet.Hello("World")
```

| Rule | Detail |
|---------|--------|
| Package name | Usually the last segment of the import path |
| `main` | The entry point, with `func main()` |
| Import cycles | Forbidden by the compiler |

## package main vs. a library

```go
// cmd/hello/main.go
package main

import (
    "fmt"
    "github.com/mock-exams/go-basic-en-labs/greet"
)

func main() {
    fmt.Println(greet.Hello("shop"))
}
```

| `package main` | Library (`package store`) |
|----------------|------------------------------|
| Builds into a binary | Builds as a dependency |
| Cannot be imported | `import`ed by other packages |
| `func main()` required | No `main` needed |

**cmd/** layout (industry standard):

```text
project/
├── cmd/
│   └── shop/
│       └── main.go      # package main — a thin layer
├── internal/
│   └── catalog/
│       └── product.go   # package catalog
└── go.mod
```

`main` only **wires together** dependencies: flags, config, starting the server. Business logic lives in importable packages.

## Exported names — visibility by case

An identifier is **exported** if it starts with an **uppercase** letter:

```go
package catalog

type Product struct {   // exported
    ID    int          // exported
    name  string        // private within the package
}

func List() []Product { ... }   // exported
func normalize(s string) string { ... } // private
```

From another package:

```go
p := catalog.Product{ID: 1} // OK
// p.name — compile error
```

There are **no** `public`/`private` keywords — only the first letter matters.

## Naming packages

- **Short**, lowercase, **no** underscores (`catalog`, not `catalog_utils`).
- The package name **doesn't repeat** the type name unnecessarily: `catalog.Product`, not `catalog.CatalogProduct`.
- Avoid `util`, `common`, `helpers` — they turn into junk drawers.

```go
import (
    "fmt"
    myfmt "example.com/lib/fmt" // alias on conflict with std
)
```

## Directory layout (basic → intermediate)

**Bad for growth:**

```text
shop/
└── main.go   // everything in one file
```

**Good:**

```text
shop/
├── cmd/shop/main.go
├── internal/
│   ├── api/
│   ├── domain/
│   └── store/
└── pkg/          // optional: a public lib for other modules
    └── client/
```

- **`internal/`** — code that **cannot** be imported from outside the tree rooted at the parent of `internal` (enforced by the compiler).
- **`pkg/`** — historically "public" libraries; newer projects often skip `pkg` and just use root-level packages.

## internal/ — hard encapsulation

```text
github.com/acme/shop/
├── internal/
│   └── auth/
│       └── jwt.go
└── cmd/shop/main.go
```

An external module **cannot**:

```go
import "github.com/acme/shop/internal/auth" // compile error
```

Only code **inside** `github.com/acme/shop/...` can import `internal/auth`.

Why: it protects against coupling to implementation details and preserves freedom to refactor.

## init() — handle with care

```go
func init() {
    // driver registration, flags, global tables
}
```

`init` runs when the package is imported, **before** `main`. Order follows the import dependency graph.

| Acceptable | Avoid |
|-----------|----------|
| `database/sql` driver registration | heavy work, I/O |
| template glob | hidden side effects |

Prefer an **explicit** `New()` / `Setup()` called from `main`.

## Package documentation

```go
// Package catalog provides product types for the shop domain.
package catalog
```

A comment **directly above** `package` — used by `go doc` and pkg.go.dev. Exported symbols get a comment right above their declaration:

```go
// Product represents an item in the catalog.
type Product struct { ... }
```

## Tests and package name

File `catalog_test.go`:

```go
package catalog_test  // external test — public API only

import "github.com/acme/shop/catalog"

func TestList(t *testing.T) {
    _ = catalog.List()
}
```

Or `package catalog` — **white-box** tests of private functions.

## Circular dependencies

```text
api → store → api   // compile ERROR
```

The fix: move **interfaces** and shared types into `domain`, so dependencies point in one direction:

```text
api → domain ← store
```

## Common mistakes

- **Everything crammed into `main`** — no reuse and no real tests.
- **Exporting everything** — the "public" API balloons.
- **A catch-all `utils` package** — blurry boundaries.
- **A `models` package with 200 types** — split it up by domain.
- **Importing `internal` from another module** — expecting an alias to "work around" it (it won't).
- **A package import cycle** — fix by extracting a domain package, not by reaching for `interface{}`.

## Checklist

- How does `package main` differ from `package catalog`?
- How do you make a struct field private to other packages?
- Why have an `internal/` directory?
- Where should `func main()` live in a production layout?
- Why is `package catalog_test` useful for black-box tests?
- What does the compiler forbid in the case of a circular import?

Next lesson: [27. Modules and go mod](27-modules.md).
