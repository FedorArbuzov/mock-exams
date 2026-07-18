# 00. Environment: Go toolchain, editor, gopls

## What you'll learn

- How to install **Go 1.22+** and check its version.
- The development loop: **file → `go run` → read the output → fix**.
- A brief overview of **GOPATH vs Go modules** — covered in full in [27-modules.md](27-modules.md).
- The **`examples/`** directory layout, module `github.com/mock-exams/go-basic-en-labs`.
- A minimal **editor** setup (gopls, gofmt).

## Installing Go

**Go 1.22** or newer is recommended (the course is written against `go 1.22` in [`examples/go.mod`](examples/go.mod)). Official installer: [go.dev/dl](https://go.dev/dl/).

### Linux and macOS

```bash
# After installing from a .tar.gz or a package manager
go version    # go1.22.x or go1.23.x

go env GOROOT   # where the toolchain lives
go env GOPATH   # cache directory for modules and bin (see below)
```

Optional — the version manager [goenv](https://github.com/go-nv/goenv) for switching Go versions:

```bash
goenv install 1.22.5
goenv local 1.22.5
go version
```

### Windows

The `.msi` installer from [go.dev/dl](https://go.dev/dl/), or **goenv** under WSL. After installing, **restart your terminal** — PATH only updates in new sessions. PowerShell:

```powershell
go version
Get-Command go
```

### Checking it matches CI

Add a `go.mod` file at the root of your pet projects with the directive:

```go
go 1.22
```

Or pin the `golang:1.22` image explicitly in your CI config. That way "works on my machine" won't drift from the pipeline.

| Tool | Purpose | When you'll need it |
|------------|------------|-------------------|
| `go run` | Compile + run without keeping a binary | every lab |
| `go build` | Build an executable | capstone, CLI |
| `go test` | Run tests | lessons 28–31 |
| `go mod` | Dependencies and modules | lesson 27 |
| `go fmt` / `gofmt` | Formatting | always before a commit |

## GOPATH vs Go modules (brief overview)

Historically, projects lived at `$GOPATH/src/github.com/you/project`. With **Go modules** (since 1.11, default since 1.16), the project root is the directory containing **`go.mod`**. Imports like `github.com/mock-exams/go-basic-en-labs/lab/01hello` resolve through the module, not a fixed path under GOPATH.

```bash
go env GO111MODULE   # on (default)
go env GOPATH        # ~/go on Linux/macOS, %USERPROFILE%\go on Windows
```

**GOPATH** today is mainly used for:

- the cache of downloaded modules (`$GOPATH/pkg/mod`);
- installed CLIs (`go install` → `$GOPATH/bin` — add it to PATH).

Don't put course code under `~/go/src` by hand — work inside a clone of the repository, in the `courses/go-basic-en/examples/` directory. Details — [27-modules.md](27-modules.md).

## First run: `go run`

The course module is already set up:

```text
courses/go-basic-en/examples/
├── go.mod          # module github.com/mock-exams/go-basic-en-labs
└── lab/
    └── 01hello/
        └── main.go
```

Move into the examples directory:

```bash
cd courses/go-basic-en/examples
go version
go run ./lab/01hello
```

**What you'll see (roughly):**

```text
Hello from lab 01
Go version: go1.22.5
OS/Arch: windows amd64
```

The lab source:

```go
package main

import (
	"fmt"
	"runtime"
)

func main() {
	fmt.Println("Hello from lab 01")
	fmt.Println("Go version:", runtime.Version())
	fmt.Println("OS/Arch:", runtime.GOOS, runtime.GOARCH)
}
```

`fmt.Println` is the main "instrument" of the first weeks: it writes to **stdout** with a trailing newline. The **`runtime`** package gives you the Go version and platform.

### The classic first-day error

```bash
go run main.go    # from the repo root, with no go.mod there
```

Error: `go: cannot find main module`. **Always** run from the directory containing `go.mod`, or point at the package path: `go run ./lab/01hello`.

## Course directory layout

```text
courses/go-basic-en/
├── README.md
├── 00-environment.md … 37-capstone.md
├── interview-cheatsheet.md
└── examples/
    ├── go.mod              # github.com/mock-exams/go-basic-en-labs
    ├── lab/                # your lab solutions (subdirectories with main.go)
    └── solutions/          # reference answers — open only after your own attempt
```

Always run **from `examples/`** — otherwise relative paths in later labs (JSON, files) won't resolve.

Each lab is a **separate `main` package** in its own subdirectory (`lab/02variables/main.go`), not one giant `main.go`. That's the Go convention: one `main` per command/utility.

## Editor and gopls

**VS Code**, **Cursor**, GoLand, Neovim — any editor with Go support works. For this course, you need:

| Extension / setting | Why |
|------------------------|-------|
| **gopls** | language server: autocomplete, go to definition, diagnostics |
| Format on save (`gofmt` / `goimports`) | consistent style |
| `go test` integration | run tests from the IDE (later) |

Installing gopls (once):

```bash
go install golang.org/x/tools/gopls@latest
```

Make sure `$GOPATH/bin` (or `%USERPROFILE%\go\bin`) is on your PATH. Open the **root** of `courses/go-basic-en/examples/` in your editor if gopls gets confused about modules when the whole monorepo is open.

### Encoding on Windows

Save files as **UTF-8**. Go source is UTF-8 by spec. If your terminal shows garbled characters for non-ASCII text, switch to Windows Terminal with UTF-8. Paths with non-ASCII characters occasionally break older tools — stick to ASCII paths for course projects.

## `go.mod` and the lab module

In [`examples/go.mod`](examples/go.mod):

```go
module github.com/mock-exams/go-basic-en-labs

go 1.22
```

The module name is a **logical path** used for imports inside the monorepo; it doesn't need to exist on GitHub unless you're publishing the package. Locally, `go run ./lab/01hello` compiles the `main` package with no external dependencies.

Later you'll add things like:

```bash
go get github.com/some/dependency
```

and a `require` line will appear in `go.mod` automatically. Course rule for the first few weeks: **standard library only** (`fmt`, `strings`, `encoding/json`, …).

## Common mistakes

**"go not found" after installing.** Terminal not restarted; Go not on PATH; on Windows, the installer didn't add `%USERPROFILE%\go\bin`. Check with `which go` (Linux/macOS) or `Get-Command go` (PowerShell).

**`cannot find main module`.** Running from a directory with no `go.mod`. Fix: `cd courses/go-basic-en/examples` or `go run` with a package path inside the module.

**gopls flags imports but `go build` works fine.** Wrong workspace root open; gopls not installed; gopls version mismatched with Go. Reinstall: `go install golang.org/x/tools/gopls@latest`.

**Different Go versions across a team.** Pin `go 1.22` in `go.mod` and the CI image.

**Confusing `go run file.go` with `go run ./pkg`.** For this course's labs, use the **package path** (`./lab/01hello`) so the compiler sees every `.go` file in the package.

**Putting code under `$GOPATH/src` following an old tutorial.** With modules, a `go.mod` at the project root is enough.

## Summary

The go-basic environment is **Go 1.22+ on the host**, a terminal, and an editor with **gopls**. You run programs with `go run ./lab/...` from the `examples/` directory, working inside the `github.com/mock-exams/go-basic-en-labs` module. `fmt.Println` and `runtime.Version` are your first diagnostic tools; types, structs, and `go test` come next.

## Checklist

- [ ] `go version` shows **1.22.x or newer**
- [ ] `go env GOPATH` responds without an error
- [ ] `go run ./lab/01hello` from `examples/` prints three lines
- [ ] You understand the difference between "go isn't installed" and "not running inside a module"
- [ ] The `courses/go-basic-en/examples/` directory is open, and you can see `go.mod`
- [ ] gopls is installed (`gopls version`) or the Go extension in your IDE is active

Next lesson: [01. The Go landscape](01-landscape.md).
