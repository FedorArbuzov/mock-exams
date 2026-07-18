# 34. Files and I/O: os, io, bufio, path/filepath

## What you'll learn

- Reading and writing a whole file: `os.ReadFile`, `os.WriteFile`.
- Streaming reads: `os.Open`, `io.Reader`, `bufio.Scanner`, `bufio.Reader`.
- Creating directories: `os.MkdirAll`.
- `filepath.Join`, `Base`, `Dir`, `Clean` — not string concatenation with `\`.
- Permissions `0o644`, `0o755`, and umask.
- Atomic writes via a temporary file plus rename.

---

## Paths: filepath, not manual slashes

```go
import "path/filepath"

path := filepath.Join("data", "shop", "products.json")
// data/shop/products.json on Unix
// data\shop\products.json on Windows

dir := filepath.Dir(path)   // data/shop
base := filepath.Base(path) // products.json
clean := filepath.Clean("../data/./products.json") // normalization
```

| Anti-pattern | Problem |
|-------------|----------|
| `"data" + "/" + name` | breaks on Windows |
| Hardcoded `C:\...` | doesn't port |
| A path from `os.Getwd()` without documenting it | depends on the cwd at startup |

**For the capstone:** the path to `tasks.json` is set via a `--data` flag defaulting to `data/tasks.json` relative to the **cwd**, or explicitly documented; an alternative is a path next to the executable via `os.Executable()` (more complex, optional).

---

## ReadFile and WriteFile — 80% of basic-level tasks

```go
package main

import (
	"log"
	"os"
)

func main() {
	data, err := os.ReadFile("data/products.json")
	if err != nil {
		if os.IsNotExist(err) {
			log.Println("file not found — starting with an empty catalog")
			data = []byte("[]")
		} else {
			log.Fatal(err)
		}
	}
	_ = data

	out := []byte(`{"ok":true}`)
	if err := os.WriteFile("data/out.json", out, 0o644); err != nil {
		log.Fatal(err)
	}
}
```

| Function | Behavior |
|---------|-----------|
| `os.ReadFile(name)` | the whole file → `[]byte` |
| `os.WriteFile(name, data, perm)` | create/overwrite |
| `os.MkdirAll(dir, 0o755)` | directories along the chain |
| `os.IsNotExist(err)` | the file is missing |
| `os.IsPermission(err)` | no permissions |

**Permissions `0o644`:** owner rw, everyone else r. Go 1.13+ octal literal: the `0o` prefix.

Before `WriteFile`, make sure the directory exists:

```go
if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
	return err
}
```

---

## Open + defer Close — large files and streams

```go
f, err := os.Open("access.log")
if err != nil {
	return err
}
defer f.Close()

// f implements io.Reader
```

`defer` guarantees the file is closed when the function returns. Leaking file descriptors in a loop without `Close` is a classic code-review bug.

---

## bufio.Scanner — reading line by line

```go
import (
	"bufio"
	"os"
)

f, err := os.Open("access.log")
if err != nil {
	return err
}
defer f.Close()

scanner := bufio.NewScanner(f)
for scanner.Scan() {
	line := scanner.Text()
	_ = line
}
if err := scanner.Err(); err != nil {
	return err
}
```

| When to use Scanner | When to use ReadFile |
|---------------|----------------|
| logs, CSV line by line | JSON as a whole, small configs |
| unknown size | size known and moderate |

**Line limit:** by default up to 64 KB per line; for very long lines, use `scanner.Buffer` or `bufio.Reader`.

### bufio.Reader and ReadString

```go
r := bufio.NewReader(f)
line, err := r.ReadString('\n')
```

More flexible than Scanner for custom delimiters.

---

## The io package — the Reader/Writer abstraction

```go
import "io"

n, err := io.Copy(dstWriter, srcReader)
```

`json.NewDecoder(r)` and `json.NewEncoder(w)` accept `io.Reader`/`io.Writer`.

Common types:

| Type | Role |
|-----|------|
| `os.File` | a file |
| `bytes.Buffer` | memory |
| `strings.Reader` | a string as a Reader |
| `http.Response.Body` | a response body *(intermediate)* |

---

## Checking existence and metadata

```go
info, err := os.Stat(path)
if os.IsNotExist(err) {
	// create it
} else if err != nil {
	return err
}
if info.IsDir() {
	return fmt.Errorf("%s is a directory", path)
}
```

`os.Stat` vs `os.Lstat` — the latter doesn't follow a symlink (rarely needed at the basic level).

---

## Atomic writes (important for persistence)

If the process crashes during `WriteFile`, the file can end up **truncated**. The pattern:

```go
func writeAtomic(path string, data []byte, perm os.FileMode) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, perm); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}
```

`Rename` on a single filesystem is atomic with respect to readers. In lab 35 and the capstone, this is the recommended approach for `tasks.json` / `products.json`.

---

## Working directory and flags

```go
import "flag"

dataPath := flag.String("data", "data/products.json", "path to JSON catalog")
flag.Parse()
```

Running it:

```bash
go run ./cmd/shop --data ./my/catalog.json
```

Document in the README: the path is **relative to the cwd**, not relative to the `.go` source file.

---

## Embed (overview)

Go 1.16+ — embed static files into the binary:

```go
import _ "embed"

//go:embed default_products.json
var defaultProducts []byte
```

Not required for the capstone; useful for a default config template.

---

## Common mistakes

1. **Didn't create the directory** before `WriteFile` — `no such file or directory`.

2. **Forgot `Close`** on `Open` without defer — hitting the open-file limit.

3. **Ignoring `scanner.Err()`** after the `Scan` loop — silently losing an I/O error.

4. **Concatenating paths** instead of using `filepath.Join`.

5. **Reading secrets into a string** without needing to — for passwords, later use `os.ReadFile` plus minimizing in-memory copies; at the basic level, just don't commit secrets into JSON.

6. **Two processes racing** to write the same file — an atomic rename reduces the risk of corrupted JSON but doesn't replace a file lock; for the CLI capstone, a single process is enough.

7. **A UTF-8 BOM** from Windows editors — `json.Unmarshal` can fail on it; save files as UTF-8 without a BOM.

---

## In production

- Configs: `0o600` permissions for sensitive files.
- Logs: rotation (out of scope at the basic level) — not one giant file.
- Containers: a volume mount for `data/`; the path via env/flag.
- CI: `go test` with `t.TempDir()` to isolate file-based tests.

---

## Summary

For the shop JSON catalog: `ReadFile` → `json.Unmarshal` → business logic → `json.MarshalIndent` → `writeAtomic`. For logs — `bufio.Scanner`. Paths — `filepath.Join`. Errors — handled explicitly, including `IsNotExist`. The next lab pulls all of this together into a working scenario.

---

## Checklist

- [ ] I use `filepath.Join` for paths
- [ ] Before writing, I call `MkdirAll` for the parent directory
- [ ] I handle `os.IsNotExist` on first run
- [ ] I know the atomic-write pattern via `.tmp` + `Rename`
- [ ] I close files with `defer f.Close()`

**Next:** [35-lab-json-files.md](35-lab-json-files.md) — hands-on persistence for shop data.
