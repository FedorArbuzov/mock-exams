# 07. Тесты и go vet

## go test

Тесты в файле `*_test.go`, package тот же или `package foo_test` (black-box).

```go
func TestAdd(t *testing.T) {
    got := Add(2, 3)
    want := 5
    if got != want {
        t.Fatalf("Add(2,3) = %d, want %d", got, want)
    }
}
```

```bash
go test ./...
go test -v ./internal/store
go test -race ./...    # гонки — позже обязательно в CI
```

## Table-driven tests

```go
func TestParseQty(t *testing.T) {
    tests := []struct {
        name  string
        input string
        want  int
        err   bool
    }{
        {"ok", "3", 3, false},
        {"bad", "x", 0, true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseQty(tt.input)
            if (err != nil) != tt.err {
                t.Fatalf("err = %v, want err=%v", err, tt.err)
            }
            if got != tt.want {
                t.Fatalf("got %d, want %d", got, tt.want)
            }
        })
    }
}
```

Стандартный стиль в Go-кодовых базах. Библиотеки вроде **testify** — в `go-testing`, не обязательны здесь.

## go vet

Статический анализ стандартной toolchain:

```bash
go vet ./...
```

Ловит подозрительные конструкции: неверные `Printf` verbs, unreachable code, copy lock.

## Линтеры (обзор)

| Инструмент | Назначение |
|------------|------------|
| `gofmt` / `goimports` | форматирование |
| `go vet` | базовые проверки |
| `staticcheck` | расширенный анализ |
| `golangci-lint` | агрегатор в CI |

На pet-проектах достаточно `go fmt ./...` и `go vet` перед push. В `gitlab-basic` добавите job `go test` + `golangci-lint`.

## Типичные ошибки

- Тесты в `main.go` — только `*_test.go`.
- Зависимость тестов от порядка выполнения — каждый тест изолирован.
- Игнорирование `-race` «пока мало кода» — привыкайте рано.

## Чек-лист

- [ ] Написали table-driven test
- [ ] `go test ./...` зелёный
- [ ] Запустили `go vet ./...`

Дальше: [08. JSON, файлы, time](08-json-files-time.md).
