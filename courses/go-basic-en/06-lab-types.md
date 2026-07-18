# 06. Lab: types and constants

This lab reinforces types, conversions, `const`, and `iota` from lessons 04–05 by having you predict the output before running `go run` — the compiler catches many type and boundary mistakes on its own, once you learn to read it.

## Prerequisites

- You've read [04. Basic types](04-basic-types.md) and [05. Constants and iota](05-constants-iota.md).
- Working directory:

```bash
cd courses/go-basic-en/examples
go version
```

Reference solutions are in `examples/solutions/` — check them after your own attempt.

---

## Task 1. Predicting the output

**Context:** a code-review question — "what will this print?" without running it — is faster than CI.

Create `lab/06types/predict.go`, **or** a single `main.go` with a `predict` note in a comment at the top:

```go
package main

import "fmt"

func main() {
	var i int = 42
	var f float64 = float64(i) / 10
	fmt.Println(f)

	s := "shop"
	fmt.Println(len(s), len("магазин"))

	b := true
	fmt.Println(b)
}
```

**Before running it**, write down in a comment the expected output of each line. Then:

```bash
go run ./lab/06types
```

Fix the comments if you got something wrong. Explain `len("магазин")` — UTF-8 bytes.

---

## Task 2. Money in cents

**Context:** a line item in an order — the price shouldn't drift due to float.

`lab/06money/main.go`:

```go
package main

import "fmt"

type Cents int64

const (
	UnitKeyboard Cents = 7999  // 79.99
	UnitMouse    Cents = 2999
)

func lineTotal(unit Cents, qty int) Cents {
	return unit * Cents(qty)
}

func main() {
	fmt.Println("keyboard x2:", lineTotal(UnitKeyboard, 2))
	fmt.Println("as euros:", float64(lineTotal(UnitMouse, 3))/100)
}
```

**Success criteria:** `15998` and `89.97` with no `0.00000004` artifacts. In a comment: why `UnitKeyboard` isn't a `float64`.

---

## Task 3. iota — order statuses

**Context:** order statuses — numbers in the DB, names in the logs.

`lab/06status/main.go`:

```go
package main

import "fmt"

type OrderStatus int

const (
	StatusUnknown OrderStatus = iota
	StatusPending
	StatusPaid
	StatusShipped
	StatusCancelled
)

func main() {
	fmt.Println(StatusPending, StatusPaid, StatusShipped)
	fmt.Printf("%T\n", StatusPending)
}
```

**Success criteria:** `1 2 3` (if Unknown = 0). Add a function `statusName(s OrderStatus) string` with a `switch` — at least 4 cases. Don't use `if s == 1` without a type conversion.

---

## Task 4. strconv and errors (preview)

**Context:** a query param `?qty=2` arrives as a string — same as in HTTP before parsing.

`lab/06parse/main.go`:

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	qtyStr := "3"
	qty, err := strconv.Atoi(qtyStr)
	if err != nil {
		fmt.Println("parse error:", err)
		return
	}
	fmt.Println("qty:", qty, "double:", qty*2)

	bad := "3.5"
	_, err = strconv.Atoi(bad)
	fmt.Println("bad parse err != nil:", err != nil)
}
```

**Success criteria:** `qty: 3 double: 6`, `bad parse err != nil: true`. In a comment, one sentence: the connection to `if err != nil`.

---

## Task 5. Typed const vs magic number

**Context:** the cart limit in the BFF and the Go service must match.

```go
package main

import "fmt"

type Limit int

const MaxCartItems Limit = 100

func canAdd(current int, add int) bool {
	return current+add <= int(MaxCartItems)
}

func main() {
	fmt.Println(canAdd(98, 2))
	fmt.Println(canAdd(98, 3))
}
```

Save this as `lab/06limit/main.go`. **Success criteria:** `true`, `false`. Replace `MaxCartItems` with a bare `100` in the signature — confirm the code still works, and explain in a comment why the typed `Limit` is worth it.

---

## Success criteria

- [ ] Packages `06types`, `06money`, `06status`, `06parse`, `06limit` (or one combined package — your choice, as long as every task is done) run from `examples/`
- [ ] In task 1, your prediction comments matched the actual output
- [ ] An iota-based enum with a `switch` over statuses
- [ ] `strconv.Atoi` with an `err` check
- [ ] You understand the difference between byte length and "characters"

## If something goes wrong

| Symptom | Check |
|---------|----------|
| `overflows int8` | The constant doesn't fit — change the type |
| `cannot use i (variable of type int) as OrderStatus` | Needs a cast `OrderStatus(i)` or a comparison against a const |
| `invalid operation: Cents * int` | Convert with `Cents(qty)` |
| Unexpected iota value | Recount the lines in the const block from 0 |
| `package main is not in GOROOT` | Run from `examples/`, path `./lab/06money` |

Next lesson (theory): [07. Structs](07-structs.md).
