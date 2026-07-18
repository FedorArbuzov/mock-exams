# 22. Lab: interfaces and io patterns

The goal is to build a **mini data-processing pipeline** using interfaces: your own `Reader`/`Writer`-style types without copying all of `io`, compile-time checks, type assertions. Same patterns as `io.Copy`.

**Time:** ~30–40 minutes after [20-interfaces.md](20-interfaces.md) (~50–70 min for the 20+22 pair).

## Setup

```bash
cd courses/go-basic-en/examples
go version   # 1.22+
```

Create a package `lab/interfaces/` (or `lab/22/`). Module: `github.com/mock-exams/go-basic-en-labs` ([`examples/go.mod`](examples/go.mod)).

Reference solution — `solutions/lab/interfaces/` (check it only after your own attempt).

---

## Architecture

```text
lab/interfaces/
├── doc.go          # package comment (optional)
├── source.go       # StringSource — a "reader" of lines
├── transform.go    # Uppercase — a transformation
├── sink.go         # ConsoleSink — a "writer"
├── pipeline.go     # Run(Source, ...Transform, Sink)
└── main.go         # a demo in cmd, or a separate lab/22main
```

Run it: `go run ./lab/interfaces` (or the path to your `main`).

---

## Task 1. The `Source` contract

```go
// lab/interfaces/source.go
package interfaces

type Source interface {
    Next() (string, bool) // a line, false = end
}
```

Implement `StringSource` from a slice of strings:

```go
type StringSource struct {
    lines []string
    idx   int
}

func NewStringSource(lines ...string) *StringSource { /* TODO */ }
func (s *StringSource) Next() (string, bool) { /* TODO */ }
```

**Check** in `main`:

```go
src := NewStringSource("go", "basic", "lab")
for {
    line, ok := src.Next()
    if !ok {
        break
    }
    fmt.Println(line)
}
```

Add a compile-time assert:

```go
var _ Source = (*StringSource)(nil)
```

---

## Task 2. `Sink` and `ConsoleSink`

```go
type Sink interface {
    Write(line string) error
}

type ConsoleSink struct {
    prefix string
}

func (c *ConsoleSink) Write(line string) error {
    fmt.Printf("%s%s\n", c.prefix, line)
    return nil
}
```

---

## Task 3. `Transform` — a chain

```go
type Transform interface {
    Process(string) string
}

type Uppercase struct{}

func (Uppercase) Process(s string) string {
    return strings.ToUpper(s)
}

type Trim struct{}

func (Trim) Process(s string) string {
    return strings.TrimSpace(s)
}
```

---

## Task 4. `Run` — the pipeline

```go
func Run(src Source, transforms []Transform, sink Sink) error {
    for {
        line, ok := src.Next()
        if !ok {
            return nil
        }
        for _, t := range transforms {
            line = t.Process(line)
        }
        if err := sink.Write(line); err != nil {
            return fmt.Errorf("sink: %w", err)
        }
    }
}
```

**Demo:**

```go
err := Run(
    NewStringSource("  hello ", "  world  "),
    []Transform{Trim{}, Uppercase{}},
    &ConsoleSink{prefix: "> "},
)
```

Expected output:

```text
> HELLO
> WORLD
```

---

## Task 5. Type assertion — `PrefixSink`

Implement `FlexibleSink`, which accepts `any` and uses a type switch:

```go
func DescribeSink(s any) string {
    switch v := s.(type) {
    case *ConsoleSink:
        return "console prefix=" + v.prefix
    case Sink:
        return "generic sink"
    default:
        return fmt.Sprintf("unknown %T", v)
    }
}
```

---

## Success criteria

| Check | Expectation |
|----------|----------|
| `go build ./lab/interfaces/...` | no errors |
| The Trim+Upper pipeline | two uppercase lines |
| `var _ Source = (*StringSource)(nil)` | compiles |
| `DescribeSink(&ConsoleSink{})` | a string containing `console` |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|---------|---------|
| `*StringSource does not implement Source` | value vs pointer receiver | put the method on `*StringSource` |
| Empty output | `Next` returns `false` immediately | check `idx` |
| import cycle | `main` in the same package | move `main` into `cmd/22` |
| panic in the type switch | the wrong default branch | use `, ok` where needed |

Next lesson (theory): [23. defer, panic, recover](23-defer-panic-recover.md).
