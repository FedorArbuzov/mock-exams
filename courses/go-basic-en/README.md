# Go — Basic

A **basic Go** course without web frameworks: installation, modules, types, structs, slices, maps, pointers, methods, interfaces, errors, `defer`/`panic`, packages, `go test`, `go vet`, linters. **38 lessons** (00–37) + interview cheatsheet.

**Locally:** Go **1.22+** on the host. Lab code lives in the [`examples/`](examples/go.mod) directory.

```bash
cd courses/go-basic-en/examples
go version          # go1.22.x or newer
go run ./lab/01hello
```

Optional: [goenv](https://github.com/go-nv/goenv) or the official installer from [go.dev/dl](https://go.dev/dl/) for switching versions.

## How to read the chapters

Each lesson is a **full textbook chapter**, not a cheat sheet. Read them in order: explanation → examples → "Common mistakes" → "Checklist".

1. **Theory** — explanation → code → "Common mistakes" → "Checklist".
2. **Lab** — hands-on in [`examples/`](examples/go.mod): `go run ./lab/…`, success criteria, a troubleshooting table.
3. After block 35 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **without peeking** at the chapters.
4. [37-capstone.md](37-capstone.md) — **4–6 hours**, a "Task Tracker" CLI in Go; pulls together structs, errors, JSON, and tests from chapters 20–35.

**Time:** **~50–70 minutes** per "theory + lab" pair. The whole course is **~14–18 hours**; the capstone is separate.

## Curriculum (38 lessons)

### Phase 1. Environment and first programs (00–03)

| # | Lesson |
|---|------|
| 00 | [Environment: Go toolchain, editor, gopls](00-environment.md) |
| 01 | [Landscape: compilation, GOPATH vs modules, ecosystem](01-landscape.md) |
| 02 | [Variables, zero values, short declaration](02-variables-zero-values.md) |
| 03 | [Lab: first programs](03-lab-first-programs.md) |

### Phase 2. Types and data structures (04–09)

| 04 | [Basic types: numbers, strings, bool, rune, byte](04-basic-types.md) |
| 05 | [Constants and iota](05-constants-iota.md) |
| 06 | [Lab: types and constants](06-lab-types.md) |
| 07 | [Structs: fields, tags, nesting](07-structs.md) |
| 08 | [Arrays and slices](08-slices-arrays.md) |
| 09 | [Lab: structs and slices](09-lab-structs-slices.md) |

### Phase 3. Pointers, maps, functions (10–15)

| 10 | [Functions: parameters, return values, variadic](10-functions.md) |
| 11 | [Pointers and passing by value](11-pointers.md) |
| 12 | [Maps](12-maps.md) |
| 13 | [Lab: pointers and maps](13-lab-pointers-maps.md) |
| 14 | [Methods and receivers](14-methods.md) |
| 15 | [Lab: methods](15-lab-methods.md) |

### Phase 4. Control flow (16–19)

| 16 | [if, for, switch](16-control-flow.md) |
| 17 | [Strings, runes, the strings/unicode packages](17-strings-runes.md) |
| 18 | [Lab: control flow](18-lab-control-flow.md) |
| 19 | [Type conversions](19-type-conversions.md) |

### Phase 5. Interfaces and errors (20–25)

| 20 | [Interfaces: implicit implementation](20-interfaces.md) |
| 21 | [Errors: error, fmt.Errorf, %w](21-errors.md) |
| 22 | [Lab: interfaces](22-lab-interfaces.md) |
| 23 | [defer, panic, recover](23-defer-panic-recover.md) |
| 24 | [Lab: errors](24-lab-errors.md) |
| 25 | [errors.Is, errors.As, wrapping](25-errors-is-as.md) |

### Phase 6. Packages and modules (26–27)

| 26 | [Packages, visibility, layout](26-packages.md) |
| 27 | [go mod, dependencies, go work (overview)](27-modules.md) |

### Phase 7. Tests and tooling (28–31)

| 28 | [go test, table-driven tests](28-testing.md) |
| 29 | [Lab: testing](29-lab-testing.md) |
| 30 | [go vet, staticcheck, golangci-lint](30-tooling.md) |
| 31 | [Lab: linters and vet](31-lab-tooling.md) |

### Phase 8. JSON, time, files (32–35)

| 32 | [encoding/json](32-json.md) |
| 33 | [The time package](33-time.md) |
| 34 | [Files: os, io, bufio](34-files-io.md) |
| 35 | [Lab: JSON and files](35-lab-json-files.md) |

### Phase 9. Finale (36–37)

| 36 | [Interview Q&A (top 30)](36-interview-qa.md) |
| 37 | [Capstone: Task Tracker CLI](37-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you'll be able to do

- Write **idiomatic** Go: short declaration `:=`, explicit errors, `defer` for cleanup.
- Explain **zero values**, the difference between slice and array, and when you need a pointer.
- Build **structs** with methods and **interfaces** with no "implements" keyword in the syntax.
- Handle errors via **`if err != nil`**, `%w`, `errors.Is`/`As`.
- Split code into **packages** and **modules** (`go mod init`, `go get`).
- Write **table-driven tests** and run **`go test -race`**.
- Use **go vet** and **golangci-lint** before merging in CI.

## Examples

| Path | Purpose |
|------|------------|
| [`examples/go.mod`](examples/go.mod) | the course lab module |
| [`examples/lab/`](examples/lab/) | starter `main.go` files for the labs |
| [`examples/solutions/`](examples/solutions/) | reference solutions (open only after your own attempt) |
