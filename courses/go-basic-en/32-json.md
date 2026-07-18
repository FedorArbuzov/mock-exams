# 32. encoding/json: Marshal, Unmarshal, struct tags

## What you'll learn

- How `json.Marshal` and `json.Unmarshal` work with structs, slices, and maps.
- The **exported fields** rule, and why `name` won't make it into the JSON.
- Tags: `json:"field_name"`, `omitempty`, `-`, nested structs.
- `json.RawMessage`, `json.Number`, pointers for optional fields.

---

## Basic example: Marshal and Unmarshal

```go
package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
)

type Product struct {
	ID    int     `json:"id"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
}

func main() {
	p := Product{ID: 1, Name: "Keyboard", Price: 79.99}

	data, err := json.Marshal(p)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(string(data))
	// {"id":1,"name":"Keyboard","price":79.99}

	var decoded Product
	if err := json.Unmarshal(data, &decoded); err != nil {
		log.Fatal(err)
	}
	fmt.Printf("%+v\n", decoded)
}
```

| Function | Purpose |
|---------|------------|
| `json.Marshal(v)` | Go value → `[]byte` JSON |
| `json.MarshalIndent(v, prefix, indent)` | indented, for files and logs |
| `json.Unmarshal(data, &v)` | `[]byte` → fills a **pointer** to a value |
| `json.NewEncoder(w).Encode(v)` | writes to an `io.Writer` (HTTP, file) |
| `json.NewDecoder(r).Decode(&v)` | reads from an `io.Reader` |

**Error idiom:** always `if err != nil`.

---

## Exported fields — a strict rule

The `encoding/json` package only sees fields **starting with a capital letter**:

```go
type Bad struct {
	Name  string // in JSON: "Name" (if no tag) — OK
	email string // NEVER serialized or deserialized
}
```

In a public API and DTOs, fields are made exported and given a JSON name via a tag:

```go
type User struct {
	Email string `json:"email"` // JSON key "email", Go field Email
}
```

---

## Struct tags: field name, omitempty, ignoring

A tag is a backtick-quoted string after the field name. The tag parser is `reflect.StructTag`.

```go
type Product struct {
	ID          int      `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description,omitempty"`
	InternalSKU string   `json:"internal_sku"`
	Tags        []string `json:"tags,omitempty"`
	Secret      string   `json:"-"` // excluded from both Marshal and Unmarshal
}
```

### `omitempty`

A field is **skipped** if its value is "empty":

| Type | "Empty" for omitempty |
|-----|-------------------------|
| numbers | `0` |
| string | `""` |
| bool | `false` |
| slice, map, pointer | `nil` |
| struct | never* (a zero struct is not omitempty by default) |

\* For a nested struct with zero fields, behavior depends on the version and nesting; for optional fields, a **pointer** (`*string`, `*time.Time`) is a better choice.

```go
p := Product{ID: 1, Name: "Mouse", Description: ""}
b, _ := json.Marshal(p)
// {"id":1,"name":"Mouse","internal_sku":""}
// description is absent — omitempty
```

**Interview note:** `omitempty` doesn't mean "not provided in the request" during Unmarshal — a missing key simply leaves the Go field untouched (it stays at its zero value).

### Renaming and snake_case

```go
InternalSKU string `json:"internal_sku"`
```

Without the tag, Go would emit `"InternalSKU"` — which wouldn't match the expected field name on the other side.

### Ignoring a field: `json:"-"`

Passwords, internal flags, derived fields — don't send these to the client.

---

## Unmarshal: a pointer is required

```go
var p Product
err := json.Unmarshal(data, &p) // &p — address of the struct
```

Passing `p` without `&` is either a compile error or writing into a throwaway copy. For updating something nested:

```go
type Order struct {
	Items []Product `json:"items"`
}
```

`Unmarshal` **replaces** the slice entirely; it doesn't append to existing elements (unless it's a nil pointer to a slice — see the docs: `*[]T` can append).

---

## MarshalIndent for files and logs

```go
data, err := json.MarshalIndent(products, "", "  ")
if err != nil {
	return err
}
// [
//   {
//     "id": 1,
//     "name": "Keyboard"
//   }
// ]
```

This format is convenient for saving to a file — readable in a Git diff.

---

## Nested structs and anonymous embedding

```go
type Timestamps struct {
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at,omitempty"`
}

