# 18. Lab: control flow and strings

## Lab goal

Reinforce control flow and strings: `switch` on statuses, `for range`, string parsing, safe truncation by runes.

**Time:** ~45–55 minutes.
**Environment:** `courses/go-basic-en/examples`, Go 1.22+.

## Setup

```bash
cd courses/go-basic-en/examples
mkdir -p lab/18control
```

File `lab/18control/main.go`.

---

## Task 1. Order statuses: `switch`

### Model

```go
type Order struct {
	ID     string
	Status string // "new", "paid", "shipped", "cancelled"
	Total  int
}
```

Function `func NextAction(o Order) string`:

| Status | Return |
|--------|---------|
| `new` | `"await_payment"` |
| `paid` | `"pack"` |
| `shipped` | `"none"` |
| `cancelled` | `"none"` |
| other | `"unknown"` |

Use **`switch o.Status`**, not an `if` chain (for practice). Handle the unknown status in `default`.

### Success criteria

- [ ] All five branches are covered by a test in `main` via a table slice.
- [ ] No `fallthrough`.

---

## Task 2. Filtering orders: `for range`

Input: `[]Order`. Function `func PaidTotal(orders []Order) int` — the sum of `Total` only for `Status == "paid"`.

```go
orders := []Order{
	{ID: "1", Status: "paid", Total: 1000},
	{ID: "2", Status: "new", Total: 500},
	{ID: "3", Status: "paid", Total: 200},
}
// expected 1200
```

### Success criteria

- [ ] An empty slice → `0`.
- [ ] Uses `for _, o := range orders`.

---

## Task 3. Parsing a CSV SKU line

A line in the format `"SKU1:10,SKU2:5,SKU3:0"` — SKU:quantity pairs separated by commas.

Implement `func ParseStockLine(line string) (map[string]int, error)`:

1. `strings.TrimSpace` on the whole line; empty → empty map, not an error.
2. `strings.Split` on `,`.
3. Each part: `strings.SplitN(part, ":", 2)` — exactly two fields.
4. Quantity — `strconv.Atoi`; a format error → `error`.
5. A negative quantity → error.

### Example

```go
m, err := ParseStockLine("TEA:10,COFFEE:5")
// map[TEA:10 COFFEE:5]
```

### Success criteria

- [ ] An invalid format `"TEA-10"` → error.
- [ ] A duplicate SKU in the line — the last value wins (or return an error — document your choice in a comment).

---

## Task 4. Truncate display name

`func TruncateDisplay(name string, maxRunes int) string` — truncate to `maxRunes` **runes**, not bytes.

```go
TruncateDisplay("Василий", 3)   // "Вас"
TruncateDisplay("hello", 10)    // "hello"
TruncateDisplay("Go🙂", 3)      // "Go🙂"
TruncateDisplay("Go🙂", 2)      // "Go" (without half an emoji)
```

Use `[]rune(name)` or `range` with counting.

### Success criteria

- [ ] `maxRunes <= 0` → `""`.
- [ ] No invalid UTF-8 in the result for the tests above.

---

## Task 5 (bonus). Command loop

`func REPL()` reads lines from stdin (`fmt.Scanln` or `bufio.Scanner`):

- `quit` — exit the `for {}`.
- `total <csv-line>` — parses a line from Task 3, prints the sum of quantities.
- anything else — `unknown command`.

A demonstration of `for` as a REPL.

---

## Combined checklist

- [ ] `switch` on order statuses
- [ ] `PaidTotal` with `range`
- [ ] `ParseStockLine` with `strings` + `strconv`
- [ ] `TruncateDisplay` by runes
- [ ] You understand the byte/rune difference using the emoji example

## If something goes wrong

| Symptom | Cause |
|---------|-------|
| garbled characters in truncate | sliced by bytes |
| `Atoi` fails | didn't check err |
| switch always hits default | typo in status, wrong case |

Next lesson: [19. Type conversions](19-type-conversions.md).
