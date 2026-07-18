# Go Basic — Interview Cheatsheet

A reference for **after** finishing the course. Test yourself **without peeking** at the chapters, then check yourself here and in [36-interview-qa.md](36-interview-qa.md).

---

## Quick answers

### Types and zero values

| Question | Answer |
|--------|-------|
| Zero value of `int`, `string`, `bool` | `0`, `""`, `false` |
| Zero value of slice, map, pointer | `nil` |
| `:=` | short declaration inside a function |
| Export | an identifier with an **uppercase** first letter |

### Slices and maps

| Question | Answer |
|--------|-------|
| Array vs slice | `[N]T` fixed size; `[]T` dynamic header |
| `append` | may create a new backing array → assign the result |
| Writing to a `nil` map | **panic** |
| Reading from a `nil` map | zero value, no panic |
| `delete(m, k)` | always safe |

### Pointers and methods

| Question | Answer |
|--------|-------|
| `&T{}` vs `new(T)` | both give a `*T` pointing at a zero value |
| Pointer receiver | mutates the struct, avoids a copy |
| Value receiver | a copy, for small immutable types |

### Interfaces and errors

| Question | Answer |
|--------|-------|
| Implementing an interface | implicit, all methods match |
| `any` | alias for `interface{}` |
| Error idiom | `if err != nil { return ... }` |
| `%w` | wrap for `errors.Is` / `errors.As` |
| `panic` | bugs / unrecoverable, not for user input |

### defer / panic

| | |
|---|---|
| `defer` | LIFO on function exit |
| `recover` | only inside a deferred func |

### Packages and modules

| | |
|---|---|
| `go mod init` | starts a new module |
| `go mod tidy` | syncs `require` entries |
| Import | path from `go.mod` + `/pkg` |

### Concurrency (overview)

| Question | Answer |
|--------|-------|
| Goroutine | `go f()` — a lightweight thread, scheduled by the runtime |
| `go` inside a loop | a single loop variable before Go 1.22 — a bug; pass `i` as a parameter |
| Shared state | needs a mutex/channel — the subject of a separate advanced course |

### Tests and tooling

| | |
|---|---|
| Table-driven | `[]struct{...}` + `t.Run` |
| `go test ./...` | all packages |
| `go test -race` | race detector (CI) |
| `go vet` | suspicious code |

### JSON

| | |
|---|---|
| Exporting fields | uppercase first letter |
| `json:"name,omitempty"` | name + skip on zero value |
| `json:"-"` | ignore |
| `Unmarshal` | second argument is a **pointer** |
| `time.Time` in JSON | RFC3339 string |

### Time

| | |
|---|---|
| Reference layout | `2006-01-02 15:04:05` |
| API format | `time.RFC3339`, store as UTC |
| `Parse` vs `ParseInLocation` | UTC by default vs a specific zone |

### Files

| | |
|---|---|
| Small file | `os.ReadFile` / `WriteFile` |
| Line by line | `bufio.Scanner` |
| Paths | `filepath.Join`, not `+ "/"` |
| Atomic write | `.tmp` + `os.Rename` |

---

## Mini snippets

```go
// error wrap
if err != nil {
	return fmt.Errorf("load catalog: %w", err)
}

// errors.Is
if errors.Is(err, os.ErrNotExist) { /* ... */ }

// slice copy
out := append([]Task(nil), s.tasks...)

// safe defer close
f, err := os.Open(path)
if err != nil {
	return err
}
defer f.Close()

// table-driven test
for _, tc := range tests {
	t.Run(tc.name, func(t *testing.T) {
		got := fn(tc.in)
		if got != tc.want {
			t.Fatalf("got %v want %v", got, tc.want)
		}
	})
}

// JSON indent save
data, err := json.MarshalIndent(v, "", "  ")
if err != nil {
	return err
}
return writeAtomic(path, data, 0o644)
```

---

## Common traps

1. Writing to a **nil map** → panic
2. **Not assigning** the result of `append`
3. An **unexported** field not showing up in JSON
4. `Unmarshal` without `&`
5. `omitempty` hides `false` / `0` — the client can't tell "not set" apart
6. `List()` returns the internal slice — mutation from outside
7. A file path relative to the **cwd**, not to the source location
8. Comparing structs with `==` when they have slice/map fields — doesn't compile
9. `interface{}` with a JSON number → **float64**
10. `panic` on bad user input in a CLI

---

## Capstone checklist

- [ ] `cmd/` + `internal/` layout
- [ ] `Load` / `Save` + atomic write
- [ ] `flag` for `-data` and filters
- [ ] exit 0 / 1, errors to stderr
- [ ] `go test` on validate and store

Details: [37-capstone.md](37-capstone.md).

---

[← README](README.md) · [36-interview-qa](36-interview-qa.md) · [37-capstone](37-capstone.md)
