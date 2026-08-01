# 06. Пакеты и go mod

## Пакеты

Каждая папка с `.go` файлами — **один package** (обычно одно имя на каталог).

```text
mymodule/
├── go.mod
├── cmd/app/main.go      # package main — точка входа
└── internal/store/
    └── store.go         # package store
```

- **`package main`** — исполняемый бинарник (`func main`).
- **Имя с большой буквы** — экспорт (public API пакета).
- **`internal/`** — импорт только из родительского модуля (компилятор запрещает внешний import).

```go
// store/store.go
package store

func Load() error { }   // экспорт
func parse() { }        // только внутри пакета
```

Импорт:

```go
import "github.com/you/mymodule/internal/store"
```

## go mod

```bash
go mod init github.com/you/project
go get github.com/go-chi/chi/v5@latest
go mod tidy    # подчистить go.sum
```

`go.mod` — имя модуля и зависимости. `go.sum` — checksums (коммитить в git).

Версия Go в `go.mod`:

```go
go 1.22
```

## Сборка и запуск

```bash
go run ./cmd/app
go build -o bin/app ./cmd/app
go test ./...
```

`./...` — все пакеты рекурсивно от текущего модуля.

## Layout для go-intermediate

Типовая схема (упрощённо):

```text
cmd/api/main.go
internal/handler/
internal/service/
internal/repository/
```

На basic достаточно разнести **main** и **один internal-пакет** — как в [09-lab-mini-cli.md](09-lab-mini-cli.md).

## Типичные ошибки

- Циклический import между пакетами — рефакторинг: вынести общие типы в третий пакет.
- Запуск `go test` не из корня модуля.
- Импорт пути без домена (`import "store"`) — только внутри одного модуля с replace (редко).

## Чек-лист

- [ ] Понимаете экспорт по первой букве
- [ ] Сделали `go mod init` / работаете в существующем `go.mod`
- [ ] Знаете разницу `cmd/` и `internal/`

Дальше: [07. Тесты и go vet](07-testing-tooling.md).
