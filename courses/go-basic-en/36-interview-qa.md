# 36. Interview Q&A: top 30 Go questions (basic)

## Introduction: why this chapter

In a junior Go interview, you're more often asked to **explain how code behaves** — the difference between a slice and an array, how errors are handled, what happens with `go` inside a loop — than to "list the keywords." This chapter is a set of **expanded answers** to the questions from [interview-cheatsheet.md](interview-cheatsheet.md).

**How to work through this chapter:**

1. Read the question, **cover** the answer, and answer out loud for 1–2 minutes.
2. Open the explanation and compare: not just "what," but **why**.
3. If you struggled, go back to the lesson listed in the "Where in the course" column.

---

## Block 1. Language basics and types

### 1. How is Go different from Python/JavaScript "in two words"?

**Answer.** Static typing, compilation to a native binary, built-in concurrency (goroutines) — but at the basic level, more important is: **explicit errors** (`error` return values instead of exceptions), **simple syntax** with no class inheritance, **composition** via struct embedding and interfaces. A single binary means a simple deployment (important for DevOps and microservices in mock-exams).

**Where in the course:** [01-landscape.md](01-landscape.md).

---

### 2. What is a zero value?

**Answer.** Every type has a **zero value** when declared without initialization:

| Type | Zero value |
|-----|------------|
| numbers | `0` |
| `string` | `""` |
| `bool` | `false` |
| pointer, slice, map, chan, func, interface | `nil` |
| struct | all fields — zero values |

```go
var n int
var s []int
fmt.Println(n, s == nil) // 0 true
```

**Where in the course:** [02-variables-zero-values.md](02-variables-zero-values.md).

---

### 3. `:=` vs `var` vs `=`?

**Answer.**

- `x := 10` — short declaration with type inference (only inside functions).
- `var x int = 10` — explicit declaration; at package level `:=` isn't available.
- `x = 10` — assignment to an already-declared variable.

`:=` requires **at least one new** variable on the left: `a, err := f()`.

**Where in the course:** [02-variables-zero-values.md](02-variables-zero-values.md).

---

### 4. Exportedness: why isn't `name` visible from another package?

**Answer.** An identifier is **exported** if it starts with an **uppercase** letter (`Name`, `NewStore`). Lowercase means visibility only within the package. This isn't a `public/private` keyword — it's a convention enforced by the compiler plus tools like `encoding/json` and `go doc`.

**Where in the course:** [26-packages.md](26-packages.md), [32-json.md](32-json.md).

---

### 5. `new(T)` vs `&T{}`?

**Answer.** Both give a `*T` pointing at a zero value:

```go
p1 := new(int)   // *int → 0
p2 := &int{}     // same thing
```

`new` isn't used much in practice; the idiom is the literal `&T{Field: v}` to initialize fields.

**Where in the course:** [11-pointers.md](11-pointers.md).

---

## Block 2. Slices, maps, arrays

### 6. Array vs slice?

**Answer.**

| | Array `[N]T` | Slice `[]T` |
|---|------------|-------------|
| Size | fixed | dynamic |
| Passed to a function | copy of the whole array | copy of the **header** (ptr, len, cap) |
| Type | `[3]int` ≠ `[4]int` | `[]int` |

A slice is a reference to an underlying array; `append` may reallocate the array.

**Where in the course:** [08-slices-arrays.md](08-slices-arrays.md).

---

### 7. What does `append` do?

**Answer.** It adds elements; if `cap` is insufficient, it allocates a new, larger array, copies into it, and returns a **new slice header** (which may differ from the original):

```go
s := []int{1, 2}
s2 := append(s, 3)
```

Always assign the result: `s = append(s, x)`. Modifying elements by index may be visible in both slices if they share an array — a trap with `s1 := s[:2]`.

**Where in the course:** [08-slices-arrays.md](08-slices-arrays.md).

---

### 8. How do you initialize a map, and what happens when you write to a `nil` map?

**Answer.**

```go
var m map[string]int // nil
m["a"] = 1           // panic: assignment to entry in nil map

m = make(map[string]int)
m["a"] = 1           // OK
```

Reading from a nil map returns the key type's zero value without panicking. `len(nil map)` → 0.