type Product struct {
	ID int `json:"id"`
	Timestamps
	Name string `json:"name"`
}
```

Embedded fields are **promoted** to the top level of the JSON (if there's no name conflict):

```json
{"id":1,"created_at":"2024-06-18T10:00:00Z","name":"Keyboard"}
```

---

## map[string]any and dynamic JSON

When the schema isn't known (a proxy, debugging):

```go
var raw map[string]any
if err := json.Unmarshal(data, &raw); err != nil {
	return err
}
name, _ := raw["name"].(string) // type assertion — can panic without ok
```

| Approach | When |
|--------|------|
| Typed struct | a stable API contract, the shop model |
| `map[string]any` | one-off parsing, migration |
| `json.RawMessage` | deferred parsing of part of the document |

```go
type Envelope struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}
```

---

## Pointers and optional fields

To distinguish "not provided" from "provided as empty" in **responses**, a pointer is sometimes used:

```go
type Product struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}
```

- `Description == nil` → the key is absent (with omitempty).
- `Description` points to `""` → `"description":""` in the JSON.

For incoming APIs, such fields are more often validated explicitly; here it's enough to understand the pattern.

---

## Custom MarshalJSON / UnmarshalJSON

A type implements the interfaces:

```go
type Money int // cents

func (m Money) MarshalJSON() ([]byte, error) {
	return json.Marshal(float64(m) / 100)
}
```

Use this rarely — reach for struct tags first. It's needed for a non-standard format (money, an enum represented as a string).

---

## Encoder / Decoder vs Marshal

For **streams** (a large file, an HTTP body):

```go
enc := json.NewEncoder(os.Stdout)
enc.SetIndent("", "  ")
if err := enc.Encode(products); err != nil {
	return err
}
```

`Encode` adds a newline after the value. For files, `MarshalIndent` + `os.WriteFile` is often simpler.

---

## Common mistakes

1. **Forgetting `&` in Unmarshal** — one of the first mistakes a beginner makes.

2. **Name mismatch** — `json:"product_id"` in Go, but the API sends `productId`. Fix: an explicit tag with the exact field name.

3. **`omitempty` on a bool** — `false` disappears from the JSON; the client can't tell "false" from "not set."

4. **Unmarshal into interface{}** — numbers become `float64`, not `int`. For JSON from an API, use a struct.

5. **Circular references in a map/struct** — `Marshal` returns an `unsupported value` error.

6. **Unescaped HTML in JSON** — `json.Marshal` escapes it; you can't safely concatenate a JSON string by hand (injection, malformed output).

7. **A large `[]byte` held in memory** — for huge files, use `Decoder` piece by piece; for a shop catalog at the basic level, `ReadFile` + `Unmarshal` is enough.

8. **Unknown fields in JSON** — by default `Unmarshal` **silently ignores** extra keys. For a strict contract:

```go
dec := json.NewDecoder(bytes.NewReader(data))
dec.DisallowUnknownFields()
if err := dec.Decode(&catalog); err != nil {
	return fmt.Errorf("strict decode: %w", err)
}
```

9. **Wrong type in JSON** — `Unmarshal` returns a `*json.UnmarshalTypeError` with the fields `Field`, `Value`, `Type`:

```go
var p Product
err := json.Unmarshal([]byte(`{"id":"not-a-number"}`), &p)
var typeErr *json.UnmarshalTypeError
if errors.As(err, &typeErr) {
	fmt.Println(typeErr.Field) // id
}
```

---

## In production

- **Contract first:** field names are agreed with OpenAPI / the client before the handler is written.
- **Don't log secrets** — the `json:"-"` tag, and don't put them into structs used for logging.
- **Versioning:** a `schema_version` field in the persistence file simplifies migrations.
- **Tests:** a golden file `testdata/products.json` + `json.Unmarshal` in a table-driven test.

---

## Summary

`encoding/json` links Go types to the wire format. Exported fields plus `json` tags are the main tool. `Marshal`/`Unmarshal` are always checked with `err`. `omitempty` removes zero values from the output, but doesn't replace a well-thought-out model of optional fields.

---

## Checklist

- [ ] I can explain why the `sku` field didn't make it into the JSON
- [ ] I know the difference between `json:"x"` and `json:"x,omitempty"`
- [ ] I write `Unmarshal(data, &v)` with a pointer
- [ ] I pick a struct for a contract, and `map[string]any` only for one-off parsing
- [ ] I remember: numbers in `interface{}` after Unmarshal are `float64`, not `int`

**Next:** [33-time.md](33-time.md) — `time.Time` and RFC3339 in JSON.
