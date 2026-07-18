# 31. Lab: linters and vet on lab code

The goal is to run **gofmt**, **go vet**, **staticcheck** (or **golangci-lint**) on the `lab/errors` and `lab/interfaces` packages and fix the findings. Practice for the pipeline before a merge.

**Time:** ~25–35 minutes.

## Setup

```bash
cd courses/go-basic-en/examples
go version
go test ./...
```

Install these (once per machine):

```bash
go install golang.org/x/tools/cmd/goimports@latest
go install honnef.co/go/tools/cmd/staticcheck@latest
# optional: golangci-lint per the instructions at golangci-lint.run
```

---

## Task 1. gofmt / goimports

```bash
gofmt -l .
goimports -l .
```

If there's any output, fix it:

```bash
goimports -w ./lab/...
```

**Criterion:** `gofmt -l ./lab` is empty.

---

## Task 2. go vet

```bash
go vet ./...
```

Typical course bugs to look for in your own code:

| Pattern | Fix |
|---------|-------------|
| `fmt.Printf("%d", id)` where `id string` | `%s` or `%v` |
| `defer` after `os.Open` only on the success path | defer right after a successful Open |
| copying a mutex | pointer receiver |

Fix all vet findings until the output is clean.

---

## Task 3. staticcheck

```bash
staticcheck ./...
```

Pay attention to:

- **SA4006** — unused assignments (`result, err := ...` without using `result`);
- **ST1000** — no package comment (add one line in `doc.go`);
- simplifiable branches like `if err != nil { return err }; return nil` → `return err`.

Example `doc.go`:

```go
// Package errorslab provides error-handling exercises for go-basic course.
package errorslab
```

---

## Task 4. golangci-lint (optional)

Create `.golangci.yml` in `examples/`:

```yaml
run:
  timeout: 3m
linters:
  enable:
    - govet
    - errcheck
    - staticcheck
    - ineffassign
    - unused
```

```bash
golangci-lint run ./lab/...
```

### Specifically fix errcheck

If in lab 22 `ConsoleSink.Write` ignores the error from `fmt.Printf` — that's fine; but **don't** leave:

```go
os.Remove(tmp) // unchecked in production code
```

In a course `main`, this is acceptable:

```go
if err := os.Remove(tmp); err != nil {
    log.Printf("cleanup: %v", err)
}
```

---

## Task 5. Checklist before "merge"

Run these in order and save the output to `lab/tooling-check.txt` (optional):

```bash
go mod tidy
goimports -w ./lab/...
go vet ./...
staticcheck ./...
go test -race ./...
```

All commands — exit code 0.

---

## Task 6. Deliberate violation (experiment)

In a separate branch or file `lab/badlint/example.go` (don't commit to main):

```go
package badlint

import "fmt"

func BadPrintf(n int) {
    fmt.Printf("%s", n) // vet: wrong type
}

func Unused() {
    x := 1
    _ = x
}
```

Run `go vet` and `staticcheck` — make sure they catch it. Delete the file or branch after the experiment.

---

## Success criteria

| Step | Expectation |
|-----|----------|
| gofmt/goimports | no diff |
| go vet ./... | clean |
| staticcheck ./... | clean |
| go test -race ./lab/... | PASS |
| golangci-lint (if present) | 0 issues |

---

## If something goes wrong

| Symptom | Solution |
|---------|---------|
| staticcheck not found | `go install` + `$GOPATH/bin` in PATH |
| errcheck on `defer Close` | Close returns an err — handle it or nolint with a reason |
| linter complains about examples/solutions | `run: skip-dirs: solutions` in the yml |
| -race is slow | normal the first time |

---

Next lesson: [32. encoding/json](32-json.md).
