# 09. Lab: mini-CLI

## Goal

Build **one module** with a `store` package and `cmd/tasks`: add a task, list tasks, persist to JSON. This bridges to `go-intermediate`, where the same “tasks” domain moves to HTTP and Postgres.

**Time:** ~1.5 hours.

## Prerequisites

```bash
cd courses-en/go-basic/examples
```

Lessons 00–08 completed.

## Layout

```text
examples/
├── go.mod
├── cmd/tasks/main.go
├── internal/store/
│   ├── store.go
│   └── store_test.go
└── data/tasks.json      # created on first save
```

## Model

```go
type Task struct {
    ID        string    `json:"id"`
    Title     string    `json:"title"`
    Done      bool      `json:"done"`
    CreatedAt time.Time `json:"created_at"`
}
```

## Store (behavior)

Minimum methods:

- `Add(title string) (Task, error)` — validation: title non-empty, ≤ 200 chars
- `List() []Task`
- `MarkDone(id string) error`
- `Load() error` / `Save() error` — JSON file `data/tasks.json`

ID — `fmt.Sprintf("%d", time.Now().UnixNano())` or a counter — uniqueness within the file is what matters.

## CLI (flag)

No cobra — standard `flag`:

```bash
go run ./cmd/tasks -add "Buy milk"
go run ./cmd/tasks -list
go run ./cmd/tasks -done <id>
```

Flags: `-add`, `-list`, `-done`. On error — message to stderr, `os.Exit(1)`.

## Tests

In `store_test.go` — table-driven:

- add a valid task;
- empty title → error;
- `MarkDone` on a missing id → error.

```bash
go test ./...
go vet ./...
```

## Success criteria

- [ ] `go run ./cmd/tasks -add "test"` and `-list` show the task
- [ ] After restart, data loads from `data/tasks.json`
- [ ] Tests and `go vet` pass
- [ ] Thin `main`: logic in `internal/store`

## If you get stuck

| Symptom | Check |
|---------|-------|
| `cannot find package` | `go.mod` in `examples/`, full module import path |
| Empty JSON after save | `json.Marshal` of the slice, permissions on `data/` |
| Tests write the prod file | Use `t.TempDir()` and a temp path in tests |

Reference — `examples/solutions/` (if present) — **after** your own attempt.

Next: [10. What's next](10-next-steps.md).
