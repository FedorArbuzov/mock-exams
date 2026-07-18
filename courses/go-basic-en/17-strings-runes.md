# 17. Strings, runes, and the `strings` package

## What you'll learn

- A string as an **immutable UTF-8** byte sequence.
- **`len`**, indexing, **string slicing**, and the risks around rune boundaries.
- **`rune`** and iterating with `for i, r := range s`.
- The **`strings`** package, and briefly **`unicode/utf8`**.
- Common internationalization and truncation bugs.

## The string: type `string`

```go
s := "Привет"
fmt.Println(len(s)) // 12 bytes, not 6 "letters"
```

**Immutable:** you can't write `s[0] = 'X'` — compile error. "Changing" a string means creating a new one:

```go
s = "П" + s[1:] // careful: this slices by bytes!
```

**Zero value** is `""`, not `nil`. Comparison with `==`, `<` is lexicographic by **bytes** (fine for UTF-8 text in a single language; for full Unicode collation, use `golang.org/x/text/collate`).

### String literals

```go
plain := "line\n"
raw := `C:\path\to\file` // raw string — no escapes except backtick
```

## Bytes vs runes

| Concept | Go type | Example |
|-----------|--------|--------|
| Byte | `byte` (`uint8`) | `s[0]` |
| Rune (code point) | `rune` (`int32`) | `'A'`, `'Ж'`, `'🙂'` |
| String | `string` | UTF-8 bytes |

```go
import "unicode/utf8"

s := "Go🙂"
fmt.Println(len(s))                    // 6 bytes
fmt.Println(utf8.RuneCountInString(s)) // 3 runes: G, o, 🙂
```

**Why UTF-8:** compatibility with ASCII, memory savings for Latin text; the cost is a variable number of bytes per character.

## `range` over a string

```go
for i, r := range "Año" {
	fmt.Printf("index=%d rune=%q\n", i, r)
}
```

`i` is the **byte** index where the rune starts in the string, not a "character number." After `ñ` (2 bytes), the index jumps.

**Idiom:** iterate over runes without tracking byte indices:

```go
for _, r := range s {
	if r == '€' {
		// ...
	}
}
```

### Converting string ↔ []rune ↔ []byte

```go
runes := []rune("Привет")
s2 := string(runes)

bytes := []byte("ASCII")
s3 := string(bytes)
```

`[]rune(s)` decodes UTF-8 into a slice of code points. `string(runes)` encodes it back.

## String slicing

```go
s := "hello"
fmt.Println(s[1:4]) // "ell"
```

Slicing a string produces a **new string** that shares the backing array (like a slice).

**DANGEROUS for Unicode:**

```go
name := "Василий"
bad := name[:3] // cuts through the middle of a UTF-8 rune — invalid UTF-8 in the substring
```

Safe truncation by **rune count**:

```go
func truncateRunes(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max])
}
```

For production UI, also use `unicode/utf8.ValidString` and NFC normalization.

## The `strings` package

Import: `import "strings"`.

### Searching and checking

```go
strings.Contains("hello", "ell")   // true
strings.HasPrefix("hello", "he")   // true
strings.HasSuffix("hello", "lo")   // true
strings.Index("hello", "l")        // 2 (byte index)
strings.Count("banana", "a")       // 3
```

### Modification (return a new string)

```go
strings.ToUpper("Привет")
strings.ToLower("Привет")
strings.TrimSpace("  x  ")
strings.Trim("///path///", "/")
strings.Replace("foo foo", "foo", "bar", 1) // one replacement
strings.ReplaceAll("foo foo", "foo", "bar")
```

### Splitting and joining

```go
parts := strings.Split("a,b,c", ",")     // []string{"a","b","c"}
strings.SplitN("a:b:c", ":", 2)          // ["a", "b:c"]
joined := strings.Join(parts, "-")       // "a-b-c"
```

`strings.Split` returns a slice.

### Builder for concatenation in a loop

```go
var b strings.Builder
for _, w := range words {
	b.WriteString(w)
	b.WriteByte(' ')
}
result := b.String()
```

**Why not `s += w` in a loop:** each concatenation allocates a new string — O(n²). `Builder` is amortized linear.

```go
b.Grow(estimatedSize) // optional
```

## `strings` vs `fmt`

| Task | Tool |
|--------|------------|
| Joining known fields | `fmt.Sprintf("%s: %d", sku, price)` |
| Many parts in a loop | `strings.Builder` |
| Simple concatenation of 2–3 | `a + b` |

## `byte` and `strings` in IO (preview)

Reading files and HTTP bodies is often `[]byte` → `string(data)`, which copies or uses unsafe in optimized code. For JSON fields — struct tags.

## Common mistakes

| Mistake | Root cause | Fix |
|--------|------------------|-------------|
| `s[i]` treated as a "character" | it's a byte | `range` or `[]rune` |
| `name[:30]` for a UI limit | cuts UTF-8 | truncate by runes |
| `len` for a character limit | it's bytes | `utf8.RuneCountInString` |
| `+=` in a loop | quadratic allocation | `strings.Builder` |
| Comparing a string with `[]byte` without conversion | different types | `string(b)` or `bytes.Equal` |
| Using `strings.Index` as a rune index | bytes | `utf8.DecodeRuneInString` |

## In production

- Length limits in APIs — in **runes** or graphemes (libraries), not bytes.
- Logs and metrics: don't rely on `len` for "visible length."
- Unicode normalization before comparing passwords/nicknames — a security checklist item.

## Summary

**String** is immutable UTF-8 bytes; **`len`** and **`s[i]`** work in bytes. **`rune`** is a code point; **`for range`** over a string gives `(byteIndex, rune)`. The **`strings`** package covers Contains, Split, Join, Replace, Builder. String slices cut by bytes — dangerous for non-ASCII. There's no implicit concatenation with numbers — only explicit conversions.

## Checklist

- What does `len("🙂")` equal in Go, and why?
- What does `for i, r := range s` return for `i`?
- How do you safely truncate a string to 10 "characters"?
- Why use `strings.Builder` instead of `+=` in a loop?
- How does `byte` differ from `rune`?
- Why doesn't `strings.Index` always give a valid UI cursor position?

Next lesson: [18. Lab: control flow](18-lab-control-flow.md).
