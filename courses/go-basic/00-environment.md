# 00. Окружение и первый запуск

## Зачем этот урок

Go ставится одним бинарником `go`, который компилирует, тестирует и качает зависимости. На `go-basic` всё на **хосте** — без Docker. Позже `go-intermediate` поднимет API в compose рядом с FastAPI `:8090`.

## Установка

Скачайте **Go 1.22+** с [go.dev/dl](https://go.dev/dl/). Проверка:

```bash
go version   # go1.22.x или новее
```

На Windows после установки **перезапустите терминал**. В CI зафиксируйте версию (поле `go` в `go.mod` или переменная в `.gitlab-ci.yml`).

## Первый запуск

Из каталога курса:

```bash
cd courses/go-basic/examples
go run ./lab/01hello
```

Ожидаемый вывод — приветствие, версия Go, OS/arch.

Минимальная программа:

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go")
}
```

`package main` + `func main()` — точка входа. Импорты только из стандартной библиотеки или модулей, объявленных в `go.mod`.

## Модуль и каталог

Корень проекта — папка с **`go.mod`**:

```go
module github.com/mock-exams/go-basic-labs

go 1.22
```

Запускайте команды **из `examples/`**, иначе `go run` не найдёт модуль (`cannot find main module`).

Исторический **GOPATH** (`~/go/src/...`) для новых проектов не нужен — используйте **Go modules** ([06-packages-modules.md](06-packages-modules.md)).

## Редактор

Установите **gopls** (часто вместе с расширением Go для VS Code/Cursor):

```bash
go install golang.org/x/tools/gopls@latest
```

Откройте workspace с корнем **`courses/go-basic/examples`**. Включите format on save — `gofmt` встроен в toolchain.

## Цикл работы

```text
правка .go → go run ./...  или  go test ./...
         ↓
    читать ошибку компилятора / теста
         ↓
    правка снова
```

Ошибки компилятора в Go обычно точные: «undefined: foo», «cannot use x (type int) as string».

## Типичные ошибки

| Симптом | Причина |
|---------|---------|
| `go: command not found` | Go не в PATH |
| `cannot find main module` | Запуск не из каталога с `go.mod` |
| Красные импорты в IDE | Нет gopls или открыт не тот корень |
| `package X is not in std` | Опечатка в импорте или нет `go get` |

## Чек-лист

- [ ] `go version` ≥ 1.22
- [ ] `go run ./lab/01hello` работает из `examples/`
- [ ] Понимаете, где лежит `go.mod`

Дальше: [01. Типы и переменные](01-types-variables.md).
