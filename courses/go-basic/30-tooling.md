# 30. Tooling: go vet, staticcheck, golangci-lint, gofmt

## gofmt и gofmt -w

**gofmt** — каноническое форматирование (отступы, пробелы, выравнивание):

```bash
gofmt -w .
gofmt -d file.go    # diff без записи
```

С Go 1.19+ для импортов часто используют **goimports** (добавляет/удаляет import при format):

```bash
go install golang.org/x/tools/cmd/goimports@latest
goimports -w .
```

| Инструмент | Что делает |
|------------|------------|
| gofmt | только формат |
| goimports | формат + import |

**Правило:** не спорьте с gofmt в code review — весь репозиторий в одном стиле. IDE: format on save с goimports.

## go vet

Анализ **очевидных** ошибок, без внешних зависимостей:

```bash
go vet ./...
```

Примеры находок:

```go
fmt.Printf("%d", "wrong")     // printf: wrong type
log.Fatal("err")              // vet: log.Fatal не форматирует как Fatal
lock(); lock()                  // lock copy (если value receiver)
resp, _ := http.Get(url)        // lost cancel — см. body close
```

В CI:

```yaml
script:
  - go vet ./...
  - go test ./...
```

`go test` **не заменяет** vet — разные проверки.

## staticcheck

Глубже stdlib: dead code, упрощения, API misuse, ST1000 (документация пакета):

```bash
go install honnef.co/go/tools/cmd/staticcheck@latest
staticcheck ./...
```

Примеры:

```go
if err == nil {
    return err
}
// staticcheck: should use 'return nil' instead

var err error = errors.New("x")
// SA4006: value never used
```

Отдельный бинарник; часто **включён** в golangci-lint как linter `staticcheck`.

## golangci-lint — мета-линтер

Один CLI запускает govet, staticcheck, errcheck, gosimple, ineffassign, revive и др.

Установка:

```bash
# см. https://golangci-lint.run/welcome/install/
golangci-lint --version
```

Запуск:

```bash
golangci-lint run ./...
golangci-lint run --new-from-rev=origin/main
```

Минимальный `.golangci.yml` в корне:

```yaml
run:
  timeout: 5m
linters:
  enable:
    - govet
    - errcheck
    - staticcheck
    - gosimple
    - ineffassign
    - unused
    - gofmt
    - goimports
issues:
  exclude-use-default: false
```

| Linter | Зачем |
|--------|-------|
| errcheck | неигнорированные `err` |
| ineffassign | присваивание без использования |
| unused | мёртвый код |
| revive | стиль, naming (замена golint) |

На `go-basic` достаточно default набора без кастомной политики.

## errcheck — друг `if err != nil`

```go
os.Remove(path)  // errcheck: Error return value not checked
```

Иногда намеренно:

```go
_ = w.Write([]byte("ok")) // nolint:errcheck // best-effort response
```

Лучше явный комментарий, чем молчаливый `_`.

## Интеграция в IDE

VS Code / Cursor с **gopls**:

- diagnostics от компилятора;
- `go vet` on save (настройка);
- golangci-lint как **additional** linter (extension).

`gopls` ≠ полная замена golangci-lint в CI.

## Типичный pipeline MR

```text
1. gofmt / goimports -w
2. go mod tidy
3. go vet ./...
4. golangci-lint run ./...
5. go test -race ./...
```

## Что линтить в учебном проекте

```bash
cd courses/go-basic/examples
golangci-lint run ./...
```

Ожидаемые замечания на учебном коде — повод их исправить.

## Отключение правила (осторожно)

```go
//nolint:errcheck
func flush() { ... }
```

Или в `.golangci.yml` `issues.exclude-rules`. Не отключайте линтеры глобально из-за лени — только точечно с комментарием **почему**.

## go mod и tooling

```bash
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

Версия линтера в CI должна быть **зафиксирована** (docker image или pinned version), иначе «у меня зелёное» vs failed pipeline.

## Типичные ошибки

- **Нет gofmt в CI** — войны пробелов в git blame.
- **Только test, без vet** — пропуск printf-багов.
- **Игнорировать errcheck** везде через `_`.
- **Разные версии golangci-lint** локально и в CI.
- **nolint на весь файл** — маскировка долга.
- **Линтить vendor/** — шум; исключите в config.

## Чек-лист

- Чем gofmt отличается от goimports?
- Что находит `go vet`, чего не находит `go test`?
- Зачем golangci-lint, если есть staticcheck?
- Что проверяет errcheck?
- Какой порядок команд перед push?
- Где хранить `.golangci.yml`?

Следующий урок: [31. Лаба: линтеры](31-lab-tooling.md).
