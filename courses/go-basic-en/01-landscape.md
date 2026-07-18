# 01. Landscape: compilation and the Go ecosystem

## What you'll learn

- A brief **history of Go** and the language's design goals.
- The chain: `.go` source → **compiler** → binary → **runtime** (GC, scheduler).
- What it means for a language to be **compiled** in practice.
- What the **garbage collector** does and why Go has no `free()`.
- An overview of **goroutines** (no deep dive — they get full treatment in a dedicated concurrency course).

## History and design of Go

**Go** (Golang) is an open-source language announced by Google in **2009**, with a stable **1.0** release in 2012. Its authors — Rob Pike, Ken Thompson, Robert Griesemer — wanted a language for **infrastructure** code: builds that take seconds, readable syntax, and concurrency built in.

| Goal | How it shows up in the language |
|------|-------------------------|
| Fast builds | A small compiler, caching in `go build` |
| Simple syntax | Few keywords, no class inheritance |
| Explicit error handling | `if err != nil`, not exceptions by default |
| Concurrency | goroutines + channels in the standard library |
| Static typing | Type errors caught at compile time |

## From source to execution

```text
Source code (.go files, packages)
        │
        ▼
   go build / go run
        │
        ▼
   gc compiler (machine code or archive)
        │
        ▼
   Executable + Go runtime
        │
        ├── GC (garbage collection)
        ├── Scheduler (GMP: goroutines on OS threads)
        └── Standard library (net, fmt, …)
```

```go
package main

import "fmt"

func main() {
	fmt.Println("Compiled once, runs anywhere (same OS/arch)")
}
```

`go run` compiles to a temporary binary and runs it immediately. `go build -o app ./cmd/app` produces an artifact ready to deploy.

## A compiled language

A program is compiled to machine code **before** it runs — the target machine doesn't need an interpreter:

```bash
go build -o reindex ./cmd/reindex
./reindex    # no Go interpreter needed on the target machine
```

Practical consequences:

- a predictable binary with a fast cold start;
- type errors are caught **before** deployment, not as a runtime surprise;
- cross-compiling: `GOOS=linux GOARCH=amd64 go build` from any machine.

The downside is there's no built-in REPL-level interactive console; in practice, short `go run` one-file snippets fill that role instead ([03-lab-first-programs.md](03-lab-first-programs.md)).

## Static typing

The compiler knows a variable's type:

```go
var price float64 = 79.99
// price = "free"  // compile error: cannot use "free" (untyped string) as float64
```

A type mismatch is a **compile-time error**, not a surprise in production.

## Garbage collector (GC)

In Go, memory allocated via `new`, `make`, or literals lives on the **heap**; the **GC** reclaims objects that are no longer reachable. You never call `free`, and you don't do manual reference counting.

```go
func buildCart() []string {
	items := make([]string, 0, 10) // slice on the heap
	items = append(items, "keyboard")
	return items // GC will reclaim it later once nothing references it
}
```

Practical consequences:

- no `malloc`/`free` pairing to manage;
- latency spikes from GC pauses — a profiling topic for a more advanced level;
- **don't** reach for pointers "for speed" without measuring first ([11-pointers.md](11-pointers.md)).

## Goroutines: a preview

A **goroutine** is a lightweight thread of execution, started with the `go` keyword:

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	go func() {
		fmt.Println("from goroutine")
	}()
	fmt.Println("from main")
	time.Sleep(100 * time.Millisecond) // a hack for this demo; sync/channels come later
}
```

The order of these lines is **not guaranteed** without synchronization. In this course, goroutines are only **introduced by name** — building production concurrency patterns is the subject of a dedicated advanced course.

## Tooling ecosystem (overview)

| Tool | Purpose | Lesson |
|------------|------------|------------|
| `go fmt` | formatting | 00, 30 |
| `go vet` | suspicious constructs | 30 |
| `go test` | tests, `-race` | 28–29 |
| `staticcheck`, `golangci-lint` | linters | 30–31 |
| `go mod` | dependencies | 27 |

Go's standard library is rich: HTTP, JSON, crypto — database drivers are pulled in as separate modules.

## Common mistakes

**"Go is interpreted."** `go run` still compiles; it just doesn't leave a binary behind by default.

**Expecting OOP with classes and inheritance.** Go uses **structs** and **composition** ([07-structs.md](07-structs.md)), not a class hierarchy.

**Comparing a goroutine to an OS thread 1:1.** Goroutines are cheaper; thousands of goroutines are normal, thousands of OS threads are not.

**Ignoring `if err != nil` "while I'm still learning."** Error handling is an idiom from day one ([21-errors.md](21-errors.md)), not something to "handle in production later."

**Confusing the `go` keyword with `go mod`.** `go func()` starts a goroutine; `go get` manages dependency modules.

## Summary

Go is a **statically typed, compiled** language with a **GC** and built-in **concurrency** (goroutines). Source turns into a binary with a runtime attached; deployment is simpler than with interpreted stacks. Next up: variables and zero values, where static typing shows up in every line.

## Checklist

- [ ] You can explain the chain `.go` → compiler → binary
- [ ] You understand the difference between a compiled and an interpreted language
- [ ] You know the GC frees memory without `free`
- [ ] You can describe a goroutine in two sentences

Next lesson: [02. Variables and zero values](02-variables-zero-values.md).
