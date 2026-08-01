# 00. Environment and first run

## Why this lesson

Go installs as a single `go` binary that compiles, tests, and fetches dependencies. On `go-basic` everything runs **on the host** — no Docker. Later, `go-intermediate` will raise an API in compose next to FastAPI `:8090`.

## Install

Download **Go 1.22+** from [go.dev/dl](https://go.dev/dl/). Check:

```bash
go version   # go1.22.x or newer
```

On Windows, **restart the terminal** after install. In CI, pin the version (`go` in `go.mod` or a variable in `.gitlab-ci.yml`).

## First run

From the course directory:

```bash
cd courses-en/go-basic/examples
go run ./lab/01hello
```

Expected output: a greeting, Go version, OS/arch.

Minimal program:

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go")
}
```

`package main` + `func main()` is the entry point. Imports come only from the standard library or modules declared in `go.mod`.

## Module and directory

Project root is the folder with **`go.mod`**:

```go
module github.com/mock-exams/go-basic-en-labs

go 1.22
```

Run commands **from `examples/`**, otherwise `go run` will not find the module (`cannot find main module`).

The historical **GOPATH** (`~/go/src/...`) is not needed for new projects — use **Go modules** ([06-packages-modules.md](06-packages-modules.md)).

## Editor

Install **gopls** (often bundled with the Go extension for VS Code/Cursor):

```bash
go install golang.org/x/tools/gopls@latest
```

Open a workspace with root **`courses-en/go-basic/examples`**. Enable format on save — `gofmt` is built into the toolchain.

## Work loop

```text
edit .go → go run ./...  or  go test ./...
         ↓
    read compiler / test error
         ↓
    edit again
```

Go compiler errors are usually precise: “undefined: foo”, “cannot use x (type int) as string”.

## Common mistakes

| Symptom | Cause |
|---------|-------|
| `go: command not found` | Go not on PATH |
| `cannot find main module` | Not running from the directory with `go.mod` |
| Red imports in the IDE | Missing gopls or wrong workspace root |
| `package X is not in std` | Typo in import or missing `go get` |

## Checklist

- [ ] `go version` ≥ 1.22
- [ ] `go run ./lab/01hello` works from `examples/`
- [ ] You know where `go.mod` lives

Next: [01. Types and variables](01-types-variables.md).
