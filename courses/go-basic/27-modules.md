# 27. Модули: go mod init, go get, go.sum

## Модуль vs GOPATH (кратко)

| Эпоха | Модель |
|-------|--------|
| GOPATH (legacy) | Код в `$GOPATH/src`, версии — вручную |
| **Modules** (сейчас) | `go.mod` в корне репо, версии в файле |

На работе — **только modules**.

## go mod init

```bash
mkdir shop-cli && cd shop-cli
go mod init github.com/acme/shop-cli
```

Создаётся `go.mod`:

```go
module github.com/acme/shop-cli

go 1.22
```

**module path** — префикс импорта внутри проекта:

```go
import "github.com/acme/shop-cli/internal/catalog"
```

Правила выбора path:

- публичный репо — путь как на GitHub/GitLab;
- учебный/local — `example.com/foo` или `github.com/mock-exams/go-basic-labs`.

Лабы курса:

```bash
cd courses/go-basic/examples
cat go.mod
# module github.com/mock-exams/go-basic-labs
```

## go get — добавление зависимостей

```bash
go get github.com/stretchr/testify@v1.9.0
go get golang.org/x/text@latest
go get github.com/go-chi/chi/v5@v5.0.12
```

Обновляет `go.mod` и **go.sum**. Без версии — последняя совместимая по MVS.

| Команда | Действие |
|---------|----------|
| `go get pkg@version` | добавить/изменить версию |
| `go get -u ./...` | обновить зависимости (осторожно в prod) |
| `go get pkg@none` | удалить зависимость |

После правок руками — **всегда**:

```bash
go mod tidy
```

Удаляет неиспользуемые, дописывает недостающие, синхронизирует sum.

## go.sum — контрольные суммы

`go.sum` — **не** lockfile в полном смысле, а криптографические хеши **конкретных** версий модулей:

```text
github.com/stretchr/testify v1.9.0 h1:... 
github.com/stretchr/testify v1.9.0/go.mod h1:...
```

| Вопрос | Ответ |
|--------|-------|
| Коммитить в git? | **Да** |
| Редактировать вручную? | **Нет** |
| `go mod verify` | проверка целостности кэша |

CI типично:

```bash
go mod verify
go mod tidy -diff   # Go 1.22+: fail если tidy меняет файлы
```

Отсутствие строки в `go.sum` при импорте — частая ошибка новичка после копипасты `import`.

## Минимальный модуль лаб

```text
examples/
├── go.mod
├── go.sum          # после первого get/tidy
├── lab/
│   └── 01hello/
│       └── main.go
└── greet/
    └── hello.go
```

`go.mod`:

```go
module github.com/mock-exams/go-basic-labs

go 1.22
```

Запуск:

```bash
go run ./lab/01hello
go test ./...
```

Зависимостей нет — `go.sum` может быть пустым или отсутствовать до первого external import.

## Версии и MVS (Minimal Version Selection)

Go выбирает **минимальные** версии, удовлетворяющие всем `require` в графе — предсказуемые сборки, меньше «dependency hell», чем в некоторых экосистемах.

`go.mod` директива:

```go
require (
    github.com/stretchr/testify v1.9.0
)

require golang.org/x/sys v0.18.0 // indirect
```

`// indirect` — транзитивная зависимость, не импортируемая напрямую из вашего кода.

## replace и локальная разработка

```go
replace github.com/acme/lib => ../lib
```

Для форка или монорепо. **Не** злоупотребляйте в опубликованных модулях — потребители не увидят ваш `replace`.

## go work (обзор)

Несколько модулей в одном workspace:

```bash
go work init ./shop-api ./shop-cli
```

Файл `go.work` — локально, обычно **не** коммитят (или коммитят в mono-repo). На `go-basic` достаточно знать, что существует.

## Vendor (кратко)

```bash
go mod vendor
```

Копирует зависимости в `vendor/` — для air-gapped CI или воспроизводимости без прокси. Флаг `-mod=vendor` при сборке. На basic — опционально.

## Типичный workflow разработчика

```bash
git clone ...
cd service
go mod download    # прогреть кэш (опционально)
go test ./...
# добавили import "github.com/go-chi/chi/v5"
go mod tidy
git add go.mod go.sum
```

Перед MR:

```bash
go mod verify
go test ./...
```

## Типичные ошибки

- **Не закоммитили go.sum** — CI у коллег падает.
- **Ручное редактирование go.sum** — corruption; только `go mod tidy` / `go get`.
- **module path не совпадает с git remote** — путаница при `go install`.
- **Версия Go в go.mod** ниже фич в коде — `go 1.22` vs generics на старом toolchain.
- **Забыли tidy** после удаления import — мусор в `require`.
- **replace** в публичном модуле без документации.

## Чек-лист

- Что записывает `go mod init`?
- Зачем `go mod tidy`?
- Коммитить ли `go.sum`?
- Чем `direct` отличается от `// indirect` require?
- Что делает `go mod verify`?
- Какой module path у лаб курса?

Следующий урок: [28. Тестирование](28-testing.md).
