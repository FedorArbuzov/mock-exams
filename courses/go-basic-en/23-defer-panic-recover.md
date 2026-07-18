# 23. defer, panic, recover

## defer — a deferred call

`defer` registers a function call to run on **exit** from the current function (a normal return, an error return, or a panic):

```go
func copyFile(dst, src string) error {
    in, err := os.Open(src)
    if err != nil {
        return err
    }
    defer in.Close()

    out, err := os.Create(dst)
    if err != nil {
        return err
    }
    defer out.Close()

    _, err = io.Copy(out, in)
    return err
}
```

Even with `return err` after `Copy` — **both** `Close` calls run.

### LIFO order (a stack)

Multiple `defer` calls run **in reverse order** of registration — like a stack:

```go
func demo() {
    defer fmt.Println("1")
    defer fmt.Println("2")
    defer fmt.Println("3")
}
// output: 3, 2, 1
```

An analogy: nested `finally` blocks, or "close in the reverse order you opened" — lock mutex B second, unlock it first.

```go
muA.Lock()
defer muA.Unlock()
muB.Lock()
defer muB.Unlock()
// unlock B, then A
```

### defer arguments are evaluated immediately

```go
func trap() {
    i := 0
    defer fmt.Println(i) // prints 0 — i was captured by value at the time of defer
    i++
}
```

For the **current** value at call time, use a closure:

```go
defer func() { fmt.Println(i) }()
```

Or a named result:

```go
func sum() (total int) {
    defer func() { fmt.Println("total", total) }()
    total = 1 + 2
    return total
}
```

### defer in a loop — be careful

```go
// bad — all Close calls happen at the end of the function, N open files at once
func processAll(paths []string) error {
    for _, p := range paths {
        f, err := os.Open(p)
        if err != nil {
            return err
        }
        defer f.Close()
        // processing...
    }
    return nil
}
```

**Fix:** move the body into a separate function:

```go
func processOne(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close()
    // ...
    return nil
}

func processAll(paths []string) error {
    for _, p := range paths {
        if err := processOne(p); err != nil {
            return err
        }
    }
    return nil
}
```

## defer + named return values

```go
func divide(a, b int) (result int, err error) {
    defer func() {
        if err != nil {
            log.Println("divide failed:", err)
        }
    }()
    if b == 0 {
        err = errors.New("division by zero")
        return
    }
    result = a / b
    return
}
```

`defer` sees the **named** `err`/`result` after assignment but before the actual return — handy for tracing and metrics.

**Modifying a named return inside defer** is an uncommon technique (for example, `recover` below); don't overuse it.

## panic — abnormal termination

`panic(v any)` unwinds the stack, running **deferred** calls along the way, until it hits a `recover` or kills the program:

```go
func mustParse(s string) int {
    n, err := strconv.Atoi(s)
    if err != nil {
        panic(fmt.Sprintf("mustParse: %q", s))
    }
    return n
}
```

| panic is appropriate | Not appropriate |
|---------------|------------|
| `init()` can't proceed without config | HTTP 400 bad input |
| `template.Must` on a parse failure | a file read error |
| a bug: an invariant was violated | an expected `not found` |

An unhandled panic → **crashes the process** (unless something recovers at the top level).

## recover — only inside defer

```go
func safeCall(fn func()) (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("panic recovered: %v", r)
        }
    }()
    fn()
    return nil
}
```

**Rules:**

1. `recover()` **only makes sense** inside a deferred function.
2. Outside a panic, `recover()` returns `nil`.
3. After recovery, execution continues **after** the deferred call, not from where the panic happened.

```go
func handler(w http.ResponseWriter, r *http.Request) {
    defer func() {
        if rec := recover(); rec != nil {
            slog.Error("panic", "recover", rec)
            http.Error(w, "internal server error", http.StatusInternalServerError)
        }
    }()
    dangerous(r)
}
```

The pattern is **one** recover per HTTP handler, not one in every function.

### panic(nil)

`panic(nil)` behaves specially starting in Go 1.21+ — avoid it; use `errors.New`.

## defer, panic, and errors — how to combine them

The style this course prefers:

```go
func work() (err error) {
    f, err := os.Create("out.txt")
    if err != nil {
        return err
    }
    defer func() {
        closeErr := f.Close()
        if err == nil && closeErr != nil {
            err = closeErr
        }
    }()

  // ... write ...
    return nil
}
```

On a write error, return it; on success, don't lose the `Close` error (it matters on some filesystems).

**Don't** mix `panic` and `error` in the same layer without a team policy.

Go **has no** global catch — an unhandled panic kills the goroutine/process.

## sync and defer (a preview)

```go
var mu sync.Mutex
mu.Lock()
defer mu.Unlock()
```

At the basic level, it's enough to know: **always** `defer Unlock` right after `Lock`.

## Common mistakes

- **defer in a tight loop** without a separate function — FD leaks, memory growth.
- **Forgetting defer Close** after `Open` — a classic production incident.
- **panic on user input** — a DoS against your own API.
- **recover without logging** — "swallowing" a bug with the state left unknown.
- **recover not inside defer** — doesn't work.
- **Assuming defer fires at the end of an `if` block** — it only fires on exit from the **function**.

## Checklist

- In what order do three consecutive `defer` calls run?
- When are the arguments of `defer fmt.Println(x)` evaluated?
- Why is `defer f.Close()` in a `for` loop dangerous?
- Where is `recover` allowed?
- Why is `panic` in a handler worse than `return err`?
- How does defer help when returning `err` from a function with an open file?

Next lesson: [24. Lab: errors](24-lab-errors.md). Error theory: [21-errors.md](21-errors.md), [25-errors-is-as.md](25-errors-is-as.md).