**Where in the course:** [12-maps.md](12-maps.md).

---

### 9. How do you safely remove a key from a map?

**Answer.** `delete(m, key)` — always safe, even if the key doesn't exist. Iteration: `for k, v := range m` — the order is **random** (deliberately so).

**Where in the course:** [12-maps.md](12-maps.md).

---

### 10. Value receiver vs pointer receiver?

**Answer.**

| | Value `(t T)` | Pointer `(t *T)` |
|---|---------------|------------------|
| Struct mutation | copy, original unchanged | mutates the original |
| Calling on `T` and `*T` | Go inserts `&` when needed | Go dereferences when needed |
| Large structs | copying is expensive | pointer preferred |

If a method mutates the receiver or the struct is large — use a pointer. Small, immutable ones — value is fine.

**Where in the course:** [14-methods.md](14-methods.md).

---

## Block 3. Interfaces and errors

### 11. How do interfaces work in Go?

**Answer.** **Implicit** implementation: a type satisfies an interface if it has all the methods with compatible signatures. There's no `implements` keyword. An interface value = (type, value). A nil interface — only when both the type and the value are nil — is a common trap.

```go
type Stringer interface { String() string }
```

**Where in the course:** [20-interfaces.md](20-interfaces.md).

---

### 12. The empty interface `any` — what's it for?

**Answer.** `any` = `interface{}` — it can hold a value of **any** type. Used in `json.Unmarshal` into `map[string]any`, generic helpers. After extracting a value you need a **type assertion**: `v.(string)` or `v, ok := v.(string)`.

**Where in the course:** [20-interfaces.md](20-interfaces.md), [32-json.md](32-json.md).

---

### 13. The error-handling idiom?

**Answer.**

```go
result, err := do()
if err != nil {
	return fmt.Errorf("do failed: %w", err)
}
```

Not exceptions (except `panic` for programming bugs). The caller is **required** to check `err`. In an HTTP handler — mapping to a status code *(intermediate)*.

**Where in the course:** [21-errors.md](21-errors.md).

---

### 14. What's `%w` in `fmt.Errorf` for?

**Answer.** Wraps the error while preserving the chain for `errors.Is` and `errors.As`:

```go
if errors.Is(err, os.ErrNotExist) { ... }
```

Without `%w` — only the text is kept, and `Is` won't work.

**Where in the course:** [21-errors.md](21-errors.md), [25-errors-is-as.md](25-errors-is-as.md).

---

### 15. `panic` vs `error`?

**Answer.**

| | `error` | `panic` |
|---|---------|---------|
| When | expected failures (file, network) | a programming bug, unrecoverable |
| Handling | `if err != nil` | `recover` in a deferred call (rare) |

In libraries and HTTP handlers — **don't panic** on user input. `json.Unmarshal` returns an error, not a panic.

**Where in the course:** [23-defer-panic-recover.md](23-defer-panic-recover.md).

---

### 16. What does `defer` do?

**Answer.** Delays a call until the enclosing function returns (LIFO). Classic example: `defer f.Close()`. `defer`'s arguments are evaluated **at the moment of the defer statement**, not when it executes.

**Where in the course:** [23-defer-panic-recover.md](23-defer-panic-recover.md).

---

## Block 4. Concurrency (basic-level overview)

### 17. A goroutine in one sentence?

**Answer.** A lightweight thread of execution scheduled by the Go runtime (`go f()`). Not a 1:1 match with an OS thread. At the basic level — know the syntax and that shared state **needs synchronization**; synchronization and channels are the subject of a separate advanced course.

**Where in the course:** [01-landscape.md](01-landscape.md).

---

### 18. Why is `go` inside a loop with a closure a bug?

**Answer.** All the goroutines can end up seeing the **same** loop variable (before Go 1.22, `for` had a single variable). Fix: pass it as a parameter, `go func(i int) { ... }(i)`, or rely on Go 1.22+'s per-iteration variables.

**Where in the course:** overview in [01-landscape.md](01-landscape.md).

---

## Block 5. Packages, modules, tests

### 19. `go mod init` and `go.mod`?

**Answer.** A module is a unit of dependency versioning. `go.mod` contains the `module` path, the `go` version, and `require` entries. `go get` adds dependencies; `go mod tidy` removes unused ones. Import: `github.com/org/repo/pkg`.

