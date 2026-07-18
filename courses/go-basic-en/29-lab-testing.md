# 29. Lab: testing

The goal is to write **table-driven tests** for code from the previous labs: `ParseUserID`, `LoadUser`, `Trim`/`Uppercase`. Optionally, testify.

**Time:** ~35-45 minutes.

## Setup

```bash
cd courses/go-basic-en/examples
go test ./lab/errors/... -v
go test ./lab/interfaces/... -v
go test -cover ./lab/...
```

Reference: `solutions/lab/errors/*_test.go`, `solutions/lab/interfaces/*_test.go`.

---

## Task 1. Tests for `ParseUserID`

File `lab/errors/parse_test.go`, package `errorslab` (or `errorslab_test` for black-box).

```go
func TestParseUserID(t *testing.T) {
    tests := []struct {
        name      string
        input     string
        wantID    int
        wantErr   bool
        wantIsVal bool // errors.As *ValidationError
    }{
        {"valid 1", "1", 1, false, false},
        {"valid 42", "42", 42, false, false},
        {"empty", "", 0, true, true},
        {"negative", "-5", 0, true, true},
        {"letters", "abc", 0, true, false},
        {"zero", "0", 0, true, true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            id, err := ParseUserID(tt.input)
            if (err != nil) != tt.wantErr {
                t.Fatalf("err=%v wantErr=%v", err, tt.wantErr)
            }
            if !tt.wantErr && id != tt.wantID {
                t.Errorf("id=%d want %d", id, tt.wantID)
            }
            if tt.wantIsVal {
                var ve *ValidationError
                if !errors.As(err, &ve) {
                    t.Errorf("want ValidationError, got %T", err)
                }
            }
        })
    }
}
```

---

## Task 2. Tests for `LoadUser` and `errors.Is`

```go
func TestLoadUser_NotFound(t *testing.T) {
    _, err := LoadUser(999)
    if !errors.Is(err, ErrNotFound) {
        t.Fatalf("got %v, want ErrNotFound", err)
    }
}

func TestLoadUser_OK(t *testing.T) {
    u, err := LoadUser(1)
    if err != nil {
        t.Fatal(err)
    }
    if u.Name != "Ann" {
        t.Errorf("name=%q", u.Name)
    }
}
```

---

## Task 3. Table-driven `GetUserByStringID`

One test, three rows in the table: success `"1"`, not found `"99"`, validation `""`.

Check that the wrapper **doesn't break** `errors.Is` for the 404 scenario.

---

## Task 4. Tests for transforms (interfaces lab)

`lab/interfaces/transform_test.go`:

```go
func TestTrim(t *testing.T) {
    tests := []struct {
        in, want string
    }{
        {"  a ", "a"},
        {"b", "b"},
        {"", ""},
    }
    tr := Trim{}
    for _, tt := range tests {
        if got := tr.Process(tt.in); got != tt.want {
            t.Errorf("Trim(%q)=%q want %q", tt.in, got, tt.want)
        }
    }
}

func TestUppercase(t *testing.T) {
    if got := Uppercase{}.Process("hi"); got != "HI" {
        t.Errorf("got %q", got)
    }
}
```

---

## Task 5. Integration test `TestRun_Pipeline`

```go
func TestRun_Pipeline(t *testing.T) {
    var lines []string
    sink := &collectSink{lines: &lines} // implement Write in the test

    err := Run(
        NewStringSource("  go "),
        []Transform{Trim{}, Uppercase{}},
        sink,
    )
    if err != nil {
        t.Fatal(err)
    }
    if len(lines) != 1 || lines[0] != "GO" {
        t.Fatalf("lines=%v", lines)
    }
}
```

`collectSink` — a local type in `_test.go`, don't export it.

---

## Task 6 (optional). testify

```bash
go get github.com/stretchr/testify@v1.9.0
go mod tidy
```

Rewrite **one** test with `require`/`assert`. Compare its readability against stdlib.

---

## Success criteria

| Command | Expectation |
|---------|----------|
| `go test ./lab/errors/...` | PASS, ≥3 test functions |
| `go test ./lab/interfaces/...` | PASS |
| `go test -cover ./lab/...` | coverage > 0% on packages with logic |
| `go test -run TestParseUserID/empty` | a single subtest |

---

## If something goes wrong

| Symptom | Fix |
|---------|---------|
| `undefined: ParseUserID` | package name / import path |
| parallel flaky | remove `t.Parallel` or isolate the state |
| `As` returns false | the wrapper doesn't use `%w` in production code |
| coverage 0% | tests are in `package xxx_test` without calling the API |

---

Next lesson: [30. Tooling: vet, linters](30-tooling.md).
