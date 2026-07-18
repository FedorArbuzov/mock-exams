# 20. Interfaces: implicit implementation

## What is an interface in Go

An **interface** is a named set of **method signatures**. A type **implicitly** satisfies an interface if it implements all of its methods. The compiler checks this **at the point of use**, not at the type's declaration.

```go
type Stringer interface {
    String() string
}

type Product struct {
    Name  string
    Price float64
}

func (p Product) String() string {
    return fmt.Sprintf("%s — %.2f", p.Name, p.Price)
}

func describe(s Stringer) {
    fmt.Println(s.String())
}

func main() {
    p := Product{Name: "Go in Action", Price: 39.99}
    describe(p) // OK: Product has String() string
}
```

**Go's design rule:** "Accept interfaces, return concrete types" — a function depends on the **minimal** contract it needs, not on a specific struct.

## Implicit satisfaction

The declaration `type Product struct` **contains no list** of interfaces. The compiler checks the match when you pass `Product` somewhere that expects a `Stringer`:

```go
var _ Stringer = Product{} // compile-time assert: Product implements Stringer
```

The line `var _ Stringer = Product{}` is the **compile-time check** idiom: if you remove the `String` method, the build fails immediately, not at runtime.

Several interfaces, one type:

```go
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Closer interface {
    Close() error
}

type ReadCloser interface {
    Reader
    Closer
}
```

`ReadCloser` **embeds** other interfaces — composition of contracts, not inheritance of implementation.

### Pointer vs value receiver

A method with a **value receiver** is available on both a value and a pointer (Go automatically takes the address if needed). A method defined only with a **pointer receiver** means the interface is satisfied only by **`*T`**, not by `T`:

```go
type Counter struct{ n int }

func (c *Counter) Inc() { c.n++ }

type Incrementer interface {
    Inc()
}

func main() {
    var inc Incrementer
    c := Counter{}
    // inc = c       // compile error: Counter does not implement Incrementer
    inc = &c          // OK
    inc.Inc()
}
```

A common code-review mistake: forgetting the `*` on the receiver, so the interface "doesn't work."

## The empty interface: `interface{}` and `any`

The empty interface **requires no methods**. Any type satisfies it. Since Go 1.18 the alias `any` = `interface{}`:

```go
func debugPrint(v any) {
    fmt.Printf("%T = %v\n", v, v)
}

debugPrint(42)
debugPrint("hello")
debugPrint(Product{Name: "Book"})
```

| When to use `any` | When to avoid it |
|--------------------------|----------------|
| `json.Unmarshal`, generic debugging | A public API in business logic |
| A quick prototype | A hot path without a type switch |
| `fmt.Println` variadic args | In place of a proper interface |

**Anti-pattern:** `func Save(data any)` in the domain layer — you lose type safety. `SaveOrder(o Order)` or a narrow `Saver` interface is better.

## Type assertion and type switch

When a value is stored as an interface, a **type assertion** extracts the **concrete type**:

```go
var i any = Product{Name: "Tea", Price: 3.5}

p, ok := i.(Product)
if ok {
    fmt.Println(p.Price)
}

// without ok — panics on a mismatched type
p2 := i.(Product)
```

A **type switch** branches on the dynamic type:

```go
func format(v any) string {
    switch x := v.(type) {
    case string:
        return x
    case int:
        return strconv.Itoa(x)
    case Stringer:
        return x.String()
    default:
        return fmt.Sprintf("%v", x)
    }
}
```

In `switch x := v.(type)`, the variable `x` has the **concrete type** in each branch — more convenient than repeating the assertion.

### The two-value form is mandatory in production

```go
w, ok := r.(io.Writer)
if !ok {
    return fmt.Errorf("expected io.Writer, got %T", r)
}
```

The single-value `r.(io.Writer)` without `ok` **panics** on a mismatch. In HTTP handlers and parsers you almost always need the safe form.

## The nil interface: the main trap

In Go, an interface is **two fields**: (1) a dynamic **type**, (2) a dynamic **value**. A `nil` interface has **both** fields nil. **But:**

```go
func returnsError() error {
    var p *os.PathError = nil
    return p // returns a non-nil error!
}

func main() {
    err := returnsError()
    fmt.Println(err == nil) // false — type is *os.PathError, value is nil
    if err != nil {
        fmt.Println("we got here even though there's 'logically' no error")
    }
}
```

| Situation | `err == nil` | Why |
|----------|--------------|--------|
| `var err error` | `true` | both type and value are nil |
| `return nil` from `func() error` | `true` | an explicit nil interface |
| `var p *T = nil; return p` as `error` | `false` | the type `*T` is already non-nil |

**Rule:** from a function returning `error`, return **either** `nil` **or** a concrete non-nil error — never a "typed nil pointer" as `error`.

The same trap applies to any interface:

```go
type Worker interface { Work() }

func getWorker() Worker {
    var w *MyWorker = nil
    return w // Worker != nil
}
```

Fix: `if w == nil { return nil }; return w`.

## Interfaces in the standard library

The standard library is a catalog of **small** interfaces:

| Interface | Method(s) | Example implementation |
|-----------|----------|-------------------|
| `io.Reader` | `Read([]byte) (int, error)` | `os.File`, `bytes.Buffer`, `strings.Reader` |
| `io.Writer` | `Write([]byte) (int, error)` | `os.Stdout`, `bytes.Buffer` |
| `fmt.Stringer` | `String() string` | any type with that method |
| `error` | `Error() string` | any type with that method |

The **accept interfaces, return structs** pattern in action:

```go
func copyAll(dst io.Writer, src io.Reader) (int64, error) {
    return io.Copy(dst, src)
}
```

`copyAll` knows nothing about `*os.File` — only about reading and writing bytes.

## Interface segregation in practice

Split up **fat** contracts:

```go
// bad — forces implementing extra methods
type Storage interface {
    Get(id int) (Item, error)
    Save(Item) error
    Delete(id int) error
    List() ([]Item, error)
    Ping() error
}

// better — narrow roles
type Getter interface {
    Get(id int) (Item, error)
}

type Saver interface {
    Save(Item) error
}
```

The function `LoadAndDisplay(g Getter, id int)` can be tested with a **fake** that implements a single method — no full database needed.

## Common mistakes

- **A giant interface** with 15 methods — hard to mock and hard to implement.
- **Forgetting a pointer receiver** — the type doesn't satisfy the interface.
- **Returning a typed nil** from `func() error` — `if err != nil` fires "falsely."
- **Type assertion without `ok`** on user input — a panic in production.
- **`any` everywhere** instead of domain types — losing the compiler's help.
- **Checking `implements` at runtime** where a compile-time `var _ I = T{}` would do.

## Checklist

- How does **implicit** implementation differ from `implements` in Java?
- Why can `*Counter`, but not `Counter`, satisfy an interface with `Inc()`?
- What does an interface value store internally (two fields)?
- When is `err == nil` false even though there's "no error"?
- Why use `v, ok := x.(T)` instead of `v := x.(T)`?
- Name three interfaces from `io` and explain why they're kept separate.

Next lesson: [21. Errors: error, fmt.Errorf, %w](21-errors.md). Practice: [22. Lab: interfaces](22-lab-interfaces.md).