**Where in the course:** [27-modules.md](27-modules.md).

---

### 20. What's a table-driven test?

**Answer.** A single test function, a slice of cases `[]struct{ name, input, want }`, and a loop `t.Run(tc.name, func(t *testing.T) { ... })`. Idiomatic in Go — covers edge cases without copy-paste.

**Where in the course:** [28-testing.md](28-testing.md).

---

### 21. `go test ./...` and `-race`?

**Answer.** `./...` — all packages, recursively. `-race` — the race detector (slower, for CI). `-cover` — coverage. Tests live in `*_test.go`, functions `TestXxx(t *testing.T)`.

**Where in the course:** [28-testing.md](28-testing.md).

---

### 22. What's `go vet` for?

**Answer.** Static analysis: suspicious constructs (`Printf` with the wrong verb, unreachable code). Run before merge; complements `staticcheck` / `golangci-lint` — [30-tooling.md](30-tooling.md).

**Where in the course:** [30-tooling.md](30-tooling.md).

---

## Block 6. JSON, time, files

### 23. Why didn't a field end up in the JSON?

**Answer.** (1) the field isn't exported; (2) the tag is `json:"-"`; (3) `omitempty` plus a zero value; (4) you forgot to Marshal. Check the capital letter and the tags.

**Where in the course:** [32-json.md](32-json.md).

---

### 24. How do you format a date in Go?

**Answer.** `t.Format(layout)`, where the layout is built from the reference time `2006-01-02 15:04:05`. API constant: `time.RFC3339`. Not `YYYY-MM-DD` like in strftime.

**Where in the course:** [33-time.md](33-time.md).

---

### 25. `os.ReadFile` vs `bufio.Scanner`?

**Answer.** ReadFile — the whole file into memory, simple. Scanner — line by line, for logs. For shop JSON — ReadFile + Unmarshal.

**Where in the course:** [34-files-io.md](34-files-io.md).

---

## Block 7. Practice and design

### 26. When should you pass a pointer to a function?

**Answer.** When you need to modify the argument; the struct is large (avoid a copy); methods with a pointer receiver; `json.Unmarshal` requires a pointer. Slices and maps already contain a pointer to their data — sometimes a pointer to a slice isn't needed to mutate elements, but it is needed to change the slice header itself.

**Where in the course:** [11-pointers.md](11-pointers.md).

---

### 27. Comparing structs with `==`?

**Answer.** You can, if all fields are **comparable** (no slice, map, func). Otherwise — `reflect.DeepEqual` or comparing fields manually / `cmp.Equal` with options.

**Where in the course:** [07-structs.md](07-structs.md).

---

### 28. Constants and `iota`?

**Answer.** `iota` is an auto-increment inside a `const` block, for enum-like values:

```go
const (
	StatusTodo = iota
	StatusDone
)
```

**Where in the course:** [05-constants-iota.md](05-constants-iota.md).

---

### 29. How do you lay out a CLI project?

**Answer.** At minimum: `cmd/app/main.go` (thin entry point), an `internal/` directory or root-level packages like `store`, `model`, `cmd` flags. `go mod` at the root. Capstone — [37-capstone.md](37-capstone.md). Cobra isn't required — the `flag` package is enough.

**Where in the course:** [26-packages.md](26-packages.md), [37-capstone.md](37-capstone.md).

---

### 30. After go-basic — what's next?

**Answer (example).** Basic gives you syntax, errors, tests, and JSON — that's the foundation for further work with backend APIs, concurrency (goroutines, channels), and deeper testing in Go.

**Where in the course:** [README.md](README.md).

---

## Summary

A strong junior Go candidate can explain **zero values**, the **slice header**, **error wrapping**, **exportedness**, and **JSON tags**, and can give a **counterexample** (nil map write, `List()` without a copy). Go through all 30 out loud over 2–3 sessions.

---

## Checklist before the capstone

- [ ] Answered 5+ questions without peeking
- [ ] Can explain the array/slice difference on a whiteboard
- [ ] Can write a table-driven test with `t.Run`
- [ ] Know why `errors.Is` matters after `%w`

**Next step:** [37-capstone.md](37-capstone.md).
