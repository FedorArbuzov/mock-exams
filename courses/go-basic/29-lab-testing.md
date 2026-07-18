# 29. Лаба: тестирование

Цель — написать **table-driven тесты** для кода из предыдущих лаб: `ParseUserID`, `LoadUser`, `Trim`/`Uppercase`. Опционально — testify.

**Время:** ~35–45 минут.

## Стенд

```bash
cd courses/go-basic/examples
go test ./lab/errors/... -v
go test ./lab/interfaces/... -v
go test -cover ./lab/...
```

Эталон: `solutions/lab/errors/*_test.go`, `solutions/lab/interfaces/*_test.go`.

---

## Задание 1. Тесты `ParseUserID`

Файл `lab/errors/parse_test.go`, пакет `errorslab` (или `errorslab_test` для black-box).

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

## Задание 2. Тесты `LoadUser` и `errors.Is`

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

## Задание 3. Table-driven `GetUserByStringID`

Один тест, три строки таблицы: success `"1"`, not found `"99"`, validation `""`.

Проверьте, что обёртка **не ломает** `errors.Is` для 404-сценария.

---

## Задание 4. Тесты transforms (interfaces lab)

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

## Задание 5. Интеграционный `TestRun_Pipeline`

```go
func TestRun_Pipeline(t *testing.T) {
    var lines []string
    sink := &collectSink{lines: &lines} // реализуйте Write в тесте

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

`collectSink` — локальный тип в `_test.go`, не экспортировать.

---

## Задание 6 (опционально). testify

```bash
go get github.com/stretchr/testify@v1.9.0
go mod tidy
```

Перепишите **один** тест с `require`/`assert`. Сравните читаемость со stdlib.

---

## Критерии успеха

| Команда | Ожидание |
|---------|----------|
| `go test ./lab/errors/...` | PASS, ≥3 тестовых функции |
| `go test ./lab/interfaces/...` | PASS |
| `go test -cover ./lab/...` | cover > 0% на пакетах с логикой |
| `go test -run TestParseUserID/empty` | один подтест |

---

## Troubleshooting

| Симптом | Решение |
|---------|---------|
| `undefined: ParseUserID` | package name / import path |
| parallel flaky | уберите `t.Parallel` или изолируйте state |
| `As` false | обёртка без `%w` в прод-коде |
| cover 0% | тесты в `package xxx_test` без вызова API |

---

Следующий урок: [30. Tooling: vet, linters](30-tooling.md).
