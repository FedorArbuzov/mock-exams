# 31. Лаба: линтеры и vet на lab-коде

Цель — прогнать **gofmt**, **go vet**, **staticcheck** (или **golangci-lint**) на пакетах `lab/errors` и `lab/interfaces`, исправить замечания. Практика pipeline перед merge.

**Время:** ~25–35 минут.

## Стенд

```bash
cd courses/go-basic/examples
go version
go test ./...
```

Установите (один раз на машине):

```bash
go install golang.org/x/tools/cmd/goimports@latest
go install honnef.co/go/tools/cmd/staticcheck@latest
# опционально: golangci-lint по инструкции с golangci-lint.run
```

---

## Задание 1. gofmt / goimports

```bash
gofmt -l .
goimports -l .
```

Если есть вывод — исправьте:

```bash
goimports -w ./lab/...
```

**Критерий:** `gofmt -l ./lab` пустой.

---

## Задание 2. go vet

```bash
go vet ./...
```

Типичные учебные баги для поиска в своём коде:

| Паттерн | Исправление |
|---------|-------------|
| `fmt.Printf("%d", id)` где `id string` | `%s` или `%v` |
| `defer` после `os.Open` только на success path | defer сразу после успешного Open |
| copy mutex | pointer receiver |

Исправьте все finding'и vet до чистого вывода.

---

## Задание 3. staticcheck

```bash
staticcheck ./...
```

Обратите внимание на:

- **SA4006** — неиспользуемые присваивания (`result, err := ...` без `result`);
- **ST1000** — нет package comment (добавьте в `doc.go` одну строку);
- упрощённые ветки `if err != nil { return err }; return nil` → `return err`.

Пример `doc.go`:

```go
// Package errorslab provides error-handling exercises for go-basic course.
package errorslab
```

---

## Задание 4. golangci-lint (опционально)

Создайте `.golangci.yml` в `examples/`:

```yaml
run:
  timeout: 3m
linters:
  enable:
    - govet
    - errcheck
    - staticcheck
    - ineffassign
    - unused
```

```bash
golangci-lint run ./lab/...
```

### Специально исправьте errcheck

Если в лабе 22 `ConsoleSink.Write` игнорирует ошибку `fmt.Printf` — ок; но **не** оставляйте:

```go
os.Remove(tmp) // без проверки в production-коде
```

В учебном `main` допустимо:

```go
if err := os.Remove(tmp); err != nil {
    log.Printf("cleanup: %v", err)
}
```

---

## Задание 5. Чек-лист перед «merge»

Выполните по порядку и сохраните вывод в `lab/tooling-check.txt` (опционально):

```bash
go mod tidy
goimports -w ./lab/...
go vet ./...
staticcheck ./...
go test -race ./...
```

Все команды — exit code 0.

---

## Задание 6. Намеренное нарушение (эксперимент)

В отдельной ветке или файле `lab/badlint/example.go` (не коммитьте в main):

```go
package badlint

import "fmt"

func BadPrintf(n int) {
    fmt.Printf("%s", n) // vet: wrong type
}

func Unused() {
    x := 1
    _ = x
}
```

Запустите `go vet` и `staticcheck` — убедитесь, что находят. Удалите файл или ветку после эксперимента.

---

## Критерии успеха

| Шаг | Ожидание |
|-----|----------|
| gofmt/goimports | нет diff |
| go vet ./... | чисто |
| staticcheck ./... | чисто |
| go test -race ./lab/... | PASS |
| golangci-lint (если есть) | 0 issues |

---

## Troubleshooting

| Симптом | Решение |
|---------|---------|
| staticcheck not found | `go install` + `$GOPATH/bin` в PATH |
| errcheck на `defer Close` | Close возвращает err — обработать или nolint с причиной |
| линтер ругается на examples/solutions | `run: skip-dirs: solutions` в yml |
| -race долго | нормально для первого раза |

---

Следующий урок: [32. encoding/json](32-json.md).
