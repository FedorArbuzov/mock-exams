# Go — Basic

**A fast on-ramp into Go:** install, syntax, structs, slices, maps, interfaces, errors, packages, `go test`. No web framework — only what you need to move on to [`go-intermediate`](../golang-path.md) with confidence.

> Path: [`golang-path.md`](../golang-path.md). After this course — **go-intermediate** (Chi/Gin, pgx, shop API).

**Prerequisites:** a terminal ([`linux-basic`](../linux-basic/README.md) 02–03). Experience with any language (Python, JS) helps but is not required.

**Locally:** Go **1.22+**, directory [`examples/`](examples/go.mod).

```bash
cd courses-en/go-basic/examples
go version
go run ./lab/01hello
```

## Course philosophy

`go-basic` is **not** a 40-chapter mini-book and **not** a cheat sheet. It is **~6–8 hours** of practice: read → try in `examples/` → move on to backend Go.

Deep topics (concurrency, httptest, testcontainers, internals) live in [`go-concurrency`](../golang-path.md), [`go-testing`](../golang-path.md), and `go-intermediate`.

## Curriculum (11 lessons)

| # | Lesson | ~time |
|---|--------|-------|
| 00 | [Environment and first run](00-environment.md) | 30 min |
| 01 | [Types, variables, constants](01-types-variables.md) | 40 min |
| 02 | [Structs, slices, maps](02-structs-slices-maps.md) | 50 min |
| 03 | [Functions, pointers, methods](03-functions-pointers-methods.md) | 50 min |
| 04 | [Control flow](04-control-flow.md) | 35 min |
| 05 | [Interfaces and errors](05-interfaces-errors.md) | 50 min |
| 06 | [Packages and go mod](06-packages-modules.md) | 40 min |
| 07 | [Tests and go vet](07-testing-tooling.md) | 40 min |
| 08 | [JSON, files, time](08-json-files-time.md) | 45 min |
| 09 | [Lab: mini-CLI](09-lab-mini-cli.md) | 1.5 h |
| 10 | [What's next](10-next-steps.md) | 20 min |

| — | [Interview cheatsheet](interview-cheatsheet.md) | reference |

## What you should be able to do

After the course you:

- run `go run`, `go test`, `go mod tidy` without directory confusion;
- write **idiomatic** code: `:=`, `if err != nil`, pointer receivers when needed;
- read someone else's Go in `go-intermediate` without tripping over slice/map/interface;
- know **what to learn next** (HTTP, pgx, goroutines) — and don't get stuck in basic.

## Examples

| Path | Purpose |
|------|---------|
| [`examples/go.mod`](examples/go.mod) | lab module |
| [`examples/lab/`](examples/lab/) | exercises |
| [`examples/solutions/`](examples/solutions/) | reference solutions — after your own attempt |
