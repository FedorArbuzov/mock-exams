# 30. Tooling: go vet, staticcheck, golangci-lint, gofmt

## gofmt and gofmt -w

**gofmt** — canonical formatting (indentation, spacing, alignment):

```bash
gofmt -w .
gofmt -d file.go    # diff without writing
```

Since Go 1.19+, **goimports** is often used for imports (adds/removes imports during formatting):

```bash
go install golang.org/x/tools/cmd/goimports@latest
goimports -w .
```

| Tool | What it does |
|------------|------------|
| gofmt | formatting only |
| goimports | formatting + imports |

**Rule:** don't argue with gofmt in code review — the whole repo stays in one style. IDE: format on save with goimports.

## go vet

Analysis of **obvious** mistakes, no external dependencies:

```bash
go vet ./...
```

Example findings:

```go
fmt.Printf("%d", "wrong")     // printf: wrong type
log.Fatal("err")              // vet: log.Fatal doesn't format like Fatal
lock(); lock()                  // lock copy (if value receiver)
resp, _ := http.Get(url)        // lost cancel — see body close
```

In CI:

```yaml
script:
  - go vet ./...
  - go test ./...
```

`go test` **does not replace** vet — they check different things.

## staticcheck

Goes deeper than stdlib: dead code, simplifications, API misuse, ST1000 (package documentation):

```bash
go install honnef.co/go/tools/cmd/staticcheck@latest
staticcheck ./...
```

Examples:

```go
if err == nil {
    return err
}
// staticcheck: should use 'return nil' instead

var err error = errors.New("x")
// SA4006: value never used
```

A separate binary; often **included** in golangci-lint as the `staticcheck` linter.

## golangci-lint — a meta-linter

One CLI runs govet, staticcheck, errcheck, gosimple, ineffassign, revive, and others.

Installation:

```bash
# see https://golangci-lint.run/welcome/install/
golangci-lint --version
```

Running it:

```bash
golangci-lint run ./...
golangci-lint run --new-from-rev=origin/main
```

A minimal `.golangci.yml` at the repo root:

```yaml
run:
  timeout: 5m
linters:
  enable:
    - govet
    - errcheck
    - staticcheck
    - gosimple
    - ineffassign
    - unused
    - gofmt
    - goimports
issues:
  exclude-use-default: false
```

| Linter | Purpose |
|--------|-------|
| errcheck | unchecked `err` returns |
| ineffassign | assignment without use |
| unused | dead code |
| revive | style, naming (replacement for golint) |

For `go-basic`, the default set is enough — no need for a custom policy.

## errcheck — the friend of `if err != nil`

```go
os.Remove(path)  // errcheck: Error return value not checked
```

Sometimes deliberately:

```go
_ = w.Write([]byte("ok")) // nolint:errcheck // best-effort response
```

An explicit comment is better than a silent `_`.

## IDE integration

VS Code / Cursor with **gopls**:

- diagnostics from the compiler;
- `go vet` on save (configurable);
- golangci-lint as an **additional** linter (extension).

`gopls` is **not** a full replacement for golangci-lint in CI.

## A typical MR pipeline

```text
1. gofmt / goimports -w
2. go mod tidy
3. go vet ./...
4. golangci-lint run ./...
5. go test -race ./...
```

## What to lint in the course project

```bash
cd courses/go-basic-en/examples
golangci-lint run ./...
```

Expected findings on the course code — a reason to fix them.

## Disabling a rule (with care)

```go
//nolint:errcheck
func flush() { ... }
```

Or in `.golangci.yml` under `issues.exclude-rules`. Don't disable linters globally out of laziness — only locally, with a comment explaining **why**.

## go mod and tooling

```bash
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

The linter version in CI must be **pinned** (Docker image or a pinned version), otherwise you get "it's green on my machine" vs. a failed pipeline.

## Common mistakes

- **No gofmt in CI** — whitespace wars in git blame.
- **Only test, no vet** — missed printf bugs.
- **Ignoring errcheck** everywhere via `_`.
- **Different golangci-lint versions** locally and in CI.
- **nolint for the whole file** — masking technical debt.
- **Linting vendor/** — noise; exclude it in the config.

## Checklist

- How does gofmt differ from goimports?
- What does `go vet` find that `go test` doesn't?
- Why use golangci-lint if you already have staticcheck?
- What does errcheck check?
- What's the order of commands before push?
- Where should `.golangci.yml` live?

Next lesson: [31. Lab: linters](31-lab-tooling.md).
