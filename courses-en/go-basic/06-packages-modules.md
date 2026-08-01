# 06. Packages and go mod

## Packages

Each folder of `.go` files is **one package** (usually one name per directory).

```text
mymodule/
├── go.mod
├── cmd/app/main.go      # package main — entry point
└── internal/store/
    └── store.go         # package store
```

- **`package main`** — executable binary (`func main`).
- **Capitalized name** — export (public package API).
- **`internal/`** — import only from the parent module (the compiler forbids external import).

```go
// store/store.go
package store

func Load() error { }   // exported
func parse() { }        // package-private
```

Import:

```go
import "github.com/you/mymodule/internal/store"
```

## go mod

```bash
go mod init github.com/you/project
go get github.com/go-chi/chi/v5@latest
go mod tidy    # clean up go.sum
```

`go.mod` — module name and dependencies. `go.sum` — checksums (commit to git).

Go version in `go.mod`:

```go
go 1.22
```

## Build and run

```bash
go run ./cmd/app
go build -o bin/app ./cmd/app
go test ./...
```

`./...` — all packages recursively from the current module.

## Layout for go-intermediate

Typical sketch (simplified):

```text
cmd/api/main.go
internal/handler/
internal/service/
internal/repository/
```

For basic, splitting **main** and **one internal package** is enough — as in [09-lab-mini-cli.md](09-lab-mini-cli.md).

## Common mistakes

- Cyclic imports between packages — refactor: move shared types to a third package.
- Running `go test` outside the module root.
- Import path without a domain (`import "store"`) — only inside one module with `replace` (rare).

## Checklist

- [ ] Understand export by first letter case
- [ ] Ran `go mod init` / work inside an existing `go.mod`
- [ ] Know the difference between `cmd/` and `internal/`

Next: [07. Tests and go vet](07-testing-tooling.md).
