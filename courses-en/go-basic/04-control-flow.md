# 04. Control flow

## if

```go
if err != nil {
    return err
}

if n := len(items); n == 0 {
    return errors.New("empty")
}
// n is only visible in this if
```

A short declaration in `if` is idiomatic for `err` and locals.

## for — the only loop

```go
for i := 0; i < 10; i++ { }

for _, item := range items { }

for k, v := range m { }

for { /* infinite; exit with break/return */ }
```

`range` over a slice gives index and value; over a map — key and value. A string in Go is UTF-8 bytes; `range` over `string` yields **rune** (code point) and offset.

## switch

```go
switch status {
case "todo", "pending":
    // ...
case "done":
    // ...
default:
    // ...
}

switch {
case x < 0:
case x == 0:
default:
}
```

In Go there is **no fallthrough by default** (except explicit `fallthrough`).

## defer (intro)

```go
f, err := os.Open(path)
if err != nil {
    return err
}
defer f.Close()
```

`defer` postpones a call until the function returns — LIFO. More in [05-interfaces-errors.md](05-interfaces-errors.md).

## Common mistakes

- `:=` in `if` shadowing an outer `err` — classic bug: outer `err` stays `nil`.
- Mutating a slice during `range` — unpredictable; copy or iterate by index.
- `break` in a `switch` inside `for` — exits only the `switch`; use a label or a flag.

## Checklist

- [ ] Wrote `for range` over a slice and a map
- [ ] Used `if err != nil`
- [ ] Know that `for` is the only loop

Next: [05. Interfaces and errors](05-interfaces-errors.md).
