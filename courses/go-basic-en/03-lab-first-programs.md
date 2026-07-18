# 03. Lab: first programs

This lab turns the theory from lessons 01–02 (the Go toolchain, `go run`, `var`/`:=`, zero values) into muscle memory: writing small programs in the `main` package, running them, and reading compiler errors instead of just reading about them.

## Prerequisites

- Go **1.22+** installed, terminal restarted after installation.
- You've read [00. Environment](00-environment.md) and [02. Variables](02-variables-zero-values.md).
- You're in the **`courses/go-basic-en/examples/`** directory (not the repo root).

```bash
cd courses/go-basic-en/examples
go version
```

Module: `github.com/mock-exams/go-basic-en-labs` ([`go.mod`](examples/go.mod)). Reference solutions live in [`examples/solutions/`](examples/solutions/) — open them **only after** your own attempt and a short struggle (5–15 minutes).

---

## Task 1. Hello and the Go version

**Context:** in a CI pipeline the first step is often `go version`, so tests don't run on Go 1.20 by accident. A local program duplicates that check for the logs.

Starter code is already in [`lab/01hello/main.go`](examples/lab/01hello/main.go). Confirm it runs:

```bash
go run ./lab/01hello
```

**Success criteria:** three lines with no errors. `GOOS`/`GOARCH` — `windows amd64`, `linux amd64`, etc.; useful in "can't reproduce" tickets.

Optional: add a fourth line with `os.Getenv("USER")` or `USERNAME` (import `"os"`).

---

## Task 2. Variables and formatting

**Context:** a label for a shop invoice — `firstName`, `lastName`, a formatted string via `fmt`.

Create `lab/02variables/main.go`:

```go
package main

import "fmt"

func main() {
	firstName := "Ann"
	lastName := "Smith"
	fullName := fmt.Sprintf("%s %s", firstName, lastName)

	fmt.Println(fullName)
	fmt.Printf("type of fullName: %T\n", fullName)

	var zero int
	fmt.Println("zero int:", zero)
}
```

```bash
go run ./lab/02variables
```

**Success criteria:** `Ann Smith`, `type of fullName: string`, `zero int: 0`. In a comment, one sentence: why `zero` isn't "empty" but `0`.

---

## Task 3. Blocks and shadowing

**Context:** temporary variables in an `if` shouldn't "leak" outside the block.

`lab/03blocks/main.go`:

```go
package main

import "fmt"

func main() {
	discount := 0.15
	if discount > 0 {
		label := "SALE"
		fmt.Println(label, discount)
	}
	// Uncomment the next line and read the compiler error:
	// fmt.Println(label)

	outer := 1
	if true {
		outer, inner := 2, 3
		fmt.Println("inside", outer, inner)
	}
	fmt.Println("outside", outer)
}
```

**In a comment in the file** (2–4 sentences): what `outside` will print, why `label` isn't accessible outside the `if`, and what shadowing of `outer` in the inner block means.

```bash
go run ./lab/03blocks
```

---

## Task 4. Adding int and float

**Context:** a quantity from a form is an integer, a price is a fraction; in Go **different types** don't add implicitly.

`lab/04calc/main.go`:

```go
package main

import "fmt"

func main() {
	qty := 2
	unitPrice := 29.99
	// lineTotal := qty * unitPrice  // comment this out first — read the error
	lineTotal := float64(qty) * unitPrice
	fmt.Println("line total:", lineTotal)

	a, b := 2, 3
	fmt.Println("ints", a+b)

	// fmt.Println(a + unitPrice) // uncomment — compile error
}
```

**In a comment:** why `qty * unitPrice` doesn't compile without a conversion.

---

## Task 5. A REPL-like snippet and float

**Context:** the sum of the shop's line items is off by a cent — float64.

Create a single-file package `lab/05float/main.go`, **or** run a temporary file:

```bash
cd courses/go-basic-en/examples
go run -e 'package main; import "fmt"; func main() { fmt.Println(0.1 + 0.2) }'
```

The `-e` flag **doesn't exist** in Go — that's a deliberate trap. In Go, "REPL-like" means a **short `main.go`**:

```go
package main

import "fmt"

func main() {
	a := 0.1 + 0.2
	fmt.Println(a)
	fmt.Println(a == 0.3)
	fmt.Printf("%.20f\n", a)
}
```

**Success criteria:** you see `0.30000000000000004` (or similar), `false` for `== 0.3`. In a comment: how to count money in production (cents as `int64` — preview).

```bash
go run ./lab/05float
```

---

## Success criteria

- [ ] All packages `01hello`–`05float` run: `go run ./lab/…` from `examples/`
- [ ] `03blocks` has a comment about scope and shadowing
- [ ] `04calc` explains the `float64(qty)` conversion
- [ ] You understand why you'd log `runtime.Version()` / `go version` in CI
- [ ] You tried "breaking" the build by uncommenting lines — and read the compiler message

## If something goes wrong

| Symptom | Check |
|---------|----------|
| `cannot find main module` | Are you in `examples/`? Is there a `go.mod`? |
| `no Go files in ...` | Is `./lab/02variables` a directory with `main.go`? |
| `undefined: fmt` | Import `"fmt"` and the `import` block |
| `declared and not used` | Remove the variable or use `_ = x` |
| Non-ASCII characters in the path break the build | Use an ASCII path or update Go |
| `invalid operation: qty * unitPrice` | Needs a type conversion — task 4 |

Next lesson (theory): [04. Basic types](04-basic-types.md).
