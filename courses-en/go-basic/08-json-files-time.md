# 08. JSON, files, time

The minimum for CLIs and for reading configs/APIs in `go-intermediate`.

## encoding/json

```go
type Task struct {
    ID     string    `json:"id"`
    Title  string    `json:"title"`
    Done   bool      `json:"done"`
    Tags   []string  `json:"tags,omitempty"`
}

data, err := json.Marshal(t)
err = json.Unmarshal(data, &t)
```

- Tags `json:"field_name"` — name in JSON.
- `omitempty` — skip zero values.
- **Unmarshal only into a pointer:** `json.Unmarshal(data, &t)`.

For HTTP in intermediate you will use `json.NewEncoder(w).Encode(v)` — same tags.

## Files

```go
data, err := os.ReadFile("data/tasks.json")
err = os.WriteFile("data/tasks.json", data, 0o644)
```

Create the directory first or handle `os.IsNotExist`.

Line-by-line reading:

```go
scanner := bufio.NewScanner(f)
for scanner.Scan() {
    line := scanner.Text()
}
```

Paths: `filepath.Join("data", "tasks.json")` — cross-platform.

## time

```go
now := time.Now().UTC()
s := now.Format(time.RFC3339)
parsed, err := time.Parse(time.RFC3339, s)
```

Layout in Go is the **reference date** `Mon Jan 2 15:04:05 MST 2006`, not `YYYY-MM-DD`.

For “now + 24h”: `time.Now().Add(24 * time.Hour)`.

## Common mistakes

- Unmarshal into a value, not a pointer.
- Missing tags — JSON `user_id` won’t match field `UserID` without a tag.
- Comparing `time.Time` without `.UTC()` — different zones.

## Checklist

- [ ] Struct serializes to JSON with tags
- [ ] Read/wrote a file via `os`
- [ ] Formatted time as RFC3339

Next: [09. Lab: mini-CLI](09-lab-mini-cli.md).
