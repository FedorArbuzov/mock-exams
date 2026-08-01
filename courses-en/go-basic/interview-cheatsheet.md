# Go Basic — Interview cheatsheet

Reference **after** finishing lessons 00–10. Does not replace the course.

## Syntax

```go
var x int = 0
y := 42                    // only inside a function
const Max = 3
```

Zero values: `0`, `""`, `false`, `nil`.

## Collections

```go
s := []int{1, 2}
s = append(s, 3)
m := make(map[string]int)
v, ok := m["k"]
```

## Errors

```go
if err != nil { return fmt.Errorf("ctx: %w", err) }
errors.Is(err, ErrNotFound)
errors.As(err, &target)
```

## Interface

Implementation is implicit. Small interfaces (1–2 methods).

## Pointers

`&x`, `*p`. Pointer receiver to mutate a struct.

## defer / panic

`defer f.Close()` — LIFO. `panic` is rare; in APIs return `error`.

## Modules

```bash
go mod init module/path
go test ./...
go vet ./...
```

## JSON

```go
`json:"field_name,omitempty"`
json.Unmarshal(data, &v)  // pointer
```

## Frequent questions

1. **Slice vs array?** — array is fixed; slice is length + capacity + pointer.
2. **When pointer receiver?** — mutation, large struct, consistency across methods.
3. **Nil map vs empty map?** — writing to a nil map panics.
4. **How is Go different from OOP?** — composition, interfaces, no class inheritance.
5. **Where is concurrency?** — not in basic; goroutines + channels in `go-concurrency`.

## Next

[`10-next-steps.md`](10-next-steps.md) → `go-intermediate` via [`golang-path.md`](../golang-path.md).
