# 27. Modules: go mod init, go get, go.sum

## Modules vs. GOPATH (briefly)

| Era | Model |
|-------|--------|
| GOPATH (legacy) | Code in `$GOPATH/src`, versions handled by hand |
| **Modules** (current) | `go.mod` at the repo root, versions in the file |

At work — **modules only**.

## go mod init

```bash
mkdir shop-cli && cd shop-cli
go mod init github.com/acme/shop-cli
```

This creates `go.mod`:

```go
module github.com/acme/shop-cli

go 1.22
```

**module path** — the import prefix used inside the project:

```go
import "github.com/acme/shop-cli/internal/catalog"
```

Rules for choosing a path:

- public repo — the path matches GitHub/GitLab;
- learning/local — `example.com/foo` or `github.com/mock-exams/go-basic-en-labs`.

The course labs:

```bash
cd courses/go-basic-en/examples
cat go.mod
# module github.com/mock-exams/go-basic-en-labs
```

## go get — adding dependencies

```bash
go get github.com/stretchr/testify@v1.9.0
go get golang.org/x/text@latest
go get github.com/go-chi/chi/v5@v5.0.12
```

Updates `go.mod` and **go.sum**. Without a version — the latest version compatible under MVS.

| Command | Action |
|---------|----------|
| `go get pkg@version` | add/change the version |
| `go get -u ./...` | update dependencies (use with care in prod) |
| `go get pkg@none` | remove a dependency |

After manual edits — **always**:

```bash
go mod tidy
```

Removes unused requirements, adds missing ones, and syncs the sum file.

## go.sum — checksums

`go.sum` is **not** a lockfile in the full sense — it's cryptographic hashes of **specific** module versions:

```text
github.com/stretchr/testify v1.9.0 h1:... 
github.com/stretchr/testify v1.9.0/go.mod h1:...
```

| Question | Answer |
|--------|--------|
| Commit it to git? | **Yes** |
| Edit it by hand? | **No** |
| `go mod verify` | checks the integrity of the cache |

Typical in CI:

```bash
go mod verify
go mod tidy -diff   # Go 1.22+: fails if tidy would change the files
```

A missing line in `go.sum` after an import is a common beginner mistake following a copy-pasted `import`.

## A minimal lab module

```text
examples/
├── go.mod
├── go.sum          # after the first get/tidy
├── lab/
│   └── 01hello/
│       └── main.go
└── greet/
    └── hello.go
```

`go.mod`:

```go
module github.com/mock-exams/go-basic-en-labs

go 1.22
```

Running it:

```bash
go run ./lab/01hello
go test ./...
```

No dependencies — `go.sum` can be empty or absent until the first external import.

## Versions and MVS (Minimal Version Selection)

Go picks the **minimal** versions that satisfy every `require` in the graph — predictable builds, with less "dependency hell" than in some other ecosystems.

The `go.mod` directive:

```go
require (
    github.com/stretchr/testify v1.9.0
)

require golang.org/x/sys v0.18.0 // indirect
```

`// indirect` — a transitive dependency, not imported directly by your own code.

## replace and local development

```go
replace github.com/acme/lib => ../lib
```

For a fork or a monorepo. **Don't** overuse this in published modules — consumers won't see your `replace` directive.

## go work (overview)

Several modules in one workspace:

```bash
go work init ./shop-api ./shop-cli
```

The `go.work` file is local and usually **not** committed (or is committed in a monorepo). For go-basic, it's enough to know it exists.

## Vendor (briefly)

```bash
go mod vendor
```

Copies dependencies into `vendor/` — for air-gapped CI or reproducibility without a proxy. Use the `-mod=vendor` flag when building. At the basic level — optional.

## A typical developer workflow

```bash
git clone ...
cd service
go mod download    # warm the cache (optional)
go test ./...
# added import "github.com/go-chi/chi/v5"
go mod tidy
git add go.mod go.sum
```

Before an MR:

```bash
go mod verify
go test ./...
```

## Common mistakes

- **Not committing go.sum** — CI breaks for your teammates.
- **Editing go.sum by hand** — corruption; only `go mod tidy` / `go get` should touch it.
- **Module path doesn't match the git remote** — confusion during `go install`.
- **Go version in go.mod is lower** than the features used in code — `go 1.22` vs. generics on an older toolchain.
- **Forgot to tidy** after removing an import — leftover cruft in `require`.
- **`replace`** in a public module without documenting it.

## Checklist

- What does `go mod init` write?
- Why run `go mod tidy`?
- Should `go.sum` be committed?
- How does a direct require differ from a `// indirect` one?
- What does `go mod verify` do?
- What's the module path for the course labs?

Next lesson: [28. Testing](28-testing.md).
