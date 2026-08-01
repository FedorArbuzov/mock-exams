# 07. Tests and go vet

## go test

Tests live in `*_test.go`, same package or `package foo_test` (black-box).

```go
func TestAdd(t *testing.T) {
    got := Add(2, 3)
    want := 5
    if got != want {
        t.Fatalf("Add(2,3) = %d, want %d", got, want)
    }
}
```

```bash
go test ./...
go test -v ./internal/store
go test -race ./...    # races — mandatory in CI later
```

## Table-driven tests

```go
func TestParseQty(t *testing.T) {
    tests := []struct {
        name  string
        input string
        want  int
        err   bool
    }{
        {"ok", "3", 3, false},
        {"bad", "x", 0, true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseQty(tt.input)
            if (err != nil) != tt.err {
                t.Fatalf("err = %v, want err=%v", err, tt.err)
            }
            if got != tt.want {
                t.Fatalf("got %d, want %d", got, tt.want)
            }
        })
    }
}
```

Standard style in Go codebases. Libraries like **testify** belong in `go-testing`, not here.

## go vet

Built-in static analysis:

```bash
go vet ./...
```

Catches suspicious constructs: wrong `Printf` verbs, unreachable code, copying locks.

## Linters (overview)

| Tool | Purpose |
|------|---------|
| `gofmt` / `goimports` | formatting |
| `go vet` | basic checks |
| `staticcheck` | deeper analysis |
| `golangci-lint` | aggregator in CI |

On pet projects, `go fmt ./...` and `go vet` before push are enough. In `gitlab-basic` you will add a `go test` + `golangci-lint` job.

## Common mistakes

- Tests in `main.go` — only `*_test.go`.
- Tests depending on execution order — each test is isolated.
- Ignoring `-race` “while there’s little code” — build the habit early.

## Checklist

- [ ] Wrote a table-driven test
- [ ] `go test ./...` is green
- [ ] Ran `go vet ./...`

Next: [08. JSON, files, time](08-json-files-time.md).
